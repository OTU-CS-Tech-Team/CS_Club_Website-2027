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
