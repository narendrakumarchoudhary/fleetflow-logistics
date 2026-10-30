import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTraccarPosition } from '../src/services/traccarPosition.js';

test('normalizes valid Traccar GPS positions and converts knots to km/h', () => {
  const point = normalizeTraccarPosition({ deviceId: 42, latitude: 26.9124, longitude: 75.7873, speed: 10, course: 180, fixTime: '2026-10-30T10:00:00Z' });
  assert.equal(point.deviceId, '42');
  assert.equal(point.speedKph, 18.52);
  assert.equal(point.heading, 180);
  assert.equal(point.latitude, 26.9124);
});

test('rejects invalid coordinates and missing device identifiers', () => {
  assert.equal(normalizeTraccarPosition({ deviceId: 1, latitude: 91, longitude: 0, fixTime: '2026-10-30T10:00:00Z' }), null);
  assert.equal(normalizeTraccarPosition({ latitude: 0, longitude: 0, fixTime: '2026-10-30T10:00:00Z' }), null);
});
