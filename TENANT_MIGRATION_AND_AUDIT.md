# Tenant migration and security audit increment

## Included
- `npm run migrate:tenant` performs a read-only dry run by default.
- `--apply` creates/uses a named tenant, backfills records that do not have a tenantId, and replaces legacy global unique indexes for vehicle registration and driver licence with the model's tenant-scoped indexes.
- Existing records that already have tenantId are not reassigned.
- User email remains globally unique because it is the login identity.
- This migration is intended for a single legacy workspace import. Do not use it to merge several companies into one tenant.

## Run safely
1. Back up MongoDB and test on a restored copy first.
2. Set `MONGODB_URI`, `TENANT_MIGRATION_NAME`, and `TENANT_MIGRATION_SLUG`.
3. Run `npm run migrate:tenant` and inspect the dry-run counts.
4. Only after confirming the mapping, run `npm run migrate:tenant -- --apply`.
5. Verify collection counts, tenant membership, and indexes in MongoDB.

Example PowerShell:
```powershell
$env:TENANT_MIGRATION_NAME="Northstar Logistics"
$env:TENANT_MIGRATION_SLUG="northstar-logistics"
npm run migrate:tenant
# After backup and review:
npm run migrate:tenant -- --apply
```

## Safety notes
- The script does not automatically make `tenantId` required; legacy/anonymous/public records and mixed-tenant imports need a deliberate mapping plan.
- `syncIndexes()` reconciles indexes to the current Mongoose model definitions. Review index differences in a staging database before applying.
- It is not a transaction. Back up first and do not interrupt it midway.
- This increment has source-contract tests only. No live MongoDB migration has been executed.

## Security audit boundary
The current codebase has tenant-aware route filters and background GPS scoping from prior increments. This is not a formal proof of complete isolation. A full integration audit still needs adversarial tests against two real tenant fixtures, including every endpoint, exports, public tracking, file access, and asynchronous jobs.
