# Development, quality, and release guide

## Local setup

Node 24 LTS and npm; `npm ci`, then `npm run dev`. Versions are pinned in package.json and package-lock.json. Use `npm ci` in CI and fresh checkouts. `npm run preview` serves the built output; it is not a production server. No environment variables or service credentials are needed for the current foundation.

Use `npm run check` (types plus repository/theme checks), and `npm run build`. A GitHub Actions workflow is prepared but has not run remotely; no repository was created/pushed. CI is a local-file preparation only.

The dependency cache, node_modules, dist, real environment files and local browser artifacts are ignored. Do not commit secrets or imported personal notes. When cloud work begins, add an explicit environment example containing names/placeholders only, Wrangler configuration and reviewed migrations. Avoid empty credential templates for services we do not use yet.

## Working conventions

One package; shared React components; strict TypeScript; semantic HTML and CSS tokens. Keep editor state isolated from navigation/theme state. Changes to appearance must not remount the editor or alter serialized content. Prefer small vertical features over empty layers and speculative interfaces.

Foundation code is a theme preview and type vocabulary, not a database implementation. Add runtime validation, schema migrations, typed repository operations and tests together in T01. Add libraries only when used. Reuse maintained editing/auth/parsing logic and preserve package notices.

## Test strategy by risk

| Area | Required evidence when implemented |
| --- | --- |
| Persistence | Real IndexedDB/browser test; reload; failed writes; schema upgrade; committed version recovery |
| Export/restore | Fresh-profile round-trip and attachment checksums; corruption/interruption/duplicates |
| Theme/layout | Same note/selection/undo before and after switch; keyboard/screen-reader/mobile parity |
| Search | Representative expected results, scope and incremental update behavior; indexing does not block typing |
| Sync | Offline two-device conflicts, stale/duplicate responses, delete/move races, old cursor, expired auth |
| Files/security | Ownership, unsafe content, wrong length/checksum, simultaneous quota reservations, orphan cleanup |
| PWA | Install/offline reopen; update during editing; multiple tabs and migration compatibility |

Use `npm test` for Vitest integrity/save-queue tests. Run `npm run test:browser:install` once, then `npm run test:browser` for Chromium (Android/desktop) and WebKit (iPhone). The browser helper keeps binaries and screenshots inside ignored `.local-qa/`; CI adds `--with-deps` for Linux browser dependencies. WebKit mobile emulation uses DOM selection fixtures because it has no actual iOS Select All menu/selection handles. Real iPhone and Android keyboard/IME testing remains necessary; desktop WebKit is not an iPhone certification. Do not add tests that merely repeat a constant or a placeholder component’s structure.

Legacy editor/library fixtures explicitly use Normal mode with onboarding completed; experience tests cover default Test onboarding, Home, hold menus, sleeping/awake Evie, trial/purchase simulation and reset isolation. Every browser context is disposable. Never run a reset test against an owner's normal profile. Latest sources include 24 unit cases and 69 browser scenarios. Units passed; latest full browser run passed 66/69, then the affected 9 scenarios passed after fixture corrections. All distinct scenarios have passing evidence across those runs, not a single clean full run. Exact results are in STATUS. Approval review is available again; never treat typechecking as execution.

## Performance budgets

Targets, not current measurements: warm local note open p95 ≤150 ms; create/focus ≤200 ms; local search after index ready p95 ≤150 ms with a 10,000-note/approximately 20 MB fixture; INP ≤200 ms; cold usable editor target ≤2.5 s on a documented mid-range phone/network profile; no repeated main-thread work >50 ms while typing.

Aim for ≤250 KB gzip shell, ≤500 KB including editor, and ≤100 KB initial mascot artwork. Lazy-load tools and optimize master PNGs before using them in the product. Record actual build payloads and device measurements; the foundation has no editor/dataset or real-device measurements yet.

## Accessibility and visual checks

WCAG 2.2 AA target; readable note body in both visual modes; visible keyboard focus; approximately 44 px primary touch targets as a product preference; contrast, safe areas, 200% zoom/reflow and reduced motion. The script’s contrast checks cover selected token pairs only. Review real mobile keyboard, selection/paste/IME, dialogs, announcements and touch interactions before calling a screen verified.

## Before cloud activation / deployment

Prepare a reviewable build, binding/configuration plan, migration/rollback procedure, privacy boundaries and capacity model. Keep static hosting, auth/sync and private file hosting distinct. No public bucket. Verify the actual shared Cloudflare account allowances; test quota failures and backups. A successful local build does not mean deployed, installed, offline-ready, encrypted or backed up.

## Operational runbook outline for T06

Do not claim these procedures exist until implemented and drilled:

1. Inspect service/quota health without note-content logs; pause signups/uploads while preserving local writing.
2. Diagnose a failed mutation/upload using consented, minimal identifiers; retain pending local content.
3. Restore a database and file snapshot in isolation, check counts/hashes, and apply deletion records before exposing restored content.
4. Roll back frontend/API with compatible data migrations; never erase local unsynced edits to fix a deploy.
5. Delete live account data and expire backups under a documented retention policy; prevent deleted-account resurrection after restore.
6. Communicate incident impact and recovery plainly; avoid promising an unsupported response-time SLA on zero-budget operations.

## Handoff and context

STATUS holds current reality and the next task. Update it after meaningful work; do not force the owner to read or edit planning files. A new assistant reads AGENTS/STATUS and only the relevant docs, not the whole transcript. A fresh chat does not reset plan usage limits or guarantee fewer billed tokens; it simply starts without this chat’s full conversational history. Continuing this chat is also supported; context can be compacted. See [OpenAI’s agent-loop explanation](https://openai.com/index/unrolling-the-codex-agent-loop/) and [Codex usage guidance](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).
