# FleetFlow end-to-end acceptance checklist

Run this against a disposable development database, never a production database. Start MongoDB, run `npm run setup`, `npm run seed`, and `npm run dev` from the project root.

## Readiness and access

- [ ] `GET http://localhost:4000/api/health` reports `status: ok` and `database: connected`.
- [ ] Sign in with the demo administrator and confirm the API-backed session is active.
- [ ] Open `/api/auth/me` with the bearer token and confirm the signed-in identity and role.
- [ ] Sign out, sign in again, change the password, and confirm the old token is revoked.
- [ ] Create a viewer account and confirm write actions are rejected with HTTP 403.
- [ ] Confirm the workspace cannot be left without an active administrator.

## Shipment and allocation workflow

- [ ] Create a shipment with a registered Indian vehicle and its assigned driver.
- [ ] Confirm it appears after a hard refresh (database persistence).
- [ ] Try assigning the same vehicle or driver to another active shipment; expect HTTP 409.
- [ ] Try an invalid status transition; expect HTTP 409 and no database change.
- [ ] Add an event and confirm it appears in the shipment timeline and public tracking page.
- [ ] Move a shipment to Delayed and confirm an in-app exception notification is created.
- [ ] Complete a shipment with POD and confirm status Delivered, progress 100, and a delivery event.
- [ ] Confirm completed/cancelled shipments release vehicle and driver availability when no other active load uses them.

## Fleet and people operations

- [ ] Register, update and archive a vehicle; confirm active-load archive protection.
- [ ] Add RC/Insurance/Fitness/Permit/PUC details and confirm the expiry register shows them.
- [ ] Try setting a vehicle with an active load to Maintenance or Offline; expect HTTP 409.
- [ ] Add/update/archive a driver; confirm reciprocal vehicle assignment stays consistent.
- [ ] Try marking a driver on leave/off duty during an active load; expect HTTP 409.
- [ ] Record attendance and verify the unique driver/date record is updated rather than duplicated.

## Operating costs and billing

- [ ] Schedule maintenance and move it through Scheduled → In Progress → Completed.
- [ ] Try reopening a completed/cancelled maintenance record; expect HTTP 409.
- [ ] Record fuel and confirm litres × price per litre is saved as INR total cost.
- [ ] Enter an odometer lower than the latest record; expect HTTP 409.
- [ ] Create an invoice with multiple line items and a GST rate; verify subtotal, GST and total.
- [ ] Record a partial payment, then the balance; verify the invoice reaches Paid.
- [ ] Try paying a void invoice or overpaying an invoice; expect a conflict/error.

## Audit, notifications and public tracking

- [ ] Confirm maintenance, fuel, invoice, payment, user, shipment and document changes create audit entries.
- [ ] Mark one notification read, then mark all read; confirm unread count reaches zero.
- [ ] Open a public tracking URL without a token; confirm only the restricted tracking fields are returned.
- [ ] Confirm public tracking does not expose customer phone, driver personal details, POD URLs, signatures or internal audit data.

## Evidence to retain for a client handover

- [ ] Save screenshots of the main workflow and role restrictions.
- [ ] Save `npm test`, `npm run build`, and `npm audit` output.
- [ ] Record the MongoDB version, Node version, deployment environment, backup policy and restore test.
- [ ] Configure HTTPS, secrets, monitoring, database backups and tenant isolation before using real client data.

GPS coordinates, object-storage uploads, and outbound email/SMS/WhatsApp are external integrations and should only be marked complete after their provider credentials and live acceptance tests are configured.
