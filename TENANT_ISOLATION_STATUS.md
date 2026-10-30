# Tenant isolation — increment 1: data model foundation

## Included
- Added the `Tenant` model with active/suspended state and free-plan defaults.
- Added nullable `tenantId` references to users and operational data models:
  shipments, vehicles, drivers, driver attendance, fuel entries, invoices,
  maintenance, notifications, audit logs and vehicle locations.
- Defaults use India-friendly timezone/currency.

## Not yet safe to enable for production
This is a schema foundation, **not complete tenant isolation**. Existing route
queries, writes, aggregation pipelines, public tracking, exports, Traccar polling,
and unique indexes still need tenant scoping. Existing records also need a
controlled migration into a default tenant before tenantId can be required.
Do not onboard multiple companies using this increment alone.

## Next acceptance gate
1. Add tenant provisioning and tenant membership.
2. Put tenantId into signed access tokens and derive it only from the authenticated user.
3. Enforce tenantId in every read/write/delete/aggregate and background job.
4. Replace global unique indexes with compound tenant-scoped indexes.
5. Add cross-tenant isolation integration tests against MongoDB.
6. Migrate existing data transactionally and make tenantId required.


## Migration and audit increment
- Added an opt-in, dry-run-first single-tenant legacy backfill script.
- The script reports unassigned documents, fills only documents missing tenantId, and replaces only global unique Vehicle.registration and Driver.license indexes with model-defined tenant-scoped indexes.
- User email remains globally unique by design as the account login identity.
- No live database was modified; production use requires backup, staging rehearsal, and explicit `--apply`.
