# Treax

A build-in-public network for student builders in Bangladesh.

Every post is a real builder update — a launch, a lesson, a setback, a milestone, or a
genuine co-founder ask. The Treax filter checks each one before it reaches the feed, so
there is no "gm", no "big things coming", no motivational threads.

This is a production port of the single-file prototype in [`prototype/Treax.dc.html`](prototype/Treax.dc.html),
which remains the design source of truth. Ported components carry line references back
into that file so any pixel can be traced to its origin.

---

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript strict |
| Styling | Tailwind CSS v4 + CSS variables for the design tokens |
| Database | PostgreSQL (Neon) via Prisma |
| Auth | Auth.js (NextAuth v5) — credentials + university-SSO stub, JWT with a `role` claim |
| AI | Groq (`llama-3.3-70b-versatile`) behind `src/lib/ai/` |
| Images | Cloudinary behind `src/lib/upload.ts` |
| Realtime | Pusher Channels behind `src/lib/realtime.ts` |
| i18n | next-intl, EN + BN, cookie-driven (no locale in the URL) |
| Tests | Vitest + Testing Library, Playwright for critical flows |

Each integration is reached through a single module, so swapping a provider means editing
one file rather than the whole app. All three degrade gracefully when their keys are absent:
the filter falls back to its deterministic heuristics, uploads return a clear 503, and
realtime silently no-ops while the UI refreshes after its own mutations.

---

## Getting started

```bash
pnpm install
cp .env.example .env        # then fill in DATABASE_URL and AUTH_SECRET at minimum
pnpm db:migrate             # or `pnpm db:push` for a throwaway database
pnpm db:seed
pnpm dev
```

Open http://localhost:3000 and sign in as `tahmid@student.buet.ac.bd` / `treax1234`
(an ADMIN account, so the control room at `/admin` is reachable).

`AUTH_SECRET` is the only secret required to boot. Groq, Cloudinary and Pusher keys can be
added later — nothing crashes without them.

### Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production build and serve |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:migrate` | Apply migrations in development |
| `pnpm db:deploy` | Apply migrations in CI/production |
| `pnpm db:seed` | Load the prototype's demo cast |
| `pnpm db:studio` | Prisma Studio |
| `pnpm test` | Unit tests |
| `pnpm test:e2e` | Playwright |
| `pnpm account` | Create or update an account (see below) |

### Creating accounts

```bash
pnpm account --email you@uni.edu --password 'a-strong-one' --name 'Your Name' --role ADMIN
```

`--role` is `BUILDER` (default), `EXPERT` or `ADMIN`. `--handle`, `--university`,
`--building`, `--focus` and `--bio` are optional. Re-running with the same email updates
that account, so it doubles as a password reset for local and staging databases.

Accounts made this way skip the setup flow and land straight on the feed.

### Neon connection strings

`DATABASE_URL` should be the **pooled** string (the host containing `-pooler`) and
`DIRECT_URL` the unpooled one. Prisma's migration engine needs a real session, which
PgBouncer in transaction mode cannot provide, so migrations run over `DIRECT_URL` while the
app itself uses the pool.

---

## Roles

| Role | Can |
| --- | --- |
| `BUILDER` | Feed, posting, profile, services, blogs, messages, notifications, market, learn, experts, AI tools, limited agent commands |
| `EXPERT` | Everything a builder can, plus an expert profile and bookable sessions |
| `ADMIN` | Everything, plus `/admin`: moderation queue, verification, badges, suspensions, ad campaigns, the platform billboard, KPIs, audit log, and the full agent command set |

Access is enforced in three independent places, because any one of them can be bypassed
on its own:

1. **`src/middleware.ts`** — route guard. Reads only the JWT, so it is cheap but can act on
   a stale `role` claim. Never the sole check.
2. **`assertRole()` / `assertAdmin()`** in `src/lib/session.ts` — every Server Action and
   Route Handler re-reads the role from the database before it writes.
3. **Prisma query scoping** — reads filter by the caller's own id. Nothing trusts an id
   that arrived from the client.

---

## The filter

`src/lib/ai/filter.ts` is the heart of the product and runs two passes:

- **Heuristics** (`analyzeHeuristic`) — a faithful transcription of `analyze()` from the
  prototype: the same fluff patterns, substance regex, tag cascade and 0–98 ship score.
  Deterministic, always runs, no network.
- **LLM** (`analyze`) — a Groq call that can bounce something the regexes let through and
  sharpen the tag and score.

The two combine conservatively. A heuristic **rejection is final** — those rules encode the
product's anti-hype stance and a model does not get to argue them away. The LLM may only
reject further, or refine an accepted post's tag and score. If Groq is unavailable or
returns malformed JSON, the heuristic verdict stands. The filter never fails open.

Rejected posts are never written to `Post`; the verdict, reason and source are stored so
moderation can audit any decision later.

---

## Project layout

```
prisma/
  schema.prisma        # full data model
  seed.ts              # the prototype's demo cast, idempotent
src/
  app/
    (auth)/            # login, multi-step signup, welcome, onboarding
    (app)/             # everything behind the app chrome
    api/               # auth, preferences, uploads, realtime auth
  components/
    layout/            # top bar, rails, shell — the ported chrome
    providers/         # theme + locale, toasts, realtime
    ui/                # icon set transcribed from the prototype
  i18n/                # locale config, EN/BN message bundles
  lib/                 # db, auth, session guards, ai, upload, realtime, rate limits
prototype/             # the original single-file prototype, for reference
```

---

## Design system

Tokens live in `src/app/globals.css`, lifted verbatim from the prototype's `themes()` map —
brand green `#9fe870`, on-primary `#163300`, and the full light/dark pairs. Both themes and
both languages are resolved **on the server** from cookies kept in sync with `User.theme`
and `User.locale`, so the first paint is already correct and neither flashes.

Two deliberate departures from the prototype, both required by the brief:

- **No `body { zoom }`.** The prototype scaled everything with `zoom: 1.12` (1.14 on mobile).
  The port keeps the authored pixel values and drops the zoom, which is what makes the
  desktop content column measure the specified 1216px rather than 1362px.
- **44px mobile controls.** The top-bar control set was 40px, which rendered at ~45.6px under
  `zoom: 1.14`. Without the zoom, 40px would have failed the ≥44px hit-target requirement, so
  those controls are 44px — preserving both the rendered size and the accessibility floor.

---

## Deploying to Vercel

1. Push the repo and import it in Vercel.
2. Set every variable from `.env.example` in the project settings.
3. Build command is `pnpm build` (it runs `prisma generate` first).
4. Run `pnpm db:deploy` against the production database once, then `pnpm db:seed` if you
   want the demo content.
5. Point Cloudinary's allowed origins and Pusher's app at the deployed domain.

`next.config.ts` already allows `res.cloudinary.com` as a remote image host.
