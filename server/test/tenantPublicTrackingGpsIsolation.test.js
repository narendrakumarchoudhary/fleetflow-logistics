import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const read = p => fs.readFileSync(path.join(here, '..', 'src', p), 'utf8');
test('public tracking OTP challenges inherit shipment tenant identity', () => {
 const route=read('routes/publicTracking.js'), model=read('models/TrackingOtp.js');
 assert.match(route,/select\('_id trackingNumber customerUser tenantId'\)/);
 assert.match(route,/tenantScope\(shipment\)/);
 assert.match(route,/TrackingOtp\.create\(\{[\s\S]*tenantScope\(shipment\)/);
 assert.match(route,/TrackingOtp\.findOne\(\{[\s\S]*tenantScope\(shipment\)/);
 assert.match(model,/tenantId: \{ type: mongoose\.Schema\.Types\.ObjectId, ref: 'Tenant', index: true \}/);
});
test('background Traccar sync retains tenant identity on GPS writes', () => {
 const source=read('services/traccarSync.js');
 assert.match(source,/select\('registration traccarDeviceId tenantId'\)/);
 assert.match(source,/tenantId: vehicle\.tenantId/);
 assert.match(source,/VehicleLocation\.findOne\(\{ vehicle: vehicle\.registration, \.\.\.\(vehicle\.tenantId/);
 assert.match(source,/VehicleLocation\.create\(\{ \.\.\.\(vehicle\.tenantId/);
});
test('public tracking response exposes only approved tracking fields', () => {
 const source=read('routes/publicTracking.js');
 const safe=source.split('const safeTracking = shipment => ({')[1].split('\n});')[0];
 assert.ok(safe.includes('trackingNumber') && safe.includes('events'));
 assert.ok(!safe.includes('customerUser') && !safe.includes('tenantId') && !safe.includes('email'));
});
