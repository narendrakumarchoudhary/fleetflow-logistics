export function normalizeTraccarPosition(position) {
  const latitude = Number(position?.latitude);
  const longitude = Number(position?.longitude);
  const deviceId = String(position?.deviceId ?? '');
  const recordedAt = new Date(position?.fixTime || position?.deviceTime || position?.serverTime);
  if (!deviceId || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 || Number.isNaN(recordedAt.getTime())) return null;
  return { deviceId, latitude, longitude, speedKph: Math.max(0, Math.min(300, Number(position.speed || 0) * 1.852)), heading: Math.max(0, Math.min(360, Number(position.course || 0))), recordedAt };
}
