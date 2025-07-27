import { MailService } from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<boolean> {
  const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
  
  const resetHTML = `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🔐 Recuperación de Contraseña</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Cuba Properties</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">Solicitud de recuperación de contraseña</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta asociada a <strong>${userEmail}</strong>.
          </p>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #856404; margin: 0; font-weight: bold;">⚠️ Importante:</p>
            <p style="color: #856404; margin: 5px 0 0 0;">Este enlace expirará en 1 hora por seguridad.</p>
          </div>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
            Haz clic en el siguiente botón para crear una nueva contraseña:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.4; margin-top: 25px;">
            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
            <a href="${resetURL}" style="color: #dc3545; word-break: break-all;">${resetURL}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          
          <p style="color: #888; font-size: 14px; text-align: center; margin-bottom: 0;">
            Si no solicitaste este cambio, puedes ignorar este email de forma segura.<br>
            <em>Equipo de Cuba Properties</em>
          </p>
        </div>
      </body>
    </html>
  `;

  const resetText = `
Recuperación de Contraseña - Cuba Properties

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta: ${userEmail}

Para crear una nueva contraseña, haz clic en el siguiente enlace:
${resetURL}

⚠️ IMPORTANTE: Este enlace expirará en 1 hora por seguridad.

Si no solicitaste este cambio, puedes ignorar este email de forma segura.

Equipo de Cuba Properties
  `;

  return await sendEmail({
    to: userEmail,
    from: 'noreply@tudominio.com', // Cambiar por tu dominio verificado en SendGrid
    subject: '🔐 Recuperación de contraseña - Cuba Properties',
    text: resetText,
    html: resetHTML
  });
}

export async function sendWelcomeEmail(userEmail: string): Promise<boolean> {
  const welcomeHTML = `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">¡Bienvenido a Cuba Properties!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Tu plataforma para explorar propiedades en Cuba</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">¡Gracias por unirte a nuestra comunidad!</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Estamos emocionados de tenerte como parte de Cuba Properties. Ahora puedes:
          </p>
          
          <ul style="color: #555; line-height: 1.8; margin-bottom: 25px;">
            <li><strong>Explorar propiedades</strong> en todo Cuba con nuestro mapa interactivo</li>
            <li><strong>Crear y gestionar</strong> tus propias publicaciones de propiedades</li>
            <li><strong>Subir hasta 7 fotos</strong> por propiedad para mostrar lo mejor de tu inmueble</li>
            <li><strong>Contactar directamente</strong> con compradores y vendedores</li>
            <li><strong>Buscar por zonas</strong> específicas en Cuba</li>
          </ul>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 25px;">
            <h3 style="color: #667eea; margin-top: 0;">💡 Consejo para empezar:</h3>
            <p style="color: #555; margin-bottom: 0;">
              Inicia sesión con tu email <strong>${userEmail}</strong> y comienza a explorar propiedades o publica la tuya propia.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://your-app-domain.com" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Comenzar a Explorar
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          
          <p style="color: #888; font-size: 14px; text-align: center; margin-bottom: 0;">
            Si tienes alguna pregunta, no dudes en contactarnos.<br>
            <em>Equipo de Cuba Properties</em>
          </p>
        </div>
      </body>
    </html>
  `;

  const welcomeText = `
¡Bienvenido a Cuba Properties!

Gracias por unirte a nuestra comunidad. Ahora puedes:

• Explorar propiedades en todo Cuba con nuestro mapa interactivo
• Crear y gestionar tus propias publicaciones de propiedades  
• Subir hasta 7 fotos por propiedad
• Contactar directamente con compradores y vendedores
• Buscar por zonas específicas en Cuba

Tu email de acceso es: ${userEmail}

¡Esperamos que disfrutes de la plataforma!

Equipo de Cuba Properties
  `;

  return await sendEmail({
    to: userEmail,
    from: 'noreply@tudominio.com', // Usar el mismo dominio verificado en SendGrid
    subject: '🏡 ¡Bienvenido a Cuba Properties!',
    text: welcomeText,
    html: welcomeHTML
  });
}