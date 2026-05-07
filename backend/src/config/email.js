const nodemailer = require('nodemailer');
const logger = require('../utils/logger.utils');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT) || 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendMail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"SKM Taller" <noreply@skm.com>',
      to,
      subject,
      html,
      text,
    });
    logger.info(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error('❌ Email send failed:', err);
    throw err;
  }
};

const emailTemplates = {
  passwordReset: (resetUrl) => ({
    subject: '🔑 Restablecer contraseña — SKM Taller',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111827;color:#f9fafb;padding:40px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="color:#f97316;margin:0;">SKM Servicio Técnico</h1>
          <p style="color:#9ca3af;margin-top:8px;">Sistema Integral de Gestión</p>
        </div>
        <h2 style="color:#f9fafb;">Restablecer Contraseña</h2>
        <p style="color:#d1d5db;">Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo:</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${resetUrl}" style="background:#f97316;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
            Restablecer Contraseña
          </a>
        </div>
        <p style="color:#9ca3af;font-size:14px;">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.</p>
        <hr style="border-color:#374151;margin:24px 0;">
        <p style="color:#6b7280;font-size:12px;text-align:center;">SKM Servicio Técnico — Sistema de Gestión</p>
      </div>
    `,
  }),

  accountLocked: () => ({
    subject: '⚠️ Cuenta bloqueada — SKM Taller',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111827;color:#f9fafb;padding:40px;border-radius:12px;">
        <h2 style="color:#ef4444;">Cuenta Temporalmente Bloqueada</h2>
        <p>Tu cuenta ha sido bloqueada por múltiples intentos fallidos de inicio de sesión.</p>
        <p>Se desbloqueará automáticamente en 15 minutos.</p>
        <p style="color:#9ca3af;font-size:14px;">Si no fuiste tú, cambia tu contraseña inmediatamente.</p>
      </div>
    `,
  }),

  serviceStatusUpdate: (clientName, serviceId, newStatus, motoInfo) => ({
    subject: `🔧 Actualización de servicio #${serviceId.slice(-6)} — SKM Taller`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111827;color:#f9fafb;padding:40px;border-radius:12px;">
        <h1 style="color:#f97316;">SKM Servicio Técnico</h1>
        <h2>Hola ${clientName},</h2>
        <p>Tu servicio para <strong>${motoInfo}</strong> ha sido actualizado:</p>
        <div style="background:#1f2937;padding:20px;border-radius:8px;border-left:4px solid #f97316;">
          <p style="margin:0;font-size:18px;"><strong>Estado:</strong> ${newStatus}</p>
          <p style="margin:8px 0 0;color:#9ca3af;font-size:14px;">Servicio #${serviceId.slice(-6).toUpperCase()}</p>
        </div>
        <p style="color:#9ca3af;margin-top:24px;">Contáctanos si tienes preguntas.</p>
      </div>
    `,
  }),
};

module.exports = { sendMail, emailTemplates };
