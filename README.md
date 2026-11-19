# ByteLearn

AI-powered visual lessons: a prompt becomes a Manim video with narration.

This package is the **Vercel app** (Next.js 15). Slow generation runs on EC2. See [`Byte_Learn_17_backend/README.md`](../Byte_Learn_17_backend/README.md).

## Architecture

```
Browser  -->  Vercel (Next.js)
                 |  writes Prompt + Video + Mux (QUEUED)
                 |  polls GET /api/videos until COMPLETED or FAILED
                 v
              Postgres
                 ^
                 |  poll / claim / update stage + status + URL
              EC2 worker (Node 22)
                 |
                 |  HTTP on the Docker network only
              EC2 renderer (Python FastAPI + Manim)
                 |
                 v
              Supabase storage
```

- **Vercel** is UI, Clerk auth, and short database writes. Hobby kills requests after 300s, so it never runs Cursor, TTS, or Manim, and it never calls EC2.
- **EC2** claims the oldest `Mux` row with `status=QUEUED`, updates `Mux.stage` as it plans / narrates / codes / checks / renders, then writes the public URL to `Mux.finalvideoUrl` and `Video.videoUrl`.
- The database is the only link. Vercel does not call EC2. EC2 does not call Vercel.

Prisma migrations live in this package (`prisma/`). The worker copies the schema and runs `prisma generate` only.

## Tech stack

- Next.js 15, React 19, Tailwind
- Clerk authentication
- Prisma + PostgreSQL
- TanStack Query for polling

## Prerequisites

- Node.js 22+
- npm
- A PostgreSQL database (the same one the EC2 worker uses)
- Clerk application keys

## Setup

```bash
cd Byte_Learn_17
cp .env.example .env.local
# fill in DATABASE_URL and Clerk keys
npm install
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Do not run `prisma migrate dev` or `prisma migrate deploy` against production from a laptop unless you intend to apply the pending migration. Local `npm run dev` only needs a reachable `DATABASE_URL` for listing/creating rows.

## Environment

Vercel needs:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser key |
| `CLERK_SECRET_KEY` | Clerk server key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/dashboard` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/dashboard` |

Cursor, Deepgram, Supabase storage, and renderer secrets belong on EC2 only. See the backend README.

## Database schema

- **User** — Clerk-linked account
- **Prompt** — learning prompt and language
- **Script** — generated Manim script, explanation, narration
- **Audio** — narration audio URL
- **Video** — render status and `videoUrl`
- **Mux** — worker job: `status`, `stage`, `attempts`, `finalvideoUrl`, `errorMessage`

`Mux.stage` values while a job is running: `queued`, `planning`, `narrating`, `coding`, `checking`, `rendering`.

## Generation flow

1. `POST /api/generate` validates the prompt, upserts the Clerk user, and in one transaction creates a Prompt, a Video (`QUEUED`), and a Mux (`QUEUED`, `stage=queued`). It returns `202` with `{ success, promptId, promptRecordId }`.
2. The UI navigates to `/learn?id={promptId}` and polls `GET /api/videos/{id}` every 5 seconds until `COMPLETED` or `FAILED`.
3. The EC2 worker claims the Mux row, advances `stage`, and writes the final URL.
4. Generation typically takes 15–40 minutes.

## Migrations

Apply Prisma migrations from this package. Run this **once against the production database before deploying the new EC2 worker**:

```bash
npx prisma migrate deploy
```

That applies `20261119120000_add_mux_stage_attempts` (`Mux.stage`, `Mux.attempts`). The worker will not start cleanly if those columns are missing.

## Scripts

```bash
npm run dev      # Next.js dev server
npm run build    # prisma generate && next build
npm run start    # production server
npm run lint     # ESLint
npx prisma generate
npx prisma migrate deploy
```

## Deploy (Vercel)

1. Run `npx prisma migrate deploy` against production Postgres.
2. Keep `DATABASE_URL` and Clerk variables on Vercel.
3. Remove worker-only variables from Vercel (`WORKER_URL`, `VIDEO_WEBHOOK_SECRET`, `CURSOR_API_KEY`, `DEEPGRAM_API_KEY`, `ENABLE_TTS`, `BACKEND_URL`, `APP_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `MUX_BUCKET_NAME`, GitHub Models / Gemini / ElevenLabs keys).
4. Deploy this Next.js app. Deploy the EC2 stack from `Byte_Learn_17_backend`.
