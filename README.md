# FleetFlow — Logistics & Transportation Management

FleetFlow is a full-stack portfolio project built with React, Vite, Tailwind CSS, Node.js, Express and MongoDB. It includes shipment operations, fleet records, driver records, tracking-event history, reporting exports, JWT authentication and a separate local demo mode.

## Requirements

- Node.js 20 or newer (Node.js 22 LTS recommended)
- npm 10 or newer
- MongoDB Community Server running locally, or a MongoDB connection URI

## Windows setup (recommended)

Open PowerShell in the folder containing the root `package.json` and run these commands in order:

```powershell
npm install
# If npm 11 reports esbuild install scripts are awaiting approval:
npm install-scripts approve esbuild
npm rebuild esbuild
npm run setup
```

`npm run setup` creates `server/.env` automatically and generates a unique 48-byte JWT secret. It never overwrites an existing `.env` file. If MongoDB is installed as a Windows service, start it if needed:

```powershell
Get-Service MongoDB
Start-Service MongoDB   # only if the service is stopped; run PowerShell as Administrator
```

Now seed the local demo database and start both applications:

```powershell
npm run seed
npm run dev
```

Open the frontend at http://localhost:5173 and check the API at http://localhost:4000/api/health. All demo timestamps are displayed in Indian Standard Time (Asia/Kolkata).

### Why `npm run setup` matters

The server loads its environment file using a path resolved from the source file location, not the current terminal directory. This prevents the common `MONGODB_URI is required` error when npm runs a workspace command from a different working directory. The loader checks `server/.env` first and the project-root `.env` second.

### Demo login

- Email: `admin@fleetflow.demo`
- Password: `FleetFlowDemo!2026`

The seed command creates or resets this local demo administrator and recreates the demo shipment, vehicle and driver collections. **Only run it against a disposable development database. It deletes existing shipment, vehicle and driver records in the configured database.** Never run it against production or real customer data.

## Environment variables

