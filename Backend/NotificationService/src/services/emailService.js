import nodemailer from 'nodemailer';

let transporter = null;

/**
 * Initialize the email transporter
 */
const initEmailTransporter = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Real SMTP (Gmail, SendGrid, etc.)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: use Ethereal (fake SMTP — catches emails, never sends them)
    // Preview at https://ethereal.email
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || 'ethereal_test_user',
        pass: process.env.ETHEREAL_PASS || 'ethereal_test_pass',
      },
    });
  }

  console.log(`✅ Email transporter initialized (${isProduction ? 'SMTP' : 'Ethereal/dev'})`);
  return transporter;
};

/**
 * Create an Ethereal test account automatically in development
 */
const createTestAccount = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('✅ Ethereal test email account created');
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
    console.log('   Preview emails at: https://ethereal.email');
    return transporter;
  } catch (err) {
    console.error('❌ Failed to create Ethereal test account:', err.message);
    return null;
  }
};

/**
 * Send an email
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    throw new Error('Email transporter not initialized');
  }

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Store'}" <${process.env.SMTP_USER || 'noreply@store.com'}>`,
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);

  // In development, log the Ethereal preview URL
  if (process.env.NODE_ENV !== 'production') {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 Email preview URL: ${previewUrl}`);
    }
  }

  return info;
};

export { initEmailTransporter, createTestAccount, sendEmail };