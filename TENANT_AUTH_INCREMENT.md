# Tenant-aware authentication increment

## Included
- Access tokens now carry a `tenantId` claim when the authenticated user belongs to a tenant.
- Authentication middleware reloads the user and tenant status on every request.
- Token tenant identity must match the current database membership; stale workspace tokens are rejected.
- Suspended tenants are denied access.
- The middleware exposes `req.tenantId` and `req.tenantContext` for route-level scoping.
- Added unit tests for tenant claim issuance and legacy no-tenant tokens.

## Important security boundary
This increment does **not** complete tenant isolation. Existing routes and aggregation pipelines still need tenant filters on every query and write. User registration/provisioning and global unique indexes also require a tenant-aware migration. Do not onboard multiple companies until the route audit and cross-tenant MongoDB integration suite pass.
