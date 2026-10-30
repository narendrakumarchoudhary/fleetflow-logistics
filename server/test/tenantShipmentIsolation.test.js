import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const here=dirname(fileURLToPath(import.meta.url));
const source=readFileSync(resolve(here,'../src/routes/shipments.js'),'utf8');
test('tenant-bound shipment requests apply tenant filters',()=>{
  assert.match(source,/const scoped=\(req,filter=\{\}\)=>req\.tenantId\?\{\.\.\.filter,tenantId:req\.tenantId\}:filter/);
  assert.match(source,/const filter=scoped\(req,req\.user\.role==='customer'\?/);
  assert.match(source,/Shipment\.findOne\(scoped\(req,\{_id:req\.params\.id\}\)\)/);
});
test('vehicle and driver assignment lookups are tenant scoped',()=>{
  assert.match(source,/Vehicle\.findOne\(scoped\(req,\{registration:data\.vehicle\.toUpperCase\(\),active:true\}\)\)/);
  assert.match(source,/Driver\.findOne\(scoped\(req,\{name:data\.driver,active:true\}\)\)/);
});
test('new shipment events inherit the request tenant',()=>{
  assert.match(source,/const scopedEvent=\(req,event\)=>req\.tenantId\?\{\.\.\.event,tenantId:req\.tenantId\}:event/);
});
