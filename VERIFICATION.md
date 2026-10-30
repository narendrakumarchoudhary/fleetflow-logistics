# FleetFlow V1.4 verification report

## Implemented in source
- Separate admin and customer workspaces and demo entry options retained from V1.3.
- Customer registration remains a customer-only role; email verification and admin approval are required for real customer login.
- Customer shipment ownership is enforced for list and detail APIs.
- Customer shipment requests are linked to the signed-in customer.
- Public tracking now requires a one-time code delivered to the verified email associated with the shipment's approved customer account.
- Tracking OTP is stored hashed, expires in five minutes, permits at most five verification attempts, is one-use, and has a MongoDB TTL index.
- Tracking request and verification share a dedicated 12 requests / 15 minutes rate limit.
- The public tracking UI includes email request and OTP verification forms.
- Public tracking no longer returns shipment details for tracking-number-only GET requests.

## Verification limits
- 14/14 backend unit tests pass, including tracking OTP generation, hashing and validation tests. All 37 backend JavaScript source files pass `node --check`.\n- This source archive has not been connected to a real MongoDB instance for API integration testing.
- SMTP delivery cannot be verified without a valid SMTP host, user, password, sender identity and recipient inbox.
- The Vite production build and browser E2E suite must be run after dependency installation in the user's environment.
- Live vehicle GPS requires a real telematics provider/device and credentials; sample locations are not live GPS.
- Production deployment requires real hosting/database accounts, domain/DNS, HTTPS, persistent private file storage, backups and monitoring.
- The app remains a single FleetFlow operator workspace with individual customer accounts; it is not a multi-tenant SaaS control plane for separate logistics companies.

## Commands to run after extraction
- `npm install`
- `npm test`
- `npm run build`
- `npm run dev`

Configure `server/.env` using `server/.env.example`; use a unique JWT secret and valid SMTP credentials before production use.

## Traccar integration added after V1.4
- Added an optional Traccar REST polling service (30-second interval) with HTTP Basic authentication and bounded request timeout.
- Added `traccarDeviceId` to vehicle records/API validation so devices can be mapped to vehicles.
- Added GPS position normalization, coordinate validation, knot-to-km/h conversion, stale-fix rejection, and device-sourced location persistence.
- Live synchronization remains unverified until a reachable Traccar server, device, and credentials are configured.
