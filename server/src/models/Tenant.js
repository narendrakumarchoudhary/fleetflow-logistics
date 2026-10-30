import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxLength: 120 },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
  plan: { type: String, enum: ['free'], default: 'free' },
  settings: {
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

export default mongoose.model('Tenant', schema);
