# CS Club Website 2027

Next.js (App Router) + TypeScript site for the CS club.

## Setup

```bash
git clone <repo-url>
cd CS_Club_Website-2027
npm install
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

## Commands

| Command | What it does |
|---------|--------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |

## Routes

Folders under `src/app/` **are** the router. Shared chrome lives in `src/app/layout.tsx`.

| Path | File |
|------|------|
| `/` | `src/app/page.tsx` |
| `/team` | `src/app/team/page.tsx` |
| `/hackhive` | `src/app/hackhive/page.tsx` |
| `/careers` | `src/app/careers/page.tsx` |
| `/login` | `src/app/login/page.tsx` |
| `/passport` | `src/app/passport/page.tsx` |
| `/events` | `src/app/events/page.tsx` |
| `/admin` | `src/app/admin/page.tsx` |
| `/api/events` | `src/app/api/events/route.ts` |

## Git notes

`node_modules/` and `.next/` are gitignored. Commit `package.json` and `package-lock.json`.

## Executive dashboard setup

The executive dashboard uses Supabase Auth and database row-level security. There is no public sign-up route.

1. Apply the SQL files in `supabase/migrations/` in timestamp order.
2. In Supabase Authentication, create each executive user with their email and a temporary password.
3. Add each Auth user to the whitelist from the Supabase SQL Editor:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('executive@ontariotechu.net')
on conflict (user_id) do nothing;
```

4. Copy `.env.example` to `.env.local` and add the project URL and publishable key.

Whitelisted users can sign in at `/login` and manage events and job postings at `/admin`.
