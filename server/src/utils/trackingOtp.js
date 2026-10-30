import { createHash, randomInt } from 'node:crypto';

export const hashTrackingCode = value => createHash('sha256').update(String(value)).digest('hex');
export const createTrackingCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0');
export const isValidTrackingCode = value => /^\d{6}$/.test(String(value));
