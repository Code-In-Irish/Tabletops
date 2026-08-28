# TTX Live

Live, audience-driven tabletop exercise tool. Replaces slide-clicking with a
host console and a phone-based participant view: the host advances through
setup → question → injects, and the room submits answers live (multiple
choice, free text, or both, per prompt) instead of just talking over each
other.

Part of the BRIGID suite. Built standalone; not owned or run by Odyssey.

## Stack

- **Frontend:** React + Vite, plain CSS (no framework)
- **Backend:** Supabase (Postgres + Realtime), no custom server
- **Auth:** none — anonymous join via room code, matches how a live
  in-person exercise actually works
- **Hosting:** static build, deployed to GitHub Pages via GitHub Actions

## How it works

- **Host** (`/#/host`): pick an exercise, start a session, get a room code +
  QR. Advancing a beat updates one row (`sessions.current_beat_id`); every
  connected participant's screen updates within about a second via Supabase
  Realtime.
- **Participant** (`/#/r/ROOMCODE`): join with name + role, land on whatever
  beat is currently live (not beat one — late joiners catch up
  automatically), answer each prompt.
- **Prompts** are authored per-inject, not per-scenario: each one is either
  `free` (open text box), `mc` (buttons, pass `mc_options` as a JSON array),
  or `both`.

## Local setup

```bash
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase
# project settings (Project Settings → API)
npm run dev
```

Open the printed local URL. `/#/host` to run a session, `/#/r/CODE` (or
scan the QR from the host screen) to join as a participant. Test with two
browser tabs or a phone on the same network.

## Database schema

Applied as Supabase migrations (see `supabase/migrations` if you export
them from the project, or the project's migration history in the Supabase
dashboard). Seven tables:

```
exercises        a top-level TTX (e.g. "Wicked Woods 2026")
scenarios        ordered scenarios within an exercise
beats            setup / question / inject, chained via next_beat_id
prompts          one or more per beat; mc / free / both response mode
sessions         a live run of an exercise; room_code + current_beat_id
participants     name + role, no auth, scoped to one session
submissions      one row per response, tied to a prompt + participant
```

`next_beat_id` is what makes the host's "Next" button work — each beat
points at the next one, so the whole exercise is just a linked list the
host walks. It's also the hook for **Tier 3** (branching): make a beat's
"next" depend on what the room answered instead of always being fixed, and
the rest of the app doesn't need to change.

## Authoring content

No admin UI yet — new exercises are written directly via SQL against the
Supabase project (`apply_migration` if using the Supabase MCP tools, or the
SQL editor in the dashboard). See the seed migration for the full pattern:
insert an exercise, its scenarios, each scenario's beats (linked via
`next_beat_id`), and each beat's prompts.

## Deploying

### One-time setup
1. Push this repo to GitHub.
2. Repo Settings → Pages → Source → **GitHub Actions**.
3. Repo Settings → Secrets and variables → Actions → add two repository
   secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   (values below, from the current `ttx-live` Supabase project)

### After that
Every push to `main` builds and deploys automatically via
`.github/workflows/deploy.yml`. No manual `npm run build` / upload step.

## Known gaps (v1)

- **No host auth.** Anyone with the room code can advance the session or
  update it — fine for a facilitator-led room, not fine if you ever expose
  a room code publicly.
- **No submission limits.** A participant can submit to the same prompt as
  many times as they want. Free text: probably fine. MC: worth adding a
  one-vote-per-person constraint before relying on tallies for a decision.
- **No admin UI.** New exercises are SQL-only for now.
- **Tier 3 (branching) not built.** Schema supports it (`next_beat_id` per
  beat), the host UI doesn't yet expose choosing a branch.
