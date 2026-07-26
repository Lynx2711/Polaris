import { Router } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

router.post('/', async (req, res) => {
  const { name, email, company, subject, message } = req.body;

  // Basic validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Please provide name, email, subject, and message.' });
  }

  try {
    let transporter;
    const isSmtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

    if (isSmtpConfigured) {
      // Production or custom SMTP settings
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('[mail] Using configured SMTP transporter.');
    } else {
      // Fallback for development: Ethereal test account
      console.log('[mail] SMTP credentials not set. Creating ethereal.email test account...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[mail] Generated test email account: ${testAccount.user}`);
    }

    const recipient = process.env.CONTACT_RECIPIENT_EMAIL || 'surakshasharma303@gmail.com';
    
    // Construct HTML and text emails
    const mailOptions = {
      from: `"Polaris Contact Form" <${process.env.SMTP_USER || 'noreply@polaris.app'}>`,
      replyTo: `"${name}" <${email}>`,
      to: recipient,
      subject: `[Polaris Contact] ${subject}`,
      text: `
New Contact Form Submission from Polaris Landing Page

Name: ${name}
Email: ${email}
Company: ${company || 'N/A'}
Subject: ${subject}

Message:
----------------------------------------
${message}
----------------------------------------
      `,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
          <h2 style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-top: 0; color: #000;">
            New Contact Submission
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; width: 120px;">Name:</td>
              <td style="padding: 6px 0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Email:</td>
              <td style="padding: 6px 0;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Company:</td>
              <td style="padding: 6px 0;">${company || '<em>Not provided</em>'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Subject:</td>
              <td style="padding: 6px 0;">${subject}</td>
            </tr>
          </table>
          <div style="background-color: #f9f9f9; border-left: 4px solid #000; padding: 15px; margin-top: 15px; border-radius: 4px;">
            <strong style="display: block; margin-bottom: 5px;">Message:</strong>
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`[mail] Email sent successfully. Message ID: ${info.messageId}`);
    
    if (!isSmtpConfigured) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[mail] Preview URL: ${previewUrl}`);
      return res.status(200).json({
        success: true,
        message: 'Message sent successfully (Development Test Mode)',
        previewUrl,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('[mail] Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email message.' });
  }
});

export default router;
