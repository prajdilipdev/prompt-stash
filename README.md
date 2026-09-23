# Prompt Stash

**Your prompts, organized.**

Prompt Stash is a production-ready prompt-management platform: save, organize, refine, test,
favorite, archive, import, export, and reuse the AI prompts you rely on — with real
authentication, per-user data isolation enforced in PostgreSQL, a professional theme system,
a Windows desktop build, and a premium About experience.

| Web | Desktop | Backend | CI |
| --- | --- | --- | --- |
| React + Vite + TypeScript + Tailwind | Tauri (Windows x64, NSIS + MSI) | Supabase (PostgreSQL + Auth + RLS) | GitHub Actions (quality + Windows build) |

---

## Feature list

- **Prompt CRUD** with title, description, content, notes, tags, favorite state
- **Prompt editor** with debounced autosave (`Saving… / Saved / Unable to save`), variable
  detection, tag selector with case-insensitive dedupe, and `⌘/Ctrl+S`
- **Prompt viewer** with copy, favorite, duplicate, archive, trash, edit, and test actions
- **Variable system** — `{{variable_name}}` detection, labels, and a **Prompt Tester** that
  resolves values locally (pure string substitution; nothing is executed or sent anywhere)
- **Library views** — All, Favorites, Recent (30-day window), Archived, Trash — plus per-tag views
  with live counts
- **Search** across title, description, content, notes, and tag names (server-side, debounced,
  case-insensitive partial matching)
- **Sorting** — recently updated, recently created, alphabetical, oldest first
- **Grid / list** layouts, persisted preference
- **Tags** — create, rename, delete, assign, remove, filter; case-insensitive uniqueness enforced
  by a database unique index so duplicates cannot exist
- **Soft deletion** — archive (restorable) and trash (restorable until permanent delete, which
  requires typed confirmation)
- **Import / Export** — validated JSON round-trip (`Select file → Validate → Preview → Confirm →
  Import → Report`); imported ids/timestamps are never trusted
- **Command palette** (`⌘/Ctrl+K`) with full keyboard navigation and prompt search
- **Keyboard shortcuts** — `⌘K` palette, `⌘N` new prompt, `⌘S` save, `⌘⇧C` copy prompt, `Esc` close
- **Themes** — Obsidian Pro (dark), Paper Pro (light), System mode, and six restrained accent
  presets (Electric Blue, Indigo, Violet, Emerald, Teal, Amber), all persisted
- **Settings** — account (display name, logout), appearance, library defaults, data import/export,
  and a strongly-confirmed danger zone
- **Auth** — signup (with email-confirmation handling), login, logout, password reset/recovery,
  session persistence, protected routes, human-readable errors
- **About page** — ten-section editorial product story built from real UI fragments, with
  IntersectionObserver reveals and `prefers-reduced-motion` support
- **Responsive** — desktop sidebar, mobile drawer, stacked cards, adapted dialogs
- **Accessibility** — semantic landmarks, focus-trapped dialogs, radiogroups/menus with keyboard
  support, visible focus rings, aria-live toasts

## Architecture

```
prompt-stash/
├── src/
│   ├── components/          # App shell, UI kit, palette, tester, dialogs
│   │   └── ui/              # Button, Input, Dialog, Menu, Tabs, States…
│   ├── features/
│   │   ├── auth/            # AuthProvider, login/signup/reset, ConfigGate
│   │   ├── prompts/         # Library, viewer, editor
│   │   ├── settings/        # Settings page
│   │   └── about/           # About page + UI fragment illustrations
│   ├── hooks/               # useLibrary, useTags, useTheme, hotkeys, reveal…
│   ├── lib/                 # supabase client, variables, import/export, utils
│   ├── services/            # Typed data-access layer over supabase-js
│   ├── types/               # Domain types + sort/view contracts
│   └── styles/globals.css   # Design tokens (themes, accents, radii, motion)
├── supabase/
│   ├── migrations/          # 001 schema · 002 RLS · 003 indexes
│   └── seed.sql             # Local-dev demo user + example library
├── src-tauri/               # Tauri desktop shell (NSIS + MSI bundling)
├── .github/workflows/       # ci.yml · build-windows.yml
├── e2e/                     # Playwright specs (run against real Supabase)
├── scripts/                 # Icon generator, QA double, QA screenshots
└── vercel.json              # SPA rewrites + security headers
```

State management is deliberately split: **TanStack Query** owns server state (with optimistic
favorite toggling and cache invalidation); local React state owns UI concerns. No Redux.

## Tech stack

React 18 · TypeScript (strict) · Vite 5 · React Router 6 · Tailwind CSS 3 · TanStack Query 5 ·
React Hook Form + Zod · lucide-react · supabase-js 2 · Vitest + Testing Library · Playwright ·
Tauri 2 · Vercel · GitHub Actions.

## Requirements

- Node.js ≥ 20, npm ≥ 10
- A Supabase project (or the Supabase CLI for local development)
- For desktop builds only: Rust stable + platform toolchains (Windows x64 target for installers)

## Installation

```bash
git clone <your-repo-url> prompt-stash
cd prompt-stash
npm install
```

## Environment variables

Copy the example and fill in your project:

```bash
cp .env.example .env
```

```ini
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # or the legacy anon key
```

**Never** commit `.env`, and **never** place a service-role key in the frontend, desktop bundle,
or CI secrets list for the web build. All access control is enforced by Row Level Security.

## Supabase setup

