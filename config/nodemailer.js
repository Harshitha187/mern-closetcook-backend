import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root (two levels up from config folder)
dotenv.config({ path: path.join(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: true, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  connectionTimeout: 35000, // 35 seconds
  greetingTimeout: 25000, // 25 seconds
  socketTimeout: 35000, // 35 seconds
  debug: false, // Disable debug for performance
  logger: false // Disable logging for performance
});

export default transporter;