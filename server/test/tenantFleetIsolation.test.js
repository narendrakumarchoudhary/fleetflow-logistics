import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const read=p=>readFileSync(resolve(here,p),'utf8');
const vehicles=read('../src/routes/vehicles.js');
const drivers=read('../src/routes/drivers.js');
const vehicleModel=read('../src/models/Vehicle.js');
const driverModel=read('../src/models/Driver.js');
test('vehicle endpoints scope reads, writes and shipment checks to tenant',()=>{
  assert.match(vehicles,/const scoped=\(req,filter=\{\}\)=>req\.tenantId\?\{\.\.\.filter,tenantId:req\.tenantId\}:filter/);
  assert.match(vehicles,/Vehicle\.find\(filter\)/);
  assert.match(vehicles,/Vehicle\.create\(\{\.\.\.p\.data,\.\.\.\(req\.tenantId\?\{tenantId:req\.tenantId\}:\{\}\)\}\)/);
  assert.match(vehicles,/Shipment\.exists\(scoped\(req,/);
  assert.match(vehicles,/Vehicle\.findOneAndUpdate\(scoped\(req,/);
  assert.match(vehicles,/Vehicle\.find\(scoped\(req,\{active:true,'documents\.expiresAt'/);
});
test('driver endpoints scope reads, writes and fleet references to tenant',()=>{
  assert.match(drivers,/Driver\.find\(filter\)/);
  assert.match(drivers,/Driver\.create\(\{\.\.\.p\.data,\.\.\.\(req\.tenantId\?\{tenantId:req\.tenantId\}:\{\}\)/);
  assert.match(drivers,/Vehicle\.findOne\(scoped\(req,/);
  assert.match(drivers,/Shipment\.exists\(scoped\(req,/);
  assert.match(drivers,/Driver\.findOneAndUpdate\(scoped\(req,/);
});
test('vehicle registration and driver licence uniqueness are tenant-scoped',()=>{
  assert.match(vehicleModel,/schema\.index\(\{tenantId:1,registration:1\},\{unique:true,partialFilterExpression:/);
  assert.match(driverModel,/schema\.index\(\{tenantId:1,license:1\},\{unique:true,partialFilterExpression:/);
});