1. Create a project at supabase.com.
2. Apply the migrations (SQL Editor → run each file in order, or Supabase CLI):
   - `supabase/migrations/001_initial_schema.sql` — tables (`profiles`, `prompts`, `tags`,
     `prompt_tags`), `updated_at` triggers, automatic profile creation on signup
   - `supabase/migrations/002_rls_policies.sql` — RLS enabled on every table with owner-only
     SELECT/INSERT/UPDATE/DELETE policies; `prompt_tags` derives ownership from parent rows
   - `supabase/migrations/003_indexes.sql` — owner-scoped sort/filter indexes, partial indexes for
     active/archived/trashed/favorites, trigram indexes for search
3. (Local dev) `supabase start && supabase db reset` applies migrations and
   `supabase/seed.sql` — a demo account (`demo@promptstash.dev` / `promptstash-demo`) plus an
   example library. Seed data is for local development only.

## Local development

```bash
npm run dev        # web app on http://localhost:5173
```

### QA mode without a Supabase project (development tooling)

The repo ships a QA double that implements the Supabase REST/auth surface so the UI can be
exercised end-to-end without credentials. It is tooling — the shipped product only ever talks to
real Supabase.

```bash
node scripts/mock-supabase.mjs &     # QA double on :8877
QA_PROXY=1 npm run dev               # dev server proxies /rest + /auth to the double
```

Then sign in with any email/password (the double authenticates a fixed QA user). Visual QA:

```bash
npx playwright install chromium --with-deps
npm run qa:shots                     # screenshots into scripts/qa-shots/
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b` + production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | Strict TypeScript project build |
| `npm run lint` | ESLint (zero warnings allowed) |
| `npm run test` | Vitest unit + component tests |
| `npm run e2e` | Playwright (requires `E2E_EMAIL`/`E2E_PASSWORD` + configured `.env`) |
| `npm run icons` | Regenerate brand PNGs + full Tauri icon set |
| `npm run tauri:dev` / `tauri:build` | Tauri desktop development / release builds |
| `npm run qa:mock` / `qa:shots` | QA double / screenshot suite |

## Testing

- **Unit** (`npm run test`): variable parser & resolver, import validation/parsing, export shape,
  sorting, PostgREST `or()` escaping, time formatting.
- **Component**: PromptCard (render, favorite mutation, clipboard, tag truncation), PromptTester
  (detection, live resolution, copy, reset).
- **E2E** (`e2e/library.spec.ts`): login, create → edit → search → favorite → archive → restore,
  theme persistence. Specs skip themselves unless `E2E_EMAIL`/`E2E_PASSWORD` are provided against a
  real project, so CI can run anywhere.

## Production build & Vercel deployment

The app is a static SPA:

1. Push the repo to GitHub and import it in Vercel (framework preset: Vite).
2. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Deploy. `vercel.json` already configures the build command, output directory, SPA rewrites,
   and security/cache headers — no further configuration needed.

`npm run build` produces `dist/`; `npm run preview` verifies it locally.

## Desktop (Tauri, Windows x64)

The desktop app reuses the same frontend — there is no separate desktop UI. `src-tauri/` is fully
configured: product name **Prompt Stash**, identifier `com.promptstash.desktop`, NSIS **and** MSI
bundle targets, embedded WebView2 bootstrapper, hardened CSP allowing only `https://*.supabase.co`
connections, and generated icons (`npm run icons`).

Local desktop development (any OS):

```bash
npm run tauri:dev
```

### Producing the Windows installer

Windows-native binaries cannot be produced on Linux/macOS. This environment therefore does **not**
ship a prebuilt `.exe`; instead the repository contains the complete, ready-to-run automation:

- `.github/workflows/build-windows.yml` — on `workflow_dispatch` or `v*` tags: checks out, installs
  Node 20 + Rust (target `x86_64-pc-windows-msvc`), writes `.env` from repository secrets
  (**publishable key only**), builds the frontend, runs `tauri build`, and uploads
  `Prompt Stash_1.0.0_x64-setup.exe` (NSIS) and the MSI as artifacts — attaching both to a GitHub
  Release on tags.
- Exact manual commands on a Windows x64 machine:

```powershell
npm ci
# create .env with VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY
npx tauri build --target x86_64-pc-windows-msvc
# → src-tauri\target\x86_64-pc-windows-msvc\release\bundle\nsis\*.exe
# → src-tauri\target\x86_64-pc-windows-msvc\release\bundle\msi\*.msi
```

### Desktop environment configuration

The Tauri build inlines the same `VITE_*` variables at compile time. Use your production Supabase
publishable key in CI secrets. The service-role key must never be added to the repository, CI, or
the bundle.

## Security model

- Supabase Auth for credentials; no manual password handling.
- RLS on every table; policies compare `auth.uid()` to `user_id` (and derive `prompt_tags`
  ownership from parent rows). The frontend never filters on behalf of security.
- Case-insensitive unique index prevents duplicate tags; Zod validates every form and every
  imported row; imported ids/timestamps are ignored.
- Destructive actions require confirmation; permanent deletion requires a typed phrase.
- Only the publishable key ships to clients; CSP in Tauri restricts network egress.

## Troubleshooting

- **Blank app / setup gate** — `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` missing; the app
  intentionally shows the configuration guide instead of faking data.
- **“Incorrect email or password”** — check email confirmation is complete for the account.
- **Preview host blocked in dev** — Vite `server.allowedHosts` is already `true`; if you customize
  it, add your proxy host.
- **Tauri build fails on icons** — run `npm run icons` to regenerate the full icon set.
- **Playwright browsers missing** — `npx playwright install chromium --with-deps`.

---

Prompt Stash · React · TypeScript · Supabase · Tauri · Vercel
