import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true }, vehicle: { type: String, required: true, uppercase: true, trim: true, index: true }, latitude: { type: Number, required: true, min: -90, max: 90 }, longitude: { type: Number, required: true, min: -180, max: 180 }, speedKph: { type: Number, min: 0, max: 300, default: 0 }, heading: { type: Number, min: 0, max: 360, default: 0 }, recordedAt: { type: Date, required: true, index: true }, source: { type: String, enum: ['device', 'manual', 'simulator'], default: 'device' } }, { timestamps: true });
schema.index({ vehicle: 1, recordedAt: -1 });
export default mongoose.model('VehicleLocation', schema);
