# FleetFlow Authentication V2 — implementation notes

## Implemented in this revision

- Public customer registration is controlled by `ALLOW_PUBLIC_REGISTRATION=true`.
- Multi-step-style onboarding fields capture account type, name, email, mobile, address, purpose, and business name/GSTIN when relevant.
- Self-registration always creates the restricted `customer` role. It cannot self-select admin, dispatcher, operator, or viewer permissions.
- Passwords are hashed with bcrypt; registration requires at least 12 characters.
- Email verification tokens and password-reset tokens are random, single-use, SHA-256 hashed in MongoDB, and expire (24 hours and 15 minutes respectively).
- Forgot-password responses do not disclose whether an email exists.
- SMTP delivery is supported through Nodemailer. Configure SMTP before production.
- In development only, verification/reset tokens are returned in the API response to allow testing without a mail provider. This must never be enabled in production.
- Admin user management can approve/reject customer onboarding, disable accounts, change roles, and revoke sessions by resetting passwords.
- Customer sign-in is deliberately blocked after approval in this release because a tenant-scoped customer shipment portal is not yet implemented. This prevents customers from entering internal operations screens or seeing other customers' records.

## Required configuration

```env
ALLOW_PUBLIC_REGISTRATION=true
CLIENT_URL=https://your-frontend-domain.example
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
MAIL_FROM=FleetFlow <no-reply@your-domain.example>
```

Keep SMTP credentials and JWT secrets out of Git. Use a transactional email provider and verify the sending domain before production.

## API additions

- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `PATCH /api/people/users/:id` accepts `onboardingStatus: pending|approved|rejected` for admin review.

## Remaining before customer launch

- Build a customer-only portal and enforce shipment ownership at every query and mutation.
- Add an explicit tenant/workspace model and tenant scoping to every collection, query, index, audit record and background task.
- Add rate-limit/abuse tests, email delivery tests, browser E2E tests and MongoDB integration tests.
- Add production secrets, HTTPS, monitoring, backup/restore and incident-response procedures.

Do not describe this revision as production-ready or multi-tenant. The current implementation is a portfolio/demo release with safer customer onboarding groundwork.
