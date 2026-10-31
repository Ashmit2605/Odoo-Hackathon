# Backend setup

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
   ```

4. Start the API:

   ```powershell
   npm run dev
   ```

The `.env` file is ignored by Git. Do not commit credentials. If a password
contains reserved URL characters, percent-encode them in `DATABASE_URL`.

`DATABASE_URL` is required by both Drizzle Kit and the API server. The database
itself must exist and be reachable before migrations can create its tables.
