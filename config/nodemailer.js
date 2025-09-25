import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Debug: Check if SMTP env variables are loaded
if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_MAIL) {
  console.error('ERROR: One or more SMTP environment variables are missing!');
  console.error('SMTP_USER:', process.env.SMTP_USER);
  console.error('SMTP_PASS:', process.env.SMTP_PASS);
  console.error('SMTP_MAIL:', process.env.SMTP_MAIL);
} else {
  console.log('SMTP env variables loaded successfully.');
}

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export default transporter;