# Plantillas de Email para Supabase - Password Recovery

## ⚠️ IMPORTANTE: Configuración Manual Requerida

**Debes configurar esto manualmente en tu dashboard de Supabase:**

### PASO 1: Ve al Dashboard de Supabase
1. Abre tu proyecto en [supabase.com](https://supabase.com)
2. Ve a **Authentication > Email Templates**
3. Selecciona la plantilla **"Reset Password"**

### PASO 2: Copia y Pega Esta Plantilla

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset Your Password - La Taberna</title>
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
              <img src="https://res.cloudinary.com/dycdigital/image/upload/v1758807509/logo-black_fgjop4.png" alt="La Taberna" width="180" style="display: block; margin: 0 auto; max-width: 180px; height: auto; border: 0;">
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <!-- Greeting -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a; line-height: 1.4;">Reset Your Password</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 40px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                    We received a request to reset your password. Click the button below to create a new password:
                  </td>
                </tr>
              </table>

              <!-- Reset Password Button Section -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 40px;">
                <tr>
                  <td style="padding: 40px 30px; background-color: #fafafa; text-align: center; border-radius: 8px;">
                    <p style="margin: 0 0 25px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">Reset Your Password</p>
                    <a href="https://preorder.latabernaleeds.com/auth/reset-password" style="display: inline-block; padding: 16px 40px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500; border-radius: 8px; letter-spacing: 0.3px;">Reset Password</a>
                    <p style="margin: 25px 0 0 0; font-size: 14px; color: #888888; word-break: break-all;">
                      Or copy this link: <a href="https://preorder.latabernaleeds.com/auth/reset-password" style="color: #1a1a1a; text-decoration: underline;">https://preorder.latabernaleeds.com/auth/reset-password</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; background-color: #fff3cd; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #856404; text-align: center;">
                    <strong>Security Notice:</strong> This link will expire in 1 hour for your security. If you didn't request this password reset, please ignore this email.
                  </td>
                </tr>
              </table>

              <!-- Restaurant Information -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px; padding-top: 30px; border-top: 1px solid #e5e5e5;">
                <tr>
                  <td style="padding-bottom: 20px; font-size: 15px; line-height: 1.8; color: #4a4a4a; text-align: center;">
                    <strong style="color: #1a1a1a;">La Taberna</strong><br>
                    Questions? Contact our support team
                  </td>
                </tr>
              </table>

              <!-- Thank You Message -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 20px; font-size: 16px; line-height: 1.6; color: #1a1a1a; text-align: center; font-weight: 600;">
                    Thank you for choosing La Taberna!
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 40px 40px; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <!-- Footer Text -->
                <tr>
                  <td style="padding-top: 20px; text-align: center; font-size: 13px; line-height: 1.6; color: #888888; border-top: 1px solid #e5e5e5;">
                    <p style="margin: 15px 0 0 0;">© 2024 La Taberna. All rights reserved.<br>
                      This is an automated message, please do not reply to this email.</p>
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
</html>
```

**⚠️ NOTA:** Reemplacé las variables de Supabase (`{{ .SiteURL }}`, `{{ .TokenHash }}`, etc.) con URLs directas porque el enlace que recibiste muestra que Supabase está usando `/login` en lugar de `/auth/reset-password`. Usa esta plantilla tal cual.

### PASO 3: Configurar URL de Redirección
1. Ve a **Authentication > Settings**
2. En **Redirect URLs** agrega: `https://tudominio.com/auth/reset-password`

### Variables de Supabase

- `{{ .SiteURL }}` - La URL de tu sitio
- `{{ .TokenHash }}` - El token único para la recuperación
- `{{ .RedirectTo }}` - URL de redirección después del reset

### Configuración de URL de Redirección

Asegúrate de que en **Authentication > Settings** tengas configurada la URL de redirección correcta:

- **Redirect URL**: `https://tudominio.com/auth/reset-password`

### Configuración SMTP (Opcional pero Recomendada)

Para envío de emails personalizado, ve a **Authentication > Settings > SMTP Settings**:

```json
{
  "external_email_enabled": true,
  "smtp_admin_email": "no-reply@tudominio.com",
  "smtp_host": "smtp.tu-proveedor.com",
  "smtp_port": 587,
  "smtp_user": "tu-usuario-smtp",
  "smtp_pass": "tu-contraseña-smtp",
  "smtp_sender_name": "La Taberna"
}
```

## Archivos Creados

Se han creado las siguientes páginas para manejar el flujo de password recovery:

1. **`/forgot-password`** - Página para solicitar el email de recuperación
2. **`/auth/reset-password`** - Página para establecer nueva contraseña usando el token

## Próximos Pasos

1. Configura la plantilla de email en tu dashboard de Supabase
2. Configura la URL de redirección en Authentication Settings
3. Opcionalmente configura SMTP para envío personalizado de emails
4. Prueba el flujo completo de recuperación de contraseña

## Notas de Seguridad

- Los tokens de recuperación expiran después de un tiempo (configurable en Supabase)
- Los enlaces solo pueden ser usados una vez
- Se recomienda configurar límites de rate limiting para solicitudes de recuperación