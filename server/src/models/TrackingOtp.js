import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  codeHash: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  usedAt: { type: Date, default: null }
}, { timestamps: true });

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
schema.index({ shipment: 1, user: 1, createdAt: -1 });
export default mongoose.model('TrackingOtp', schema);
