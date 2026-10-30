import nodemailer from 'nodemailer';
let transport;
function getTransport() {
  if (transport) return transport;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  transport = nodemailer.createTransport({host: SMTP_HOST, port: Number(SMTP_PORT) || 587, secure: process.env.SMTP_SECURE === 'true', auth: {user: SMTP_USER, pass: SMTP_PASS}});
  return transport;
}
export async function sendAccountEmail({to, subject, text, html}) {
  const client = getTransport();
  if (!client) {
    if (process.env.NODE_ENV === 'production') throw new Error('Email delivery is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.');
    return false;
  }
  await client.sendMail({from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text, html});
  return true;
}