The generated `server/.env` starts with these defaults:

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/fleetflow
JWT_SECRET=<generated automatically by npm run setup>
JWT_EXPIRES_IN=8h
CLIENT_ORIGIN=http://localhost:5173
BCRYPT_ROUNDS=12
ALLOW_PUBLIC_REGISTRATION=false
```

Use `CLIENT_ORIGIN` (not `CLIENT_URL`) because that is the variable read by the API's CORS configuration. Do not commit `server/.env` or share its JWT secret.

## Docker

Create `server/.env` first using `npm run setup`, then run:

```powershell
docker compose up --build
```

The web app is available at http://localhost:8080. Nginx proxies `/api` to the API container, and the API connects to the Compose MongoDB service.

## Useful commands

```powershell
npm run setup       # create local server/.env once
npm run seed        # reset development sample records; destructive to those collections
npm run dev         # run API and Vite frontend together
npm test            # run server unit tests
npm run build       # production-build the React frontend
npm run verify      # run tests followed by frontend production build
npm audit           # inspect dependency advisories
```


## Authentication V2 update

See [Authentication V2 implementation notes](docs/RELEASE_V2_AUTH.md) for customer onboarding, email verification, password reset, SMTP configuration, admin approval, and known release limitations. Customer accounts are intentionally not allowed into the internal operations console until a tenant-scoped customer portal is delivered.

## Modules

- **Overview:** database-backed shipment and fleet summary when connected to the API.
- **Shipments:** create, search, filter, inspect, edit, cancel and append tracking events.
- **Fleet:** register, inspect, update and archive vehicles.
- **Tracking:** shipment status and event timeline. The included route visualization is sample-only, not live GPS. Starter records use Indian cities, +91 phone numbers, Indian commercial vehicle registration formats and metric-tonne capacities.
- **Drivers:** driver directory, availability, licence details and vehicle assignment.
- **Reports:** status summaries and CSV exports.
- **Operations centre:** vehicle maintenance workflow with valid state transitions, statutory document expiry register, fuel ledger in INR with odometer checks, driver attendance, GST invoices and payment receipts, proof-of-delivery metadata, in-app exception notifications, audit history and administrator-managed user access.
- **Customer tracking:** public, rate-limited `/track/{trackingNumber}` page with a restricted shipment status and event timeline.
- **Account security:** password change, administrator password reset and token-version session revocation.
- **Settings:** local browser preferences and session controls.
- **Authentication:** JWT login, role middleware, password hashing, revocable token versions and rate limits.


### Roles and access

| Role | Intended access |
|---|---|
| Admin | Workspace users, role changes, password resets, archive controls and all operations |
| Dispatcher | Shipments, fleet/driver allocation, maintenance, attendance, invoices and audit review |
| Operator | Shipment events, fuel records and proof-of-delivery recording; read access to operational registers |
| Viewer | Read-only operational access |

The API checks roles on every protected write. Hiding or disabling a frontend control is not treated as an authorization boundary.

## API routes

- `GET /api/health`
- `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/auth/register` (disabled unless `ALLOW_PUBLIC_REGISTRATION=true`)
- `GET /api/dashboard/summary`
- `GET/POST /api/shipments`, `GET/PATCH/DELETE /api/shipments/:id`, `POST /api/shipments/:id/events`
- `GET/POST /api/vehicles`, `PATCH/DELETE /api/vehicles/:id`
- `GET/POST /api/drivers`, `PATCH/DELETE /api/drivers/:id`
- `GET/POST /api/operations/maintenance`, `PATCH /api/operations/maintenance/:id`
- `GET/POST /api/operations/fuel`
- `GET/POST /api/people/attendance`
- `GET/POST /api/operations/invoices`, `PATCH /api/operations/invoices/:id`, `POST /api/operations/invoices/:id/payments`
- `POST /api/operations/shipments/:id/pod`
- `GET/PATCH /api/operations/notifications`, `GET /api/operations/audit`
- `GET/PATCH/POST /api/people/users` (administrator only)
- `POST /api/auth/change-password`
- `GET /api/public/tracking/:trackingNumber`

All operational API routes require `Authorization: Bearer <token>`.

## Important limitations before real commercial use

This is a development/portfolio system, not a certified production logistics platform. Before using real operations data, complete a full browser-based end-to-end test pass; implement tenant/workspace data isolation; configure HTTPS, monitoring and tested backups; and connect a real map/GPS/telematics provider for live coordinates and ETA. POD fields store external document URLs rather than uploading binary files. Email/SMS/WhatsApp notifications and real-time WebSocket tracking are not enabled without provider credentials. Do not describe the sample route display as live GPS.

## Suggested interview explanation

“I built FleetFlow as a modular logistics operations application. It supports shipment creation and status history, fleet and driver records, reporting exports, JWT-protected APIs and MongoDB persistence. I separated the local demo workspace from API-backed mode so the interface can be explored without pretending the backend is connected. Real GPS telemetry and multi-tenant production deployment are future integrations.”


## India-localised demo dataset

The starter dataset uses Jaipur, Gurugram, Delhi, Ahmedabad, Pune, Indore, Bengaluru, Hyderabad, Surat, Morbi and Jodhpur routes. Vehicle records use Indian-style registration examples (for demonstration only), driver phone examples use +91 format, and load capacities use metric tonnes (MT). These are fictional sample records, not real drivers, registrations or shipments.

## Verification boundaries

`npm test` runs the included API tests and `npm run build` builds the React client. A passing build does not prove that a local MongoDB service is running or that every browser workflow is correct on your machine. Before real deployment, run the API with a disposable MongoDB database, test login and CRUD flows in a browser, configure backups and HTTPS, and connect a genuine map/GPS provider. The tracking page currently displays shipment events and sample route information, not live vehicle telemetry.

## Windows install-script note

On npm versions that block dependency lifecycle scripts until approval, approve esbuild once (`npm install-scripts approve esbuild`) and rebuild it (`npm rebuild esbuild`) before running the Vite development server or production build. Do not use `npm audit fix --force` blindly; review `npm audit` findings and update dependencies in a controlled change.

## Interactive workflow notes

- Shipment creation/edit forms select from the registered active fleet and eligible drivers instead of relying on manually typed IDs. The API checks that driver and vehicle assignments agree, rejects duplicate active allocations, and prevents fleet/driver status changes that conflict with active loads.
- Vehicle and driver detail panels include archive actions. The API refuses to archive a vehicle or driver that is still attached to an active shipment, and it clears the reciprocal assignment when an archive or reassignment succeeds. Vehicle maintenance and driver duty-state changes are also checked against active loads.
- Report metric tiles without a destination are rendered as non-buttons; navigable dashboard metrics remain clickable.
- The demo browser data uses versioned `ff_india_*` storage keys so older non-India sample records do not silently reappear after upgrading.

## End-to-end acceptance checklist

Use the browser and a disposable MongoDB database to verify the complete workflow. The detailed test cases are in [QA checklist](docs/QA_CHECKLIST.md). A passing unit-test suite does not replace this acceptance pass.

## Client and technical documentation

- [Client walkthrough](docs/CLIENT_PRESENTATION.md)
- [Architecture and data model](docs/ARCHITECTURE.md)
- [Operational API reference](docs/OPERATIONAL_API.md)
- [End-to-end QA checklist](docs/QA_CHECKLIST.md)


## Additional operational integrations (V2.1)

### Secure file uploads

The API accepts one PDF/JPEG/PNG/WEBP file per request at `POST /api/uploads` using `multipart/form-data` field `file`. Maximum size defaults to 10 MB (`MAX_UPLOAD_BYTES`). The returned `/api/uploads/:filename` URL is authenticated and requires the caller's bearer token; do not expose it as a public link. Set `UPLOAD_DIR` to a persistent private volume in production and back it up. For multi-instance production deployments, replace local disk with a private S3-compatible bucket and signed URLs.

### GPS / telematics ingestion

FleetFlow now accepts authenticated position updates at `POST /api/telemetry/locations` with `{ vehicle, latitude, longitude, speedKph, heading, recordedAt, source }`. Latest positions are available at `GET /api/telemetry/locations/latest`; history is available at `GET /api/telemetry/locations/:vehicle/history`. A real GPS feed still requires a compatible tracker/device or telematics provider to POST its signed/normalized readings to this endpoint. The endpoint is an ingestion API, not a GPS hardware subscription or map tile service. Protect it behind a provider adapter/API key gateway before connecting third-party devices.

### Production deployment requirements

Before a customer production rollout, provision a private persistent upload bucket, TLS, backups, monitoring, a telematics provider, and the required email/SMS/WhatsApp provider credentials. The current release does not claim turnkey integration with a carrier/GPS hardware provider or external messaging vendor. Multi-company tenant isolation must be implemented and penetration-tested before hosting multiple unrelated customer companies in the same database; use separate database deployments until that work is complete.

## GitHub, Vercel and Render deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the complete deployment guide. The repository includes a root `vercel.json` for the Vite frontend, `render.yaml` for the Express API and persistent uploads, and a GitHub Actions workflow that runs backend tests and the frontend production build.

**Hosting layout:** Vercel (React frontend) → Render (Express API) → MongoDB Atlas (database). Set `VITE_API_URL` in Vercel to the Render API origin ending in `/api`; set `CLIENT_ORIGIN`, `PUBLIC_API_URL`, `MONGODB_URI`, and the generated `JWT_SECRET` in Render. Never commit secrets or expose them through `VITE_` variables.


## V1.3 customer portal

The sign-in screen now offers separate local demo entry points for the Admin dashboard and Customer dashboard. Real customer accounts use the separate registration/sign-in flow, require email verification and administrator approval, and land in a customer-only workspace. Customers can submit shipment requests and view only shipments associated with their customer account. Operations staff review new accounts under Operations → User access. Demo dashboards use local illustrative records and are not connected to the API.

Customer shipment API:
- `POST /api/shipments/customer-request` — customer-only shipment request
- `GET /api/shipments` — customer-scoped list for customer role; operations list for internal roles
- `GET /api/shipments/:id` — ownership checked for customer role

Remaining external/production dependencies: configure SMTP credentials and test real email delivery; configure an actual GPS/telematics provider for live location; configure private persistent object storage, HTTPS, monitoring and backups; and implement/penetration-test full multi-tenant workspace isolation before serving unrelated logistics companies in one shared database.


## V1.4 privacy update

Public shipment tracking now requires a short-lived email OTP sent to the verified email on the shipment's approved customer account. A tracking number by itself no longer reveals route, delivery status or event history. Configure SMTP before testing this feature end-to-end. Tracking OTPs are stored as hashes, expire after five minutes, are limited to five verification attempts and are one-use. The request/verify endpoints have a dedicated rate limit.

### Optional real GPS tracking with Traccar
FleetFlow can poll a self-hosted Traccar server for real device positions. Configure `TRACCAR_BASE_URL`, `TRACCAR_USERNAME`, and `TRACCAR_PASSWORD` in the server environment. In FleetFlow, set each vehicle's `traccarDeviceId` to the numeric Traccar device ID (via the vehicle create/update API). The poller reads `/api/positions` every 30 seconds, stores newer fixes as device-sourced locations, and updates the vehicle's last reported coordinates. In API mode, the Tracking & Routes screen now polls `GET /api/telemetry/locations/latest` every 30 seconds and displays each real GPS fix with speed, heading, last-seen age, and an OpenStreetMap link. Demo mode continues to label its route illustration as sample-only. Traccar must be reachable from the FleetFlow backend; GPS hardware or the Traccar Client app must be actively sending positions. This integration remains disabled until credentials are configured.


## Multi-company rollout status

See [TENANT_ISOLATION_STATUS.md](./TENANT_ISOLATION_STATUS.md). The current tenant schema is a migration foundation only; do not use it as proof of production tenant isolation yet.
