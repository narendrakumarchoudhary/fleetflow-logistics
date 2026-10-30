import { Router } from 'express';
import { z } from 'zod';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';

const router = Router();
router.use(protect, allowRoles('admin'));

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(60)
});

router.post('/provision', asyncHandler(async (req, res) => {
  if (req.user.tenantId) {
    return res.status(409).json({ message: 'Your account already belongs to a workspace.' });
  }
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Provide a valid workspace name and URL slug.', errors: parsed.error.issues });
  }
  const existing = await Tenant.findOne({ slug: parsed.data.slug }).select('_id');
  if (existing) return res.status(409).json({ message: 'This workspace URL is already taken.' });

  const tenant = await Tenant.create({
    ...parsed.data,
    status: 'active',
    plan: 'free',
    createdBy: req.user._id
  });
  try {
    const updated = await User.findOneAndUpdate(
      { _id: req.user._id, tenantId: { $exists: false } },
      { $set: { tenantId: tenant._id } },
      { new: true, runValidators: true }
    ).select('-passwordHash').populate('tenantId', 'status');
    if (!updated) {
      await Tenant.deleteOne({ _id: tenant._id });
      return res.status(409).json({ message: 'Workspace membership changed. Sign in again and retry.' });
    }
    return res.status(201).json({
      message: 'Workspace created. Sign in again before continuing.',
      tenant: { id: tenant._id, name: tenant.name, slug: tenant.slug, status: tenant.status, plan: tenant.plan },
      token: signToken(updated)
    });
  } catch (error) {
    await Tenant.deleteOne({ _id: tenant._id });
    throw error;
  }
}));

router.get('/current', asyncHandler(async (req, res) => {
  if (!req.user.tenantId) return res.status(404).json({ message: 'No workspace is assigned to this account.' });
  const tenant = await Tenant.findById(req.user.tenantId).lean();
  if (!tenant) return res.status(404).json({ message: 'Workspace not found.' });
  res.json({ tenant: { id: tenant._id, name: tenant.name, slug: tenant.slug, status: tenant.status, plan: tenant.plan, settings: tenant.settings } });
}));

export default router;
