import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';
import { sendAccountEmail } from '../utils/mailer.js';

const router = Router();
const hash = value => createHash('sha256').update(value).digest('hex');
const publicUser = user => ({ id: user._id, name: user.name, email: user.email, role: user.role, accountType: user.accountType, onboardingStatus: user.onboardingStatus, emailVerified: Boolean(user.emailVerifiedAt) });
const credentials = z.object({ email: z.string().email().max(254), password: z.string().min(8).max(128) });

router.post('/register', asyncHandler(async (req, res) => {
  if (process.env.ALLOW_PUBLIC_REGISTRATION !== 'true') return res.status(403).json({ message: 'New customer registration is temporarily closed. Contact FleetFlow administration.' });
  const schema = z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().email().max(254),
    password: z.string().min(12).max(128),
    accountType: z.enum(['business', 'individual', 'transporter', 'driver', 'other']),
    phone: z.string().trim().min(8).max(20),
    companyName: z.string().trim().max(120).optional().default(''),
    gstin: z.string().trim().max(15).optional().default(''),
    address: z.string().trim().min(5).max(300),
    purpose: z.string().trim().min(5).max(500)
  }).safeParse(req.body);
  if (!schema.success) return res.status(400).json({ message: 'Please check all required registration details', errors: schema.error.issues.map(i => ({ path: i.path, message: i.message })) });
  const data = schema.data;
  const email = data.email.toLowerCase();
  if (await User.exists({ email })) return res.status(409).json({ message: 'An account with this email already exists' });
  const passwordHash = await bcrypt.hash(data.password, Number(process.env.BCRYPT_ROUNDS) || 12);
  const verifyToken = randomBytes(32).toString('hex');
  const user = await User.create({
    name: data.name, email, passwordHash, role: 'customer', accountType: data.accountType,
    profile: { phone: data.phone, companyName: data.companyName, gstin: data.gstin, address: data.address, purpose: data.purpose },
    onboardingStatus: 'pending', emailVerificationTokenHash: hash(verifyToken),
    emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/?verify=${encodeURIComponent(verifyToken)}&email=${encodeURIComponent(email)}`;
  await sendAccountEmail({ to: email, subject: 'Verify your FleetFlow account', text: `Verify your FleetFlow account: ${verificationUrl}`, html: `<p>Verify your FleetFlow account:</p><p><a href="${verificationUrl}">Verify email</a></p>` });
  // In development only, expose a one-time verification token so the flow can be tested without pretending email is configured.
  const response = { message: 'Account created. Verify your email and wait for administrator approval before accessing customer services.', user: publicUser(user) };
  if (process.env.NODE_ENV !== 'production') response.devVerificationToken = verifyToken;
  res.status(201).json(response);
}));

router.post('/verify-email', asyncHandler(async (req, res) => {
  const p = z.object({ email: z.string().email(), token: z.string().min(32).max(128) }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ message: 'Invalid verification request' });
  const user = await User.findOne({ email: p.data.email.toLowerCase() }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
  if (!user || !user.emailVerificationTokenHash || user.emailVerificationExpiresAt < new Date() || hash(p.data.token) !== user.emailVerificationTokenHash) return res.status(400).json({ message: 'Verification link is invalid or expired' });
  user.emailVerifiedAt = new Date(); user.emailVerificationTokenHash = undefined; user.emailVerificationExpiresAt = undefined;
  await user.save();
  res.json({ message: 'Email verified. Your account will be available after administrator approval.' });
}));

router.post('/resend-verification', asyncHandler(async (req, res) => {
  const p = z.object({ email: z.string().email() }).safeParse(req.body);
  if (!p.success) return res.status(200).json({ message: 'If the account needs verification, instructions will be sent.' });
  const user = await User.findOne({ email: p.data.email.toLowerCase() }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
  const response = { message: 'If the account needs verification, instructions will be sent.' };
  if (user && !user.emailVerifiedAt) {
    const token = randomBytes(32).toString('hex');
    user.emailVerificationTokenHash = hash(token); user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); await user.save();
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/?verify=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;
    await sendAccountEmail({ to: user.email, subject: 'Verify your FleetFlow account', text: `Verify your FleetFlow account: ${verificationUrl}`, html: `<p><a href="${verificationUrl}">Verify email</a></p>` });
    if (process.env.NODE_ENV !== 'production') response.devVerificationToken = token;
  }
  res.json(response);
}));

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const p = z.object({ email: z.string().email() }).safeParse(req.body);
  if (!p.success) return res.status(200).json({ message: 'If an account exists, reset instructions will be sent.' });
  const user = await User.findOne({ email: p.data.email.toLowerCase() }).select('+passwordResetTokenHash +passwordResetExpiresAt');
  const response = { message: 'If an account exists, reset instructions will be sent.' };
  if (user && user.active) {
    const token = randomBytes(32).toString('hex');
    user.passwordResetTokenHash = hash(token); user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); await user.save();
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/?reset=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;
    await sendAccountEmail({ to: user.email, subject: 'Reset your FleetFlow password', text: `This link expires in 15 minutes: ${resetUrl}`, html: `<p>This password reset link expires in 15 minutes.</p><p><a href="${resetUrl}">Reset password</a></p>` });
    if (process.env.NODE_ENV !== 'production') response.devResetToken = token;
  }
  res.json(response);
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const p = z.object({ email: z.string().email(), token: z.string().min(32).max(128), newPassword: z.string().min(12).max(128) }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ message: 'Provide a valid reset token and a password of at least 12 characters' });
  const user = await User.findOne({ email: p.data.email.toLowerCase() }).select('+passwordHash +passwordResetTokenHash +passwordResetExpiresAt');
  if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date() || hash(p.data.token) !== user.passwordResetTokenHash) return res.status(400).json({ message: 'Password reset token is invalid or expired' });
  user.passwordHash = await bcrypt.hash(p.data.newPassword, Number(process.env.BCRYPT_ROUNDS) || 12);
  user.passwordResetTokenHash = undefined; user.passwordResetExpiresAt = undefined; user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  res.json({ message: 'Password reset successfully. Please sign in with your new password.' });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Enter a valid email and password' });
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.active || !(await user.verifyPassword(parsed.data.password))) return res.status(401).json({ message: 'Email or password is incorrect' });
  if (user.role === 'customer' && !user.emailVerifiedAt) return res.status(403).json({ message: 'Please verify your email before signing in.' });
  if (user.role === 'customer' && user.onboardingStatus !== 'approved') return res.status(403).json({ message: 'Your account is awaiting FleetFlow administrator approval.' });
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));
router.post('/change-password', protect, asyncHandler(async (req, res) => {
  const p = z.object({ currentPassword: z.string().min(8).max(128), newPassword: z.string().min(12).max(128) }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ message: 'New password must contain at least 12 characters' });
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!user || !(await user.verifyPassword(p.data.currentPassword))) return res.status(400).json({ message: 'Current password is incorrect' });
  user.passwordHash = await bcrypt.hash(p.data.newPassword, Number(process.env.BCRYPT_ROUNDS) || 12);
  user.tokenVersion = (user.tokenVersion || 0) + 1; await user.save();
  res.json({ token: signToken(user), message: 'Password changed. Other active sessions have been signed out.' });
}));
export default router;
