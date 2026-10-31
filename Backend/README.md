# Backend setup

<<<<<<< HEAD
## PostgreSQL and migrations

1. Install and start PostgreSQL, then create a database (for example,
   `odoo_hackathon`).
2. From the repository root, copy the example environment file and edit the
   database URL with your local PostgreSQL username, password, host, port, and
   database name:

   ```powershell
   Copy-Item Backend\.env.example Backend\.env
   ```

3. Run the initial schema migration:

   ```powershell
   Set-Location Backend
   npm run db:migrate
=======
1. Make sure PostgreSQL is running and create a database named `odoo_hackathon`.
2. Copy `.env.example` to `.env`, replace `YOUR_POSTGRES_PASSWORD` with the password for your PostgreSQL user, and set `AUTH_TOKEN_SECRET` to a long random value. If using another user or database, update the URL accordingly.
3. From this directory, install dependencies and create/update the database tables:

   ```sh
   npm install
   npm run db:push
>>>>>>> 315d366 (done)
   ```

4. Start the API:

<<<<<<< HEAD
   ```powershell
   npm run dev
   ```

The `.env` file is ignored by Git. Do not commit credentials. If a password
contains reserved URL characters, percent-encode them in `DATABASE_URL`.

`DATABASE_URL` is required by both Drizzle Kit and the API server. The database
itself must exist and be reachable before migrations can create its tables.
=======
   ```sh
   npm run dev
   ```

The frontend expects the API at `http://localhost:5000` by default.

## Roles and subscription lifecycle

New registrations always receive the `CUSTOMER` role. To bootstrap the first
administrator after registering, run this once using the PostgreSQL account
owner (replace the email with that account):

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

Admins can promote registered users to `STAFF`, assign staff to customers,
create plans, and create subscriptions. Staff only see assigned customers and
their related subscriptions and invoices. Customers can browse active plans,
subscribe, view their own billing records, request cancellation, and reverse a
scheduled cancellation before period end.

Subscriptions snapshot the agreed amount, currency, and billing frequency.
Self-service and admin-created paid subscriptions both start at
`PENDING_PAYMENT` and receive an initial invoice. An invoice payment must be
recorded before the subscription activates. Admin manual payment records are
audited. Development test checkout is clearly labeled and makes no real charge;
it is disabled in production. A payment provider must be configured before
production checkout can be enabled.

The backend runs billing lifecycle processing at startup and once per day:
renewal invoices are generated from the subscription snapshots, unpaid invoices
become overdue, subscriptions move to `PAST_DUE`, scheduled cancellations
complete at period end, and past-due access expires after a seven-day grace
period. These changes are recorded in `audit_logs`.

## API routes

Authentication routes:

- `GET /api/public/plans`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Authenticated application routes use `Authorization: Bearer <token>`:

- `GET /api/dashboard`
- `GET /api/customers` and `GET /api/customers/:id` (role-scoped)
- `POST /api/customers` (admin)
- `GET|POST /api/products` and `GET /api/products/:id`
- `GET /api/plans`; `POST|PATCH /api/plans` (admin)
- `GET /api/subscriptions`; `POST /api/subscriptions` (admin)
- `POST /api/customer/subscriptions` (customer self-service)
- `POST /api/subscriptions/:id/cancel|reinstate` (customer/admin)
- `GET|POST /api/quotations` (admin/staff)
- `GET /api/invoices` and `GET /api/invoices/:id` (role-scoped)
- `POST /api/invoices` and `POST /api/admin/invoices/:id/payments` (admin)
- `POST /api/customer/invoices/:id/checkout` and
  `POST /api/customer/payments/:id/complete-test` (development test only)
- `GET /api/payments` (role-scoped verified payments)
- `POST /api/admin/staff-assignments` and `/api/admin/process-lifecycle` (admin)

Password reset codes are returned by the API only outside production because
this project does not yet have an email-delivery provider configured. Production
reset requests return an explicit configuration error rather than claiming that
an email was sent.
>>>>>>> 315d366 (done)
