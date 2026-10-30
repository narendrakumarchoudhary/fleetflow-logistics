import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const schema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
  name: { type: String, required: true, trim: true, maxLength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'dispatcher', 'operator', 'viewer', 'customer'], default: 'customer' },
  accountType: { type: String, enum: ['business', 'individual', 'transporter', 'driver', 'other'], default: 'individual' },
  profile: {
    phone: { type: String, trim: true, maxLength: 20 },
    companyName: { type: String, trim: true, maxLength: 120 },
    gstin: { type: String, trim: true, uppercase: true, maxLength: 15 },
    address: { type: String, trim: true, maxLength: 300 },
    purpose: { type: String, trim: true, maxLength: 500 }
  },
  active: { type: Boolean, default: true },
  onboardingStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  emailVerifiedAt: { type: Date, default: null },
  emailVerificationTokenHash: { type: String, select: false },
  emailVerificationExpiresAt: { type: Date, select: false },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
  tokenVersion: { type: Number, default: 0 }
}, { timestamps: true });

schema.methods.verifyPassword = function(password) { return bcrypt.compare(password, this.passwordHash); };
export default mongoose.model('User', schema);
