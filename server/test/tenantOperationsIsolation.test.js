import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const read=p=>readFileSync(resolve(here,p),'utf8');
const dashboard=read('../src/routes/dashboard.js');
const operations=read('../src/routes/operations.js');
const invoice=read('../src/models/Invoice.js');
const audit=read('../src/utils/audit.js');
test('dashboard summary aggregates and lists only the active tenant records',()=>{
  assert.match(dashboard,/Shipment\.aggregate\(\[shipmentMatch/);
  assert.match(dashboard,/Vehicle\.aggregate\(\[vehicleMatch/);
  assert.match(dashboard,/Shipment\.find\(req\.tenantId\?\{tenantId:req\.tenantId\}:\{\}\)/);
});
test('maintenance and fuel operations scope queries and stamp new records',()=>{
  assert.match(operations,/const scoped=\(req,filter=\{\}\)=>req\.tenantId\?\{\.\.\.filter,tenantId:req\.tenantId\}:filter/);
  assert.match(operations,/Maintenance\.create\(\{\.\.\.p\.data,\.\.\.\(req\.tenantId\?\{tenantId:req\.tenantId\}:\{\}\)/);
  assert.match(operations,/FuelEntry\.create\(\{\.\.\.p\.data,\.\.\.\(req\.tenantId\?\{tenantId:req\.tenantId\}:\{\}\)/);
  assert.match(operations,/Maintenance\.findOne\(scoped\(req,/);
  assert.match(operations,/FuelEntry\.find\(filter\)/);
});
test('invoice and proof-of-delivery operations are tenant scoped',()=>{
  assert.match(operations,/Shipment\.findOne\(scoped\(req,/);
  assert.match(operations,/Invoice\.findOne\(scoped\(req,/);
  assert.match(operations,/Invoice\.find\(filter\)/);
  assert.match(invoice,/tenantId:\{type:mongoose\.Schema\.Types\.ObjectId,ref:'Tenant',index:true\}/);
});
test('audit records retain tenant identity and admin notifications can be scoped',()=>{
  assert.match(audit,/tenantId:req\.tenantId/);
  assert.match(audit,/tenantId\?\{tenantId\}:\{\}/);
});
