# Lion Digital Solution

Website for [Lion Digital Solution](https://liondigitalsolution.com/): a React + Vite site, an Express API for enquiries and the admin panel, and a Postgres database on Supabase. Deployed on Vercel.

## Project layout

- `src/` – the React site (`App.tsx`) and the admin panel (`src/admin/`, opened at `/developerayan`).
- `public/` – static pages (services, blog, country pages, privacy policy, 404), images and `sitemap.xml`.
- `server/` – the Express API (`api.js`), app setup (`app.js`) and database setup (`db.js`).
- `api/index.js` – the Vercel serverless entry that runs the same Express API for `/api/*`.
- `vercel.json` – build settings, headers, redirects and rewrites.

## Setup

Requires Node.js 20 or newer.

```bash
npm ci
cp .env.example .env   # then fill in the values
npm run dev            # site + API on http://localhost:5173
```

On first start the server creates any missing tables and, if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set and no admin exists yet, the first admin account.

## Environment variables

| Name | Required | What it is |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string (Supabase). |
| `DATABASE_CA` | No | The database CA certificate (PEM). When set, the TLS certificate is verified. Newlines may be written as `\n`. |
| `SESSION_SECRET` | Yes, for admin | Long random string used to sign admin sessions. Changing it signs everyone out. |
| `ADMIN_EMAIL` | First run only | Email for the first admin account. |
| `ADMIN_PASSWORD` | First run only | Password for the first admin account. Change it in the admin panel afterwards. |

Never commit `.env`. Set the same variables in Vercel under Project Settings > Environment Variables.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server (Vite + API on one port). |
| `npm run build` | Production build into `dist/`. |
| `npm start` | Serves `dist/` and the API with Node (non-Vercel hosting). |
| `npm run lint` | ESLint. |
| `npm run typecheck` | TypeScript check of the frontend. |
| `npm run indexnow` | Pings IndexNow with the sitemap URLs. |

## Deploying on Vercel

1. Import the GitHub repo in Vercel. The build settings come from `vercel.json` (`vite build`, output `dist`).
2. Add the environment variables above.
3. Every push to `main` deploys to production. Every pull request gets its own preview URL, so check changes there before merging.

## Security notes

- Login attempts (8 per 15 minutes) and contact form enquiries (10 per hour) are rate limited per IP, stored in the `login_attempts` table.
- Admin sessions are signed out everywhere when the admin password changes.
- All database tables have row level security on with no policies; only the server's direct Postgres connection can read or write them.
