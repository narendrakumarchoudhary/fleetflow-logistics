# FleetFlow Architecture

## Technology choices

- React 18 + Vite: browser application and reusable operational screens.
- Node.js 20+ + Express: HTTP API and business rules.
- MongoDB + Mongoose: persistent operational records and indexes.
- JWT + bcryptjs: signed sessions and password hashing.
- Zod: request-boundary validation.
- Helmet, CORS allow-list and rate limiting: baseline HTTP protections.
- Pino HTTP: request logging with authorization headers redacted.

## Request lifecycle

```text
React screen
  -> Axios API client (Bearer token)
  -> Express security middleware / rate limiter
  -> Authentication and role authorization
  -> Zod request validation
  -> Domain/business rule checks
  -> Mongoose model and MongoDB
  -> JSON response
  -> React state refresh
```

## Main collections

- User: name, unique email, password hash, role, active flag and token version.
- Shipment: tracking number, customer, route, status, priority, allocation, ETA, progress, events and POD metadata.
- Vehicle: registration, category, capacity, status, location label, fuel indicator and statutory documents.
- Driver: contact, licence, availability and assigned vehicle.
- Maintenance: vehicle service/repair schedule, vendor, cost, odometer and workflow status.
- FuelEntry: litres, rate, total cost, odometer, station and timestamp.
- DriverAttendance: driver, date, check-in/out and attendance status.
- Invoice: shipment, customer GSTIN, line items, GST, total, payment ledger and invoice status.
- Notification: per-user in-app messages and read state.
- AuditLog: actor, action, entity, summary, metadata and request IP.

## Design decisions

- Business rules are enforced by the API, not only by disabled buttons in React.
- Terminal shipment states cannot be reopened through the normal lifecycle.
- Active driver/vehicle allocations are checked before assigning resources to a second active load.
- Money is rounded to two decimal places at the invoice calculation boundary.
- Password changes increment `tokenVersion`, invalidating other issued sessions.
- Public tracking has a separate rate limit and returns a deliberately restricted field selection.
- The browser demo is intentionally separate from API-backed mode and never writes demo records to MongoDB.

## Deployment notes

The Docker Compose file runs the web client, API and MongoDB. Set a unique JWT secret, restrict `CLIENT_ORIGIN`, use HTTPS at the edge, configure database backups and provide real external integration credentials before production use. Multi-tenant data isolation is not implemented in this portfolio build; do not host multiple unrelated customers in one shared database until tenant scoping is added to every query and index.

## Access roles

- `admin`: user administration, password resets, archive operations and all operational management.
- `dispatcher`: shipment/fleet coordination, maintenance, attendance, invoicing and audit review.
- `operator`: shipment operations, fuel entries and proof-of-delivery recording, with read access to other registers.
- `viewer`: read-only access.

Role checks run in Express middleware against the current database user record. Password changes increment the account token version so previously issued access tokens are rejected.


## Customer portal and shipment ownership (V1.3)

- Customer accounts are created through public registration as `role=customer`; a customer cannot select an internal role during registration.
- Email verification and administrator approval are required before customer sign-in.
- Customer shipment requests are created through `POST /api/shipments/customer-request` and are linked to `Shipment.customerUser`.
- `GET /api/shipments` and `GET /api/shipments/:id` scope customer results to the authenticated customer. Internal shipment create/update/delete and fleet/driver/operations APIs remain role-restricted.
- The customer portal has a separate navigation and dashboard. It supports shipment requests, progress summaries, event previews and public tracking links.
- The demo entry screen offers distinct Admin and Customer preview experiences. Demo records are local illustrative data and are not written to MongoDB.
- Admins review new customer accounts in Operations → User access, where they can approve/reject accounts, enable/disable access and assign workspace roles.

## Data isolation boundary

Customer-to-shipment ownership is enforced at the API query boundary for shipment list and detail endpoints. This is per-customer access control inside one FleetFlow workspace; it is not multi-tenant isolation between unrelated logistics companies. For multiple customer organisations operating as separate tenants, introduce a tenant/workspace identifier and scope every model, aggregation, index, export and background task before production multi-tenant use.


## V1.4 verified public tracking

- Public tracking no longer returns shipment route/status data from a tracking number alone.
- `POST /api/public/tracking/:trackingNumber/request-otp` sends a six-digit, five-minute code to the verified email on the shipment's approved customer account. The response is deliberately generic to reduce account and tracking-number enumeration.
- `POST /api/public/tracking/:trackingNumber/verify-otp` validates the hashed one-time code, enforces a maximum of five attempts, consumes the code, and only then returns the limited tracking timeline.
- Tracking challenges are stored separately, expire automatically through a MongoDB TTL index, and are rate-limited at the endpoint.
- Live email delivery still requires valid SMTP credentials and a real delivery test. Development mode does not expose tracking OTPs in API responses.
