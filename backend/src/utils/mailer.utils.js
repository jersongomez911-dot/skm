const { MailtrapClient } = require("mailtrap");
const logger = require('./logger.utils');

const client = new MailtrapClient({
  token: process.env.MAILTRAP_TOKEN,
});

const sender = {
  email: process.env.MAILTRAP_SENDER_EMAIL || "hello@demomailtrap.co",
  name: process.env.MAILTRAP_SENDER_NAME || "SKM Taller",
};

/**
 * Sends an email using Mailtrap SDK
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {string} [options.category] - Optional category for tracking
 */
const sendEmail = async ({ to, subject, text, html, category = "Notification" }) => {
  try {
    const recipients = [{ email: to }];
    
    const response = await client.send({
      from: sender,
      to: recipients,
      subject,
      text,
      html,
      category,
    });

    logger.info(`Email sent via Mailtrap SDK: ${JSON.stringify(response)}`);
    return response;
  } catch (error) {
    logger.error('Error sending email via Mailtrap SDK:', error);
    // Return null instead of throwing to prevent breaking the request flow
    return null;
  }
};

module.exports = { sendEmail };
