import test from 'node:test';
import assert from 'node:assert/strict';
import { canUpdateMaintenance, maintenanceStatuses } from '../src/domain/maintenanceLifecycle.js';

test('maintenance lifecycle includes the supported states', () => {
  assert.deepEqual(maintenanceStatuses, ['Scheduled', 'In Progress', 'Completed', 'Cancelled']);
});

test('scheduled work can start, complete or be cancelled', () => {
  assert.equal(canUpdateMaintenance('Scheduled', 'In Progress'), true);
  assert.equal(canUpdateMaintenance('Scheduled', 'Completed'), true);
  assert.equal(canUpdateMaintenance('Scheduled', 'Cancelled'), true);
});

test('completed and cancelled work are terminal states', () => {
  assert.equal(canUpdateMaintenance('Completed', 'Scheduled'), false);
  assert.equal(canUpdateMaintenance('Cancelled', 'In Progress'), false);
  assert.equal(canUpdateMaintenance('Completed', 'Completed'), true);
});
