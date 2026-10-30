import './config/env.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';

const name = String(process.env.BOOTSTRAP_ADMIN_NAME || '').trim();
const email = String(process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.BOOTSTRAP_ADMIN_PASSWORD || '');

if (process.env.NODE_ENV !== 'production') {
  console.error('This one-time bootstrap command is intended for a production deployment shell.');
  process.exit(1);
}
if (name.length < 2 || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 16 || password.length > 128) {
  console.error('Set BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL and a unique BOOTSTRAP_ADMIN_PASSWORD (16–128 characters).');
  process.exit(1);
}

try {
  await connectDB();
  if (await User.exists({ role: 'admin', active: true })) {
    throw new Error('An active administrator already exists. Bootstrap was stopped without changes.');
  }
  if (await User.exists({ email })) {
    throw new Error('That email already belongs to an account. Choose another email or use the existing admin account.');
  }
  const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 12);
  await User.create({ name, email, passwordHash, role: 'admin', active: true });
  console.log(`Initial administrator created: ${email}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
