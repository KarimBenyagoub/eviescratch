# EvieScratch

A simple, mobile-first notes PWA with Notes → Journals → optional Shelves, and one mascot: Emily’s female calico cat, Evie.

**Current state:** expanded local prototype: Home, full logo/welcome/onboarding, Evie companion, Journals/Shelves, worker search, pins, Archive/litter box, full note menus and Settings. Test mode has isolated demo data and reset; Normal mode preserves the user library. Both appearance modes and responsive iOS/Android targets remain. The shared top-right hamburger opens navigation and Settings; contextual Help buttons explain key actions. Read STATUS for exact verification evidence.

## Start here

| You need | Read |
| --- | --- |
| What exists, latest checks, next task | [STATUS.md](docs/STATUS.md) |
| Product rules and minimum release | [PRODUCT.md](docs/PRODUCT.md) |
| Visual modes, wireframes, Figma research | [DESIGN.md](docs/DESIGN.md) |
| PWA onboarding, trial checkout and revenue | [GROWTH.md](docs/GROWTH.md) — confirmed three days free, then US$7.99/week or US$299.88/year |
| Data, saving, sync, hosting, security | [ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Ordered work and acceptance criteria | [PLAN.md](docs/PLAN.md) |
| Development, testing, release and recovery | [DEVELOPMENT.md](docs/DEVELOPMENT.md) |
| Instructions for coding assistants | [AGENTS.md](AGENTS.md) |
| Original detailed research | [EvieScratch.MD](EvieScratch.MD) — historical background; current docs above supersede changed decisions |
| Mascot PNGs, atlas, prompts | [Asset guide](assets/mascot/ASSETS.MD) |

The owner does not need to maintain this documentation. The implementing assistant updates status as work progresses and explains consequential changes in chat. A joining engineer can read this index, STATUS, then the relevant document.

## Run locally

Use Node **24 LTS** and npm. From this folder:

```sh
npm ci
npm run dev
```

The owner-facing preview is kept running and opened directly in Codex. First use starts with Evie and the app logo, then welcome/organization/plan choice. Home offers quick capture and recent notes. Settings switches Test/Normal environments; appearance is a separate Normal/Pixel Art choice. Test mode uses `eviescratch-demo`; Normal mode keeps `eviescratch`. The demo reset never targets the normal library. No account, API key or paid service is required for this local prototype; live billing is not connected.

Notes live in IndexedDB for this browser profile and origin (including the port). Wait for **Saved on this device** before closing. You can continue writing without a connection after the editor loads; offline reload/relaunch is not implemented yet. Clearing browser data can remove notes. Draft/recovery JSON downloads are escape routes, not the complete backup/restore feature, and cannot yet be imported through the app.

```sh
npm run check
npm run build
npm run preview
npm test
npm run test:browser:install
npm run test:browser
```

`check` verifies application/test types, internal documentation links, and essential theme contrast pairs. `build` creates `dist/`. `test` covers transactions, migrations, corruption, stale revisions, and the save queue. `test:browser` covers editing/reload, offline editing after load, failures/downloads, conflicts, checklists, theme/selection/undo, and responsive layouts in Chromium and WebKit. Test browsers and screenshots stay in ignored `.local-qa/`. Linux CI also installs browser OS dependencies. Browser emulation does not verify an actual iPhone or Android keyboard.

## Next implementation handoff

In this folder, give the builder:

> Read AGENTS.md and docs/STATUS.md. Implement the next incomplete task in docs/PLAN.md, keeping the scope in docs/PRODUCT.md. Update STATUS with changed behavior, checks actually run, and the next task. Do not deploy or activate metered services as part of local implementation.

No fresh chat is necessary to understand this project: these files are the handoff. A fresh implementation chat is convenient after research; either chat can continue from the same folder.

## Source layout

```text
src/app/             shared React application shell
src/domain/          types and later domain rules
src/data/            IndexedDB transactions, save queue, recovery downloads
src/editor/          shared Tiptap schema, rich-text editor and toolbar
src/search/          incremental MiniSearch index and Web Worker
src/styles/          canonical theme tokens and shared layout
scripts/            small development checks
docs/               current product and engineering decisions
assets/mascot/      original generated artwork and atlas metadata
```

Add `src/sync/` and `worker/` only when their tasks start. One application, one package, no microservices or monorepo tooling initially.

No project-wide open-source license is selected yet. Do not publish the application under a license without an owner decision. Third-party package and asset notices must be preserved.
