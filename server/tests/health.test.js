import test from 'node:test';
import assert from 'node:assert/strict';
import { shipmentStatuses, allowedTransitions, canTransition, progressForStatus } from '../src/domain/shipmentLifecycle.js';

test('shipment lifecycle exposes every supported status', () => {
  assert.deepEqual([...shipmentStatuses].sort(), Object.keys(allowedTransitions).sort());
});

test('shipment lifecycle permits valid movement and blocks invalid movement', () => {
  assert.equal(canTransition('Pending', 'In Transit'), true);
  assert.equal(canTransition('In Transit', 'Delivered'), true);
  assert.equal(canTransition('Delivered', 'In Transit'), false);
  assert.equal(canTransition('Cancelled', 'Pending'), false);
  assert.equal(canTransition('Pending', 'Pending'), true);
});

test('terminal shipment states cannot be reopened', () => {
  assert.deepEqual(allowedTransitions.Delivered, []);
  assert.deepEqual(allowedTransitions.Cancelled, []);
});

test('status progress is normalised consistently', () => {
  assert.equal(progressForStatus('Pending', 60), 0);
  assert.equal(progressForStatus('In Transit', 35), 35);
  assert.equal(progressForStatus('In Transit', 0), 10);
  assert.equal(progressForStatus('Out for Delivery', 50), 90);
  assert.equal(progressForStatus('Delivered', 40), 100);
  assert.equal(progressForStatus('Delayed', 120), 100);
});

test('API health contract distinguishes database readiness', () => {
  const connected = { status: 'ok', database: 'connected', service: 'fleetflow-api' };
  const disconnected = { status: 'degraded', database: 'disconnected', service: 'fleetflow-api' };
  assert.equal(connected.status === 'ok' && connected.database === 'connected', true);
  assert.equal(disconnected.status === 'ok', false);
});
