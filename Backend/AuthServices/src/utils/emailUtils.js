import nodemailer from  'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

await transporter.verify();
console.log("✅ SMTP ready");
console.log("SMTP_HOST FROM NODE:", process.env.SMTP_HOST);

const sendOTPEmail = async (to, name, otp) => {
  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'YourStore'}" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0;">Email Verification</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
          <p>Use the code below to verify your email. It expires in <strong>10 minutes</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #4F46E5; background: #EEF2FF; padding: 15px 25px; border-radius: 8px;">
              ${otp}
            </span>
          </div>
          <p style="color: #666; font-size: 13px;">If you didn't create an account, you can ignore this email.</p>
        </div>
      </div>
    `,
    text: `Hi ${name}, your verification code is: ${otp}. It expires in 10 minutes.`,
  });
};

export default sendOTPEmail