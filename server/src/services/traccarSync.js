import Vehicle from '../models/Vehicle.js';
import VehicleLocation from '../models/VehicleLocation.js';

export { normalizeTraccarPosition } from './traccarPosition.js';
import { normalizeTraccarPosition } from './traccarPosition.js';

export async function syncTraccarPositions({ baseUrl, username, password, fetchImpl = fetch }) {
  if (!baseUrl || !username || !password) throw new Error('Traccar URL and API credentials are required');
  const url = new URL('/api/positions', baseUrl);
  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  const response = await fetchImpl(url, { headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Traccar API returned HTTP ${response.status}`);
  const positions = await response.json();
  if (!Array.isArray(positions)) throw new Error('Traccar positions response was not an array');
  const normalized = positions.map(normalizeTraccarPosition).filter(Boolean);
  if (!normalized.length) return { received: positions.length, matched: 0, saved: 0 };
  const deviceIds = [...new Set(normalized.map(p => p.deviceId))];
  const vehicles = await Vehicle.find({ traccarDeviceId: { $in: deviceIds }, active: true }).select('registration traccarDeviceId tenantId').lean();
  const byDevice = new Map(vehicles.map(v => [String(v.traccarDeviceId), v]));
  let saved = 0;
  for (const point of normalized) {
    const vehicle = byDevice.get(point.deviceId);
    if (!vehicle) continue;
    const previous = await VehicleLocation.findOne({ vehicle: vehicle.registration, ...(vehicle.tenantId ? { tenantId: vehicle.tenantId } : { tenantId: { $exists: false } }) }).sort({ recordedAt: -1 }).select('recordedAt').lean();
    if (previous && point.recordedAt <= previous.recordedAt) continue;
    await VehicleLocation.create({ ...(vehicle.tenantId ? { tenantId: vehicle.tenantId } : {}), vehicle: vehicle.registration, latitude: point.latitude, longitude: point.longitude, speedKph: point.speedKph, heading: point.heading, recordedAt: point.recordedAt, source: 'device' });
    await Vehicle.updateOne({ _id: vehicle._id }, { $set: { location: `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}` } });
    saved += 1;
  }
  return { received: positions.length, matched: normalized.filter(p => byDevice.has(p.deviceId)).length, saved };
}

export function startTraccarPolling({ intervalMs = 30000, logger = console } = {}) {
  const { TRACCAR_BASE_URL, TRACCAR_USERNAME, TRACCAR_PASSWORD } = process.env;
  if (!TRACCAR_BASE_URL || !TRACCAR_USERNAME || !TRACCAR_PASSWORD) {
    logger.info?.('Traccar polling disabled: configure TRACCAR_BASE_URL, TRACCAR_USERNAME and TRACCAR_PASSWORD');
    return null;
  }
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const result = await syncTraccarPositions({ baseUrl: TRACCAR_BASE_URL, username: TRACCAR_USERNAME, password: TRACCAR_PASSWORD });
      logger.info?.({ traccar: result }, 'Traccar positions synchronized');
    } catch (error) { logger.error?.({ err: error }, 'Traccar synchronization failed'); }
    finally { running = false; }
  };
  const timer = setInterval(run, intervalMs);
  timer.unref?.();
  run();
  return () => clearInterval(timer);
}
