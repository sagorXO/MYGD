# Supabase Database Integration & Setup Guide

This guide walks you through connecting your **MY GERMAN DÖNER / HORIZON** application to **Supabase** (PostgreSQL) for cloud deployment on Vercel or your production server.

---

## 1. Create a Supabase Project

1. Go to [https://database.new](https://database.new) (or log in to [supabase.com](https://supabase.com)).
2. Click **"New Project"**.
3. Fill in the details:
   - **Project Name:** `mygd-pos-prod` (or your choice)
   - **Database Password:** Choose a strong password and save it in your password manager.
   - **Region:** Choose a region close to your users (e.g. `Frankfurt (eu-central-1)` or `London (eu-west-2)`).
4. Click **"Create new project"** and wait ~1-2 minutes for provisioning to complete.

---

## 2. Obtain Your Connection Strings

In your Supabase Dashboard:

1. Click on the **Project Settings** (gear icon at bottom left) ➔ **Database**.
2. Scroll down to the **"Connection string"** section and select the **"URI"** or **"Prisma"** tab.

You will need **two connection strings**:

### A. `DATABASE_URL` (Transaction Connection Pooler — Port 6543)
- Switch the mode toggle to **"Transaction"** (or use port `6543`).
- This connection string looks like:
  ```env
  DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
  ```
- *Why:* Serverless functions (like Vercel API routes) spin up and down rapidly. The transaction pooler handles thousands of simultaneous connections without exhausting PostgreSQL connection limits.

### B. `DIRECT_URL` (Direct Connection — Port 5432)
- Switch the mode toggle to **"Session"** or direct (port `5432`).
- This connection string looks like:
  ```env
  DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
  ```
- *Why:* Used by Prisma CLI (`prisma db push`, `prisma migrate`) to run DDL schema modifications that transaction poolers do not allow.

---

## 3. Set Up Local Environment (`.env.local`)

Create or update your `.env.local` file in the project root:

```env
# Supabase PostgreSQL Database URLs
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Next.js Application Environment Variables
NEXT_PUBLIC_DEFAULT_LOCATION="EMBA"
NEXT_PUBLIC_DEFAULT_TERMINAL="KIOSK-01"
NEXT_PUBLIC_CYPRUS_VAT_RATE="0.19"
NEXT_PUBLIC_STORE_CURRENCY="EUR"
ADMIN_DEFAULT_PIN="1234"
SESSION_SECRET="generate_a_random_32_character_secret"
PORT=3000
NODE_ENV="production"
```

---

## 4. Push Schema & Seed Initial Data

Once your `.env.local` has the live Supabase URLs, run the following commands in your terminal:

```bash
# 1. Push the 15 enterprise models and enums directly to Supabase Postgres
npx prisma db push

# 2. Seed the database with official stores (Emba & Limassol), categories, products, and modifiers
npx tsx prisma/seed.ts
```

You can now open the **Table Editor** in your Supabase Dashboard to view all populated tables (`Location`, `Terminal`, `Category`, `Product`, `ModifierGroup`, `Order`, `AdminUser`, etc.).

---

## 5. Add Environment Variables to Vercel

When deploying to Vercel:

1. Open your project on the [Vercel Dashboard](https://vercel.com).
2. Go to **Settings** ➔ **Environment Variables**.
3. Add the following variables:
   - `DATABASE_URL` = *(Your Supabase pooled connection string)*
   - `DIRECT_URL` = *(Your Supabase direct connection string)*
   - `NEXT_PUBLIC_DEFAULT_LOCATION` = `EMBA`
   - `NEXT_PUBLIC_DEFAULT_TERMINAL` = `KIOSK-01`
   - `NEXT_PUBLIC_CYPRUS_VAT_RATE` = `0.19`
   - `NEXT_PUBLIC_STORE_CURRENCY` = `EUR`
   - `ADMIN_DEFAULT_PIN` = `1234`
   - `SESSION_SECRET` = *(Your random session secret)*
4. Click **Save** and trigger a **Redeploy**.

---

## 6. Verification Checklist

- [x] Prisma datasource provider configured to `postgresql`.
- [x] Direct URL configured for Prisma CLI migrations.
- [x] Database pragmas safely guarded for PostgreSQL compatibility in `src/lib/prisma.ts`.
- [x] API routes (`/api/orders/create`, `/api/orders/[id]`, `/api/menu`, `/api/admin/*`) verified for PostgreSQL execution.
