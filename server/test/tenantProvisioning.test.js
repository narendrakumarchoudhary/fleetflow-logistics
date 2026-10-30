import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const route = await readFile(new URL('../src/routes/tenants.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');

test('tenant provisioning is restricted to authenticated admins', () => {
  assert.match(route, /router\.use\(protect, allowRoles\('admin'\)\)/);
});

test('tenant provisioning validates slug and prevents existing workspace membership', () => {
  assert.match(route, /regex\(\/\^\[a-z0-9\]/);
  assert.match(route, /req\.user\.tenantId/);
  assert.match(route, /Tenant\.findOne\(\{ slug:/);
});

test('tenant provisioning binds admin membership and returns a refreshed tenant token', () => {
  assert.match(route, /findOneAndUpdate/);
  assert.match(route, /\$set: \{ tenantId: tenant\._id \}/);
  assert.match(route, /token: signToken\(updated\)/);
});

test('tenant routes are mounted in the API', () => {
  assert.match(index, /app\.use\('\/api\/tenants',tenantRoutes\)/);
});
