import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(here, '..', 'src', p), 'utf8');

test('people routes scope users and attendance to the authenticated tenant', () => {
  const source = read('routes/people.js');
  assert.match(source, /const tenantFilter=\(req,filter=\{\}\)=>req\.tenantId\?\{\.\.\.filter,tenantId:req\.tenantId\}:filter/);
  assert.match(source, /User\.find\(tenantFilter\(req\)\)/);
  assert.match(source, /User\.findOneAndUpdate\(tenantFilter\(req,\{_id:req\.params\.id\}\)/);
  assert.match(source, /User\.countDocuments\(tenantFilter\(req,\{role:'admin',active:true\}\)\)/);
  assert.match(source, /DriverAttendance\.find\(filter\)/);
  assert.match(source, /Driver\.findOne\(tenantFilter\(req,\{_id:p\.data\.driverId,active:true\}\)\)/);
  assert.match(source, /DriverAttendance\.findOneAndUpdate\(tenantFilter\(req,\{driver:driver\._id,date:p\.data\.date\}\)/);
  assert.match(source, /tenantId:req\.tenantId/);
});

test('telemetry writes and reads are tenant scoped', () => {
  const source = read('routes/telemetry.js');
  assert.match(source, /Vehicle\.findOne\(tenantFilter\(req,/);
  assert.match(source, /VehicleLocation\.findOne\(tenantFilter\(req,/);
  assert.match(source, /VehicleLocation\.create\(\{\.\.\.p\.data,vehicle:vehicle\.registration,recordedAt,\.\.\.\(req\.tenantId\?\{tenantId:req\.tenantId\}:\{\}\)\}\)/);
  assert.match(source, /const match = tenantFilter\(req,/);
  assert.match(source, /VehicleLocation\.find\(tenantFilter\(req,\{vehicle\}\)\)/);
});

test('legacy users without tenant membership retain compatibility behavior', () => {
  const source = read('routes/people.js') + read('routes/telemetry.js');
  assert.match(source, /req\.tenantId\?\{\.\.\.filter,tenantId:req\.tenantId\}:filter/);
});
