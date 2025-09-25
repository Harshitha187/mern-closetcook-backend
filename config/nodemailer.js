import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root (two levels up from config folder)
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Debug: Check if credentials are loaded
console.log('SMTP_USER:', process.env.SMTP_USER ? 'loaded' : 'NOT LOADED');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'loaded' : 'NOT LOADED');
console.log('SMTP_MAIL:', process.env.SMTP_MAIL ? 'loaded' : 'NOT LOADED');

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