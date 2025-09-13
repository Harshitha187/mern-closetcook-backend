import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  debug: true, // Enable debug mode
  logger: true // Enable logging
});

// Test the connection
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server ready:', success);
  }
});

export default transporter;