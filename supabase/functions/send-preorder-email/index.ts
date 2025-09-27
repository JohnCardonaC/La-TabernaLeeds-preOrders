// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Send Preorder Email Function")

// Rate limiting simple (en memoria - para producción usar Redis)
const rateLimitMap = new Map<string, number>()

function checkRateLimit(key: string, windowSeconds: number): boolean {
  const now = Date.now()
  const windowStart = now - (windowSeconds * 1000)
  
  // Limpiar entradas antiguas
  for (const [k, timestamp] of rateLimitMap.entries()) {
    if (timestamp < windowStart) {
      rateLimitMap.delete(k)
    }
  }
  
  // Verificar si ya se envió recientemente
  const lastSent = rateLimitMap.get(key)
  if (lastSent && lastSent > windowStart) {
    return true // Rate limit exceeded
  }
  
  // Registrar envío
  rateLimitMap.set(key, now)
  return false
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record

    if (!record) {
      throw new Error('No record in payload')
    }

    const bookingReference = record.booking_reference
    const customerId = record.customer_id
    const bookingId = record.id

    if (!bookingReference || !customerId || !bookingId) {
      throw new Error('Missing booking_reference, customer_id, or id')
    }

    let logEntry: any = null

    // Rate limiting: máximo 1 email por cliente cada 5 minutos
    const rateLimitKey = `email_${customerId}`
    if (checkRateLimit(rateLimitKey, 300)) { // 300 segundos = 5 minutos
      console.log(`Rate limit exceeded for customer: ${customerId}`)
      return new Response(
        JSON.stringify({ success: true, message: 'Email skipped due to rate limit' }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Cambiar ANON_KEY por SERVICE_ROLE_KEY
    )

    // Query customer email
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('customer_email')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      throw new Error(`Failed to fetch customer: ${customerError?.message}`)
    }

    const customerEmail = customer.customer_email

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerEmail)) {
      throw new Error('Invalid customer email format')
    }

    // Query access token
    const { data: accessToken, error: tokenError } = await supabase
      .from('access_tokens')
      .select('token')
      .eq('booking_id', bookingId)
      .single()

    if (tokenError || !accessToken) {
      throw new Error(`Failed to fetch access token: ${tokenError?.message}`)
    }

    const token = accessToken.token

    // Generate preorder URL
    const siteUrl = Deno.env.get('SITE_URL') || 'https://latabernaleeds.com'
    if (!siteUrl) {
      throw new Error('SITE_URL not set')
    }
    
    // Validar que SITE_URL sea HTTPS
    if (!siteUrl.startsWith('https://')) {
      throw new Error('SITE_URL must use HTTPS')
    }
    
    const preorderUrl = `${siteUrl}/preorder?token=${token}`

    // Get and validate Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not set')
    }

    // Validar formato de API key
    if (!resendApiKey.startsWith('re_')) {
      throw new Error('Invalid RESEND_API_KEY format')
    }

    // Prepare notification log entry
    logEntry = {
      timestamp: new Date().toISOString(),
      success: false,
      method: 'automatic',
      email: customerEmail,
      preorder_url: preorderUrl,
      error: null as string | null
    }

    // Send email with Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'La Taberna <noreply@latabernaleeds.com>',
        to: [customerEmail],
        subject: 'Tu enlace para pre-orden de La Taberna',
        html: `
          <p>Hola,</p>
          <p>Has realizado una reserva en La Taberna. Para hacer tu pre-orden, haz clic en el siguiente enlace:</p>
          <p><a href="${preorderUrl}">${preorderUrl}</a></p>
          <p>¡Gracias!</p>
        `
      })
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      throw new Error(`Resend API error: ${errorText}`)
    }

    // Mark log entry as successful
    logEntry.success = true

    // Update preorder_url in bookings
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ preorder_url: preorderUrl })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Failed to update preorder_url:', updateError.message)
      // No throw, email was sent successfully
    }

    // Update notification_log
    const { error: logUpdateError } = await supabase
      .from('bookings')
      .update({
        notification_log: supabase.sql`notification_log || ${JSON.stringify([logEntry])}::jsonb`
      })
      .eq('id', bookingId)

    if (logUpdateError) {
      console.error('Failed to update notification_log:', logUpdateError.message)
    }

    console.log(`Email sent successfully to ${customerEmail} for booking ${bookingReference}`)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error('Error in send-preorder-email:', (error as Error).message)

    // Log the error in notification_log if logEntry exists
    if (logEntry) {
      logEntry.success = false
      logEntry.error = (error as Error).message
      const { error: logError } = await supabase
        .from('bookings')
        .update({
          notification_log: supabase.sql`notification_log || ${JSON.stringify([logEntry])}::jsonb`
        })
        .eq('id', bookingId)

      if (logError) {
        console.error('Failed to update notification_log on error:', logError.message)
      }
    }

    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
