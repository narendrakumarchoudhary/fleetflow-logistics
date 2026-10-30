# Operational API Reference

All routes below are prefixed with `/api`. Except health, login, registration (disabled by default) and public tracking, requests require `Authorization: Bearer <token>`.

## Identity and access

- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/change-password`
- `POST /auth/register` — disabled unless explicitly enabled in server configuration.
- `GET /people/users`, `POST /people/users`, `PATCH /people/users/:id`
- `PATCH /people/users/:id/password`

## Logistics

- `GET/POST /shipments`
- `GET/PATCH/DELETE /shipments/:id`
- `POST /shipments/:id/events`
- `GET/POST /vehicles`
- `PATCH/DELETE /vehicles/:id`
- `PATCH /vehicles/:id/documents`
- `GET /vehicles/expiring-documents?days=60`
- `GET/POST /drivers`, `PATCH/DELETE /drivers/:id`
- `GET /public/tracking/:trackingNumber` — public, rate-limited and field-restricted.

## Operations, costs and compliance

- `GET/POST /operations/maintenance`
- `PATCH /operations/maintenance/:id` — validates the maintenance lifecycle; completed/cancelled jobs are terminal.
- `GET/POST /operations/fuel` — calculates INR totals and rejects odometer readings below the latest saved reading.
- `GET/POST /people/attendance`
- `GET/POST /operations/invoices`
- `PATCH /operations/invoices/:id`
- `POST /operations/invoices/:id/payments`
- `POST /operations/shipments/:id/pod` — only valid in-transit/out-for-delivery states can be completed with POD.
- `GET /operations/notifications`
- `PATCH /operations/notifications/:id/read`
- `PATCH /operations/notifications/read-all`
- `GET /operations/audit`
- `GET /dashboard/summary`

## Standard error meanings

- `400`: invalid request or invalid state transition input.
- `401`: missing, invalid, expired or revoked session.
- `403`: authenticated user does not have the required role.
- `404`: requested record or route does not exist.
- `409`: duplicate value or business-rule conflict (for example, resource already assigned to an active load).
- `503` on health: API process is running but MongoDB is not ready.

## Integration boundaries

The API stores POD document/signature URLs; binary upload storage is not bundled. GPS provider webhooks, outbound email/SMS/WhatsApp, and automatic scheduled reminders are not enabled without provider credentials and deployment configuration. Shipment delay/delivery exceptions create in-app notifications for administrators and dispatchers. Vehicle and driver changes are validated against active allocations.
