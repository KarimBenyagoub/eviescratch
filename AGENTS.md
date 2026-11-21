# EvieScratch coding guide

## Resume cheaply

Read `docs/STATUS.md`, then the relevant task in `docs/PLAN.md`. Read only the product/design/architecture sections needed for that task. Do not reload the long research brief, image prompts, lockfile, or all source files into context routinely. Use README as the map. Treat later user instructions as authoritative; current docs supersede older research proposals.

## Product constraints

- Mobile-first **PWA only**. No native clients or store packaging in the MVP.
- Notes belong to Journals; Journals optionally belong to Shelves. No deeper hierarchy initially.
- Owner's current UI requirements: useful Home/navigation; silent green Evie/Journal intro for about 1.5 seconds with no text or skip button, then smoothly into skippable onboarding; sleeping companion with a tiny breath while browsing, awake with one random 6–14 second blink beside an open note; tap-hide and Settings restore; hold/right-click note menus; complete options in both editor corners; clearable, muted editable fields and primary-field focus. User-facing Trash is **Litter box**. A Shelf move must choose/create a Journal on that Shelf.
- Test and Normal environments are independent of appearance. Keep their databases/preferences separate (`eviescratch-demo` vs original `eviescratch`). Demo reset must check Test mode and the exact demo database name and must never target normal notes. Development defaults to Test, production builds to Normal unless explicitly selected otherwise. Never equate a client-side Test flag with server billing authorization.
- Use real action titles: **Start Free Trial** and **Buy Now** (skip trial). Test can simulate both; Normal must remain pending until secure checkout is implemented. Show parenthesized remaining trial days below the header/contextual offer, or honest not-started/paid status. Never create a live entitlement from local demo timestamps.
- One mascot, Evie. Preserve her asymmetric calico markings. Do not mirror artwork to create new directions.
- Two visual modes: **Normal** is default; **Pixel Art** is an optional, gently suggested alternative. Same components, data, controls, and semantics in both. No pixel font for note bodies. Appearance is separate from future light/dark color schemes.
- Local-first editing and full export/restore before cloud sync. Never claim a note is saved until local commit succeeds or synced before server acknowledgment.
- Proposed cloud beta: 100 MB attachments per invited user, 10 MB per file; account-wide capacity gates and backup headroom are mandatory. This is not unlimited free hosting or an already activated service.
- Cloudflare is confirmed for beta infrastructure. Owner has a UK LTD and existing Stripe account; use Stripe as the payment baseline. Commercial model is confirmed: **three-day free full-feature trial, then US$7.99/week or US$299.88/year; no permanent free tier**. Choose the interval upfront; first payment is due immediately after the trial ends, then recurring at the selected interval. Read `docs/GROWTH.md` before onboarding/billing work. The trial is the hands-on demo; prioritize immediate first-note value, no mandatory tour/setup, and clear checkout terms. Markets/tax treatment, retention and offline grace still need decisions. Do not reopen trial/prices/monthly/freemium proposals without new user direction.

## Implementation

- Keep a single TypeScript/React/Vite application. Reuse maintained libraries for editor, IndexedDB, auth, and search. Add dependencies only when used.
- Put theme values in `src/styles/tokens.css`; use semantic tokens in shared components. Avoid separate app trees for each theme.
- Use IndexedDB for note content/files, not localStorage. localStorage is only for small non-sensitive preferences.
- Keep imports and large image assets out of the initial editor bundle. Existing mascot PNGs are masters, not optimized production files.
- No content analytics, third-party AI, public attachment bucket, client-side secrets, or fake success states. Security rules also apply to local previews/imported HTML.
- Do not add speculative abstractions, services, approval workflows, or test mirrors of trivial code. Write meaningful tests for persistence, restore, quotas, conflicts, and authorization when those features exist.

## Verify and hand off

Run `npm run check` and `npm run build` for affected code/config changes. Add and run the relevant task's integration checks. For documentation-only changes, `npm run verify` is sufficient. Review real mobile behavior when UI changes; do not describe typechecking as visual QA.

Update `docs/STATUS.md` with what exists, exact verification performed, known limitations, and next task. Record material architecture changes in the small decision log in `docs/ARCHITECTURE.md`; do not create an ADR file for every minor choice. Keep README commands working.

No deploy, cloud subscription activation, user-data migration, secret creation, or license publication is part of the current foundation task. Continue reversible local work without repeated permission requests. Do not delegate to subagents unless the user requests it.

Owner handoff preference: the app must be running and opened directly in Codex, with the local server left running. Do not substitute run instructions for an immediately usable preview. Necessary local schema upgrades accompany authorized feature work; preserve existing notes and verify migrations.
