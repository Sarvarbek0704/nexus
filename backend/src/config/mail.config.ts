import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT, 10) || 587,
  secure: process.env.MAIL_SECURE === 'true',
  user: process.env.MAIL_USER || '',
  pass: process.env.MAIL_PASS || '',
  fromName: process.env.MAIL_FROM_NAME || 'Nexus',
  fromEmail: process.env.MAIL_FROM_EMAIL || 'noreply@nexus.com',
}));
