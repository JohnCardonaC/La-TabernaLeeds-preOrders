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
    const numberOfPeople = record.number_of_people

    if (!bookingReference || !customerId || !bookingId) {
      throw new Error('Missing booking_reference, customer_id, or id')
    }

    // Check if this booking qualifies for pre-order emails
    const { data: settings } = await supabase
      .from('preorders_settings')
      .select('min_large_table_size')
      .single()

    if (!settings) {
      throw new Error('Pre-order settings not found')
    }

    const minLargeTableSize = settings.min_large_table_size

    // Skip email if booking doesn't meet minimum size requirement
    if (numberOfPeople < minLargeTableSize) {
      console.log(`Booking ${bookingReference} has ${numberOfPeople} people, minimum is ${minLargeTableSize}. Skipping email.`)
      return new Response(
        JSON.stringify({
          success: true,
          message: `Booking skipped - only ${numberOfPeople} people, minimum ${minLargeTableSize} required`
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    let logEntry: any = null

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Cambiar ANON_KEY por SERVICE_ROLE_KEY
    )

    // Rate limiting: máximo 1 email por cliente cada 5 minutos
    const rateLimitKey = `email_${customerId}`
    if (checkRateLimit(rateLimitKey, 300)) { // 300 segundos = 5 minutos
      console.log(`Rate limit exceeded for customer: ${customerId}`)
      return new Response(
        JSON.stringify({ success: true, message: 'Email skipped due to rate limit' }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    // Query customer email and name
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('customer_email, customer_name')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      throw new Error(`Failed to fetch customer: ${customerError?.message}`)
    }

    const customerEmail = customer.customer_email
    const customerName = customer.customer_name || 'Valued Customer'

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
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Complete Your Pre-Order - La Taberna Leeds</title>
  <!--[if mso]>
    <style type="text/css">
        table {border-collapse: collapse; border-spacing: 0; margin: 0;}
        div, td {padding: 0;}
        div {margin: 0 !important;}
    </style>
    <![endif]-->
</head>

<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Wrapper Table -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; max-width: 600px;">

          <!-- Logo Header -->
          <tr>
            <td style="padding: 50px 40px 40px 40px; text-align: center; background-color: #ffffff;">
              <img src="https://latabernaleeds.com/bookings/mails/images/logo-black.png" alt="La Taberna Leeds" width="180" style="display: block; margin: 0 auto; max-width: 180px; height: auto; border: 0;">
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">

              <!-- Greeting -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a; line-height: 1.4;">Hello ${customerName},</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 40px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                    You have made a reservation at La Taberna. To complete your pre-order, please click on the link below:
                  </td>
                </tr>
              </table>

              <!-- Pre-Order Button Section -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 40px;">
                <tr>
                  <td style="padding: 40px 30px; background-color: #fafafa; text-align: center; border-radius: 8px;">
                    <p style="margin: 0 0 25px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">Complete Your Pre-Order</p>
                    <a href="${preorderUrl}" style="display: inline-block; padding: 16px 40px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500; border-radius: 8px; letter-spacing: 0.3px;">Access Pre-Order Form</a>
                    <p style="margin: 25px 0 0 0; font-size: 14px; color: #888888; word-break: break-all;">
                      Or copy this link: <a href="${preorderUrl}" style="color: #1a1a1a; text-decoration: underline;">${preorderUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Restaurant Information -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px; padding-top: 30px; border-top: 1px solid #e5e5e5;">
                <tr>
                  <td style="padding-bottom: 20px; font-size: 15px; line-height: 1.8; color: #4a4a4a; text-align: center;">
                    <strong style="color: #1a1a1a;">La Taberna Leeds</strong><br>
                    Britannia House, 16 York Place<br>
                    Leeds, UK – LS1 2EU
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px; font-size: 15px; color: #4a4a4a; text-align: center;">
                    <strong style="color: #1a1a1a;">Phone:</strong>
                    <a href="tel:+4401132450871" style="color: #1a1a1a; text-decoration: none;">+44 0113 245 0871</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 30px; font-size: 15px; color: #4a4a4a; text-align: center;">
                    <strong style="color: #1a1a1a;">Website:</strong>
                    <a href="https://www.latabernaleeds.com" style="color: #1a1a1a; text-decoration: none;">www.latabernaleeds.com</a>
                  </td>
                </tr>
              </table>

              <!-- Thank You Message -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 20px; font-size: 16px; line-height: 1.6; color: #1a1a1a; text-align: center; font-weight: 600;">
                    Thank you!
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 40px 40px; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <!-- Social Links -->
                <tr>
                  <td style="padding-bottom: 25px; text-align: center;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">Follow us on Instagram: <a href="https://www.instagram.com/latabernaleeds/" style="color: #1a1a1a; text-decoration: none; font-weight: 600;">@latabernaleeds</a></p>
                  </td>
                </tr>
                <!-- TripAdvisor Logos -->
                <tr>
                  <td style="padding-bottom: 20px; text-align: center;">
                    <a href="https://www.tripadvisor.co.uk/Restaurant_Review-g186411-d14158468-Reviews-La_Taberna_Leeds-Leeds_West_Yorkshire_England.html" style="display: inline-block; margin: 0 10px;">
                      <img src="https://latabernaleeds.com/bookings/mails/images/tripadvisor.png" alt="TripAdvisor" width="120" style="display: inline-block; height: auto; border: 0; vertical-align: middle;">
                    </a>
                    <a href="https://www.tripadvisor.co.uk/Restaurant_Review-g186411-d14158468-Reviews-La_Taberna_Leeds-Leeds_West_Yorkshire_England.html" style="display: inline-block; margin: 0 10px;">
                      <img src="https://latabernaleeds.com/bookings/mails/images/bestofbest.png" alt="Best of Best" width="120" style="display: inline-block; height: auto; border: 0; vertical-align: middle;">
                    </a>
                  </td>
                </tr>
                <!-- Footer Text -->
                <tr>
                  <td style="padding-top: 20px; text-align: center; font-size: 13px; line-height: 1.6; color: #888888; border-top: 1px solid #e5e5e5;">
                    <p style="margin: 15px 0 0 0;">© 2024 La Taberna Leeds. All rights reserved.<br>
                      Britannia House, 16 York Place, Leeds, UK – LS1 2EU</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>

</html>`
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
