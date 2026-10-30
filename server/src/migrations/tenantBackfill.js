import mongoose from 'mongoose';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Shipment from '../models/Shipment.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import DriverAttendance from '../models/DriverAttendance.js';
import Maintenance from '../models/Maintenance.js';
import FuelEntry from '../models/FuelEntry.js';
import Invoice from '../models/Invoice.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import VehicleLocation from '../models/VehicleLocation.js';

const slug = String(process.env.TENANT_MIGRATION_SLUG || '').trim().toLowerCase();
const name = String(process.env.TENANT_MIGRATION_NAME || '').trim();
const apply = process.argv.includes('--apply');

if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !name) {
  throw new Error('Set TENANT_MIGRATION_SLUG and TENANT_MIGRATION_NAME before running this migration.');
}

const collections = [
  ['users', User], ['shipments', Shipment], ['vehicles', Vehicle], ['drivers', Driver],
  ['driverAttendance', DriverAttendance], ['maintenance', Maintenance], ['fuelEntries', FuelEntry],
  ['invoices', Invoice], ['notifications', Notification], ['auditLogs', AuditLog],
  ['vehicleLocations', VehicleLocation]
];

async function countUnassigned(Model) {
  return Model.countDocuments({ tenantId: { $exists: false } });
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  let tenant = await Tenant.findOne({ slug });
  if (!tenant && apply) tenant = await Tenant.create({ name, slug, status: 'active', plan: 'free' });
  if (!tenant) {
    console.log(JSON.stringify({ mode: 'dry-run', tenantToCreate: { name, slug }, note: 'No data changed. Re-run with --apply to execute.' }, null, 2));
    for (const [collection, Model] of collections) console.log(`${collection}: ${await countUnassigned(Model)} unassigned`);
    return;
  }

  const summary = {};
  for (const [collection, Model] of collections) {
    const count = await countUnassigned(Model);
    summary[collection] = count;
    if (apply && count) await Model.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId: tenant._id } });
  }

  const indexChanges = {};
  for (const [collection, field] of [['vehicles', 'registration'], ['drivers', 'license']]) {
    const Model = collection === 'vehicles' ? Vehicle : Driver;
    const indexes = await Model.collection.indexes();
    const globalUnique = indexes.filter(index => index.unique && Object.keys(index.key || {}).length === 1 && index.key[field] === 1);
    indexChanges[collection] = globalUnique.map(index => index.name);
    if (apply) {
      for (const index of globalUnique) await Model.collection.dropIndex(index.name);
      await Model.syncIndexes();
    }
  }

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    tenant: { id: String(tenant._id), name: tenant.name, slug: tenant.slug },
    unassignedBeforeMigration: summary,
    globalUniqueIndexes: indexChanges,
    result: apply ? 'Backfill and index migration completed' : 'No data changed. Re-run with --apply to execute.'
  }, null, 2));
}

run().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await mongoose.disconnect(); });
