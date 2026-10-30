import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createHash, randomInt } from 'node:crypto';
import Shipment from '../models/Shipment.js';
import User from '../models/User.js';
import TrackingOtp from '../models/TrackingOtp.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendAccountEmail } from '../utils/mailer.js';
import { hashTrackingCode, createTrackingCode, isValidTrackingCode } from '../utils/trackingOtp.js';

const router = Router();
router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false }));
const hash = value => createHash('sha256').update(value).digest('hex');
const tenantScope = (record, field = 'tenantId') => record?.[field] ? { tenantId: record[field] } : {};
const genericMessage = 'If the tracking number and registered email match, a verification code will be sent.';
const safeTracking = shipment => ({
  trackingNumber: shipment.trackingNumber,
  origin: shipment.origin,
  destination: shipment.destination,
  status: shipment.status,
  eta: shipment.eta,
  progress: shipment.progress,
  events: (shipment.events || []).map(event => ({
    status: event.status,
    location: event.location,
    occurredAt: event.occurredAt
  })),
  pod: shipment.pod?.deliveredAt ? { deliveredAt: shipment.pod.deliveredAt } : null
});

router.post('/:trackingNumber/request-otp', asyncHandler(async (req, res) => {
  const number = String(req.params.trackingNumber || '').trim().toUpperCase();
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[A-Z0-9-]{3,40}$/.test(number) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(200).json({ message: genericMessage });
  }
  const shipment = await Shipment.findOne({ trackingNumber: number, customerUser: { $exists: true, $ne: null } }).select('_id trackingNumber customerUser tenantId').lean();
  if (shipment) {
    const user = await User.findOne({ _id: shipment.customerUser, email, active: true, emailVerifiedAt: { $ne: null }, onboardingStatus: 'approved', ...tenantScope(shipment) }).select('_id email').lean();
    if (user) {
      const code = createTrackingCode();
      await TrackingOtp.deleteMany({ shipment: shipment._id, user: user._id, usedAt: null, ...tenantScope(shipment) });
      await TrackingOtp.create({
        shipment: shipment._id,
        user: user._id,
        ...tenantScope(shipment),
        codeHash: hashTrackingCode(code),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });
      await sendAccountEmail({
        to: user.email,
        subject: 'Your FleetFlow tracking verification code',
        text: `Your FleetFlow tracking code is ${code}. It expires in 5 minutes. Do not share this code.`,
        html: `<p>Your FleetFlow tracking code is:</p><h2>${code}</h2><p>It expires in 5 minutes. Do not share this code.</p>`
      });
    }
  }
  res.status(200).json({ message: genericMessage });
}));

router.post('/:trackingNumber/verify-otp', asyncHandler(async (req, res) => {
  const number = String(req.params.trackingNumber || '').trim().toUpperCase();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '').trim();
  if (!/^[A-Z0-9-]{3,40}$/.test(number) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: 'Invalid tracking verification details or code expired.' });
  }
  const shipment = await Shipment.findOne({ trackingNumber: number, customerUser: { $exists: true, $ne: null } }).select('_id tenantId customerUser').lean();
  if (!shipment) return res.status(400).json({ message: 'Invalid tracking verification details or code expired.' });
  const user = await User.findOne({ _id: shipment.customerUser, email, active: true, ...tenantScope(shipment) }).select('_id').lean();
  if (!user) return res.status(400).json({ message: 'Invalid tracking verification details or code expired.' });
  const challenge = await TrackingOtp.findOne({ shipment: shipment._id, user: user._id, usedAt: null, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 }, ...tenantScope(shipment) }).select('+codeHash').sort({ createdAt: -1 });
  if (!challenge) return res.status(400).json({ message: 'Invalid tracking verification details or code expired.' });
  if (hashTrackingCode(code) !== challenge.codeHash) {
    challenge.attempts += 1;
    await challenge.save();
    return res.status(400).json({ message: 'Invalid tracking verification details or code expired.' });
  }
  challenge.usedAt = new Date();
  await challenge.save();
  const record = await Shipment.findOne({ _id: shipment._id, ...tenantScope(shipment) }).select('trackingNumber origin destination status eta progress events.status events.location events.occurredAt pod.deliveredAt').lean();
  res.json(safeTracking(record));
}));

export default router;
