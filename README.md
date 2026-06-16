# Trip Expense Ledger

Web application for tracking trip expenses in **Omani Riyal (OMR)** with receipt uploads, per-employee ledgers, and an admin master ledger.

## Features

- Employee login / self-registration
- Mobile-first employee dashboard with budget snapshot
- Add expenses with optional receipt (client-side image compression)
- Confirm-before-save workflow
- Admin master ledger with hover receipt preview
- Export master ledger to Excel/PDF and receipts to ZIP
- End-of-trip ledger archive (snapshot expenses, reset active ledger)
- Admin user management and password reset
- Default budget per employee (OMR)

## Tech Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Supabase (Auth, Postgres, Storage)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.local.example` to `.env.local` and fill in values from your [Supabase dashboard](https://supabase.com/dashboard/project/thzwbzejlzzcfgvdgeiz):

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Run database migrations

Apply all SQL files in `supabase/migrations/` via the Supabase SQL Editor or CLI:

```bash
npx supabase link --project-ref thzwbzejlzzcfgvdgeiz
npx supabase db push
```

Migrations (apply in order):

1. `20260608120000_initial_schema.sql` — core tables, RLS, receipt storage
2. `20260609120000_fix_receipt_storage_rls.sql` — receipt upload policies
3. `20260616120000_ledger_archives.sql` — archive tables and storage (required for the **Archive** admin menu)

If the Archive page shows **"Could not find the table 'public.ledger_archives' in the schema cache"**, the app is connected to Supabase but migration #3 has not been applied yet. Run `npx supabase db push` or paste the contents of `20260616120000_ledger_archives.sql` into the [Supabase SQL Editor](https://supabase.com/dashboard/project/thzwbzejlzzcfgvdgeiz/sql/new).

### 4. Seed admin user

```bash
npx tsx scripts/seed-admin.ts
```

Default admin: **CFI** / password from `ADMIN_INITIAL_PASSWORD` in `.env.local`.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Deploy to [Vercel](https://vercel.com) and set the same environment variables. Supabase hosts the database, auth, and receipt storage.

## Project structure

- `src/app/(auth)` — login & register
- `src/app/(employee)` — mobile-first employee screens
- `src/app/(admin)` — admin dashboard & master ledger
- `src/app/api/admin` — admin API (users, export, settings)
- `supabase/migrations` — database schema & RLS
