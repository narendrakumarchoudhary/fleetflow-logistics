import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return res.status(500).json({ message: 'Authentication is not configured' });
    }
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET, {
      issuer: 'fleetflow-api',
      audience: 'fleetflow-client'
    });
    const user = await User.findById(payload.sub).select('-passwordHash').populate('tenantId', 'status');
    if (!user || !user.active || (payload.ver ?? 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({ message: 'Account session is no longer valid. Please sign in again.' });
    }
    const storedTenantId = user.tenantId ? String(user.tenantId) : null;
    const tokenTenantId = payload.tenantId ? String(payload.tenantId) : null;
    if (storedTenantId !== tokenTenantId) {
      return res.status(401).json({ message: 'Workspace membership changed. Please sign in again.' });
    }
    if (user.tenantId && user.tenantId.status === 'suspended') {
      return res.status(403).json({ message: 'This workspace is suspended.' });
    }
    req.user = user;
    req.tenantId = storedTenantId;
    req.tenantContext = storedTenantId ? { tenantId: storedTenantId } : null;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
}

export const allowRoles = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: 'You do not have permission to perform this action' });
