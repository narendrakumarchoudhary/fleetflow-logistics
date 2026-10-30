import jwt from 'jsonwebtoken';

export function signToken(user) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  const claims = {
    sub: user._id.toString(),
    role: user.role,
    ver: user.tokenVersion || 0,
    ...(user.tenantId ? { tenantId: user.tenantId.toString() } : {})
  };
  return jwt.sign(claims, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    issuer: 'fleetflow-api',
    audience: 'fleetflow-client'
  });
}
