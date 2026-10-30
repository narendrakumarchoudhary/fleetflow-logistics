# FleetFlow Logistics — GitHub, Vercel and Render deployment

This repository is a monorepo. Deploy the React/Vite frontend to Vercel and the Express/MongoDB API to Render. MongoDB Atlas is the managed database. Vercel hosts the frontend; it is **not** used to run the current long-lived Express server or store uploaded files.

## 1. Before publishing

- Create a private GitHub repository first if the source is not ready for public release.
- Never commit `.env`, API keys, MongoDB credentials, JWT secrets, production uploads or customer data.
- Keep `ALLOW_PUBLIC_REGISTRATION=false` for a company workspace.
- The demo seed account is for local development only. Do not run the seed script against production.
- Replace demo names, phone numbers, email addresses and customer records before a real client rollout.

## 2. Push to GitHub

From the extracted project root:

```bash
git init
git add .
git commit -m "Prepare FleetFlow deployment"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/fleetflow-logistics.git
git push -u origin main
```

Create the repository on GitHub first. Replace `YOUR-ACCOUNT` with the actual GitHub account or organization. Do not upload `.env` files or production data.

GitHub Actions runs backend tests and the Vite production build on pushes and pull requests to `main`/`master`.

## 3. Create MongoDB Atlas database

1. Create a MongoDB Atlas cluster and a database user with a strong unique password.
2. Add the Render outbound IP addresses to the Atlas network access list. For an initial evaluation only, Atlas `0.0.0.0/0` can be used temporarily; restrict it before production.
3. Copy the Atlas connection string and replace the password/database placeholders. Use database name `fleetflow`.
4. Keep the connection string private. Add it only as the Render `MONGODB_URI` environment variable.

## 4. Deploy the API on Render

1. In Render, choose **New → Blueprint** and connect the GitHub repository containing `render.yaml`.
2. Render reads `render.yaml` and creates the `fleetflow-api` web service.
3. Set these environment values in the Render service dashboard:
   - `MONGODB_URI`: Atlas connection string.
   - `CLIENT_ORIGIN`: exact Vercel production origin, e.g. `https://your-project.vercel.app` (no trailing slash). Add additional comma-separated preview origins only if required.
   - `PUBLIC_API_URL`: the public Render service origin, e.g. `https://fleetflow-api.onrender.com` (no `/api`).
4. Keep the generated `JWT_SECRET`; never replace it with a checked-in value.
5. Wait for `/api/health` to return HTTP 200 with `database: "connected"`.

The Render Blueprint provisions a persistent disk for local uploads. If you move to another host, ensure the upload directory is on persistent storage. For higher-scale production, move documents to private object storage and use signed downloads.

## 5. Deploy the frontend on Vercel

1. In Vercel, choose **Add New → Project** and import the GitHub repository.
2. Keep the project root directory at the repository root (not `client`). The root `vercel.json` runs the workspace build and publishes `client/dist`.
3. Add the Vercel environment variable for Production (and Preview if needed):
   - `VITE_API_URL` = `https://YOUR-RENDER-SERVICE.onrender.com/api`
4. Deploy. Vercel rebuilds the frontend whenever the selected Git branch receives a new commit.
5. Copy the final Vercel origin and add it to Render's `CLIENT_ORIGIN`, then redeploy/restart the API.

The API base URL must include `/api`. Do not put `MONGODB_URI`, `JWT_SECRET`, email-provider keys or other server secrets in any `VITE_` variable; Vite exposes `VITE_` values to browser code.

## 6. Production smoke test

- Open the Vercel site and confirm the login screen loads.
- Open `https://YOUR-RENDER-SERVICE.onrender.com/api/health`; expect `status: "ok"` and `database: "connected"`.
- Create a production administrator through a controlled one-time provisioning process. Do not use the demo seed credentials.
- Sign in, create a test vehicle, driver and shipment, refresh the page, and confirm records persist.
- Upload a small PDF to the authenticated documents endpoint and confirm an authorized user can download it.
- Verify an unauthenticated request to a protected endpoint returns HTTP 401.
- Check Render logs and browser network requests for CORS, database or API errors.

## 7. Email and company contact details

The repository currently supports in-app notifications. Outbound email delivery is **not wired to an email provider in this release**. For Resend/SMTP, first verify a domain you control, configure SPF/DKIM/DMARC, then implement and test the mail service. Keep provider credentials as server-only Render environment variables (for example `RESEND_API_KEY`); never add them to GitHub or `VITE_` variables. Demo company contact values should be replaced with verified business details before customer use.

## 8. Important production gaps

- This is a deployment configuration, not proof of a completed production acceptance test. Test the deployed API against the actual Atlas cluster.
- The current local upload storage is persisted by the Render disk but is tied to one service instance. Use private object storage for multi-instance deployments.
- Tenant isolation is not implemented as a complete multi-company boundary. Do not host multiple unrelated companies in the same production workspace until tenant scoping and authorization tests are completed.
- Configure a custom domain, HTTPS, backups, monitoring, retention policy and an incident/recovery process before a real customer launch.

## First production administrator

Public registration is disabled by default. After the Render service has connected to Atlas, use the Render service Shell for a one-time administrator bootstrap:

1. Temporarily add `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, and `BOOTSTRAP_ADMIN_PASSWORD` as Render environment variables. Use a real mailbox you control and a unique password of at least 16 characters.
2. In the Render Shell, run `npm run bootstrap:admin` from the service root (`server`). The script refuses to run outside production and refuses to create a second active administrator.
3. Remove the three `BOOTSTRAP_ADMIN_*` variables from the Render environment after the command succeeds.
4. Sign in through FleetFlow and create any additional workspace users from the People module.

Do not put the bootstrap password in GitHub, source code, this ZIP, a browser variable or a public issue.
