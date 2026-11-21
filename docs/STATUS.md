# Current state — read this first

Updated 21 November 2026. **Expanded local prototype implemented, verified and running with T03 Attachments, Storage Management, Exact Backup/Restore, and enhanced Mascot Animations.** T02 organization, T03 local files/storage, and the owner's animation specifications are complete locally; live billing/cloud and physical-phone checks remain future work.

## Mascot Animations Update — 21 November 2026

- **3.5s Mascot Intro Animation (`evie-intro.webp`):** Complete 84-frame @ 24 fps pixel-art splash scene. The Journal fades in smoothly at Evie's paws (untucked from her body, no vertical movement from the bottom). Evie immediately begins scratching the Journal by 0.35s and looks down at the journal throughout all 3 scratch strokes. The notes shelf stays stationary at her side and fades in place without movement. Evie watches the journal glide into the shelf slot, only turning to look warmly at the viewer with a friendly blink once the journal is nestled in the shelf.
- **Sleeping Companion (`evie-sleeping.webp`):** 168-frame @ 24 fps seamless loop (7.0s, 2 breathing cycles). Proportions restored to authentic 1:1 pixel aspect ratio (216 × 216 runtime) with zero height squishing. Natural rhythmic breathing curve (rest → intermediate rise → peak inhale → intermediate lower → rest hold), with a subtle ear twitch on cycle 2 and zero visual seams or tail-cut artifacts. CSS scaling removed in favor of crisp native pixels.
- **Awake Blinking, Tail Flick & Yawn (`evie-yawn.webp`, `evie-tail-twitch.webp`):** 
  - Natural blinking frequency every 2.5–5.0 seconds, with occasional double-blinks.
  - Playful tail flick animation (`evie-tail-twitch.webp`, 20 frames @ 24 fps, ~830 ms) occurring periodically every 8–15s between blinks and yawns with seamless pixel connectivity.
  - Periodic 2.8s yawning animation (`evie-yawn.webp`, 68 frames @ 24 fps) scheduled every 18–32s: fixed cleanup bug to ensure playback reliability, perfectly 1:1 aligned to Evie's alert sitting pose without any body stretching or jump cuts.
- **Source Delivery Masters in `assets/mascot/`:** Exported `evie-intro.webp`, `evie-sleep.webp`, `evie-yawn.webp`, and `evie-tail-twitch.webp` (512 × 512, 24 fps, transparent RGBA) with matching PNG stills for reduced-motion fallbacks.
- **Verification Evidence:** `npm run check`, `npm test` (35/35 passing), and browser suite (3/3 passing) all verified. Production build succeeded; dev server remains live at `http://127.0.0.1:5173/`.

## T03 Attachments, Storage Management, Backup & Restore update — 21 November 2026

- **Local Attachments Implemented:** Stored transactionally in Dexie IndexedDB (`attachments` metadata and `attachmentData` binary stores). 10 MB per-file limit enforced; SHA-256 checksums calculated and verified. Drag-and-drop and file-picker upload support in the editor with image thumbnails and document icons.
- **Location & Space Visibility:** Visible indicators on the attachment feature clearly show storage location ("Location: On this device"), cloud sync state ("Cloud sync: Not connected (local storage)"), and remaining available device storage (`navigator.storage.estimate()`).
- **Storage Management in Settings:** Added a dedicated storage management view in Settings:
  - Storage overview card with device space available, breakdown of notes count/size and attachment count/size, and honest local-only location badges.
  - Complete file browser with search/filter by filename, linked note shortcuts, single-file download and delete.
  - Multi-selection option with "Select all", selected count/size summary, and batch deletion with confirmation.
- **Exact Native Backup & Restore:**
  - Full native backup export (`.zip` via `fflate`) containing `manifest.json`, `notes.json`, `journals.json`, `shelves.json`, `attachments.json`, and all binary files in `files/<id>`.
  - Exact restore into clean profile with pre-restore inspection, checksum verification on every file, and atomic database commit. Corrupted files or tampered checksums abort safely without touching database.
  - Readable Markdown export (`.zip`) with YAML frontmatter, journal grouping, and `index.md` table of contents.
- **Verification Evidence:**
  - Strict typecheck and foundation contrast checks passed (`npm run check`).
  - Vitest suite expanded from 24 to **35 passing tests** across 6 files (`npm test`), including 7 storage tests and 4 backup/restore/markdown tests.
  - Playwright browser suite passed across Android Chromium, iPhone WebKit, and desktop Chromium (**3/3 passed** in `tests/browser/storage.spec.ts`).
  - Production build passed (`dist/` generated cleanly).
  - Dev server remains running at `http://127.0.0.1:5173/`.
- T04 remains next: installable/offline PWA, manifest/service worker, persistence request, and physical-phone hardening.

## Pin feedback update — 21 November 2026

- Active editor Pin now uses solid accent fill, a white filled pin and check mark; note metadata also shows an explicit Pinned badge. The active Unpin action in Note options uses the same strong contrast. Both appearances share the behavior.
- `npm run check` and `npm run build` passed. Existing pin/archive/tag/restore browser checks passed **3/3** in Android Chromium, iPhone WebKit and desktop Chromium. Additional disposable 320 × 780 browser review verified active state, persistence after reload, both appearances, unpin and no page overflow. Inspected actual Normal and Pixel Art screenshots. No physical-phone check; existing startup bundle warning remains.
- Attachments are **not implemented**. T03 remains next: local files plus exact export/restore. Preview remains running at `http://127.0.0.1:5173/`.

## Navigation and Help update — 21 November 2026

- Shared header hamburger replaces the top-right Settings icon on Home, all note views (including the editor), Journals/Shelves and recovery. Settings lives inside that menu. The duplicate notes-pane hamburger was removed. Dialogs have their own top-right menu entry while their modal backdrop makes the app header inert. Splash and onboarding have no app menu.
- Tap/keyboard Help buttons use native popovers, with Escape/outside dismissal and viewport-constrained positioning. Contextual guidance covers quick capture, scoped search, Journals/Shelves, note actions, tags, formatting, local saving, app modes, appearance and restoring Evie. Help inside forms does not submit them.
- Exact owner animation source spec is recorded in `assets/mascot/ASSETS.MD`: 512 × 512 transparent animated WebP at 24 fps plus static PNGs; sleeping loop 6 seconds, single blink 0.25 seconds, intro 1.5 seconds. Existing artwork/animation behavior remains until new assets arrive.
- New focused browser checks: **6/6 passed** across Android Chromium, iPhone WebKit and desktop Chromium. Reviewed Android editor screenshot and additional 320 × 720 Home Help/menu screenshots; narrow layout has no page overflow. Physical phone/screen-reader checks remain outstanding. Latest `npm run check` and `npm run build` passed; **75/75 browser regression checks passed** in a single full run across Android Chromium, iPhone WebKit and desktop Chromium (including the 6 new navigation/Help cases). Reviewed actual Android editor and 320-pixel Home Help/menu screenshots; no page overflow. No physical-phone check was performed. Preview remains running at `http://127.0.0.1:5173/` and was opened in Codex. Shared JS is 271.31 kB gzip, deferred editor 9.86 kB gzip and CSS 10.05 kB gzip. The existing startup bundle advisory remains.
- Preview remains running at `http://127.0.0.1:5173/` and was opened in the Codex browser panel.

## Exists

- Local React/TypeScript/Vite notes app. One shared rich-text editor in Normal and Pixel Art appearance; semantic tokens and preserved editor state.
- Notes, default Inbox, Journals and optional Shelves. Create/rename containers, file through searchable Journal pickers, or choose/create a Journal on a Shelf. Notes never live directly on a Shelf. Deleting a Shelf keeps its Journals; deleting a Journal requires a destination/default replacement and an explicit move/litter-box choice. Transactional Undo checks revisions before restoring anything.
- Title/body/tag search in a MiniSearch worker with incremental updates and visible scope, optional archived results, pins, Archive, and **Litter box** (the former Trash view) with restore. No permanent-delete or empty-litter-box action.
- Home with quick capture, recent notes, pinned notes, direct Journal shortcuts, library counts, search and Home navigation. Quick drafts remain in memory across views and participate in the leave-page warning. A note URL resumes that note after reload.
- Evie sleeps on Home and in the Notes/Journals browsing headers, with only a 0.6% breathing movement over 6.8 seconds. In a visible open note she wakes and blinks once for 240 ms every random 6–14 seconds. Movement pauses in hidden documents and honors reduced motion. Tap-hide and Settings restore remain available. Browsing Evie and notifications now occupy their own layout space, fixing a WebKit case where they covered Journal controls. Artwork is unmirrored; masters are unchanged.
- Press-and-hold, right-click, keyboard context-menu and per-note ellipsis controls on Home/list cards. The same complete options appear from the editor's top-left Note options and top-right ellipsis: Shelf, Journal, litter box, pin, archive, download, and restore when applicable.
- Muted editable text/placeholders, focused primary writing fields, and clear controls that return the caret to the field. Clearing note text supports editor Undo. Async note creation makes the previous editor inert; opening focus checks the active field before moving focus.
- Complete first-run sequence: silent green 1.5-second Evie/Journal scratch-and-tuck intro → welcome → optional first Journal and hierarchy explanation → upfront plan choice → Home. Intro has no visible text/buttons and fades into onboarding; asset preload has a 700 ms deadline to prevent a missing image blocking entry. Onboarding is skippable/replayable from the logo and Settings. Welcome uses the owner's exact “Take notes: Ideas, plans…” copy. Contextual writing/filing/retrieval tips remain optional.
- **Test mode** is the development-preview default (production builds default to Normal unless explicitly selected otherwise) and has a prominent banner. Its database is `eviescratch-demo`; Normal mode retains the existing `eviescratch` database. Preferences/appearance are also separate. Settings switches modes after saving; Home quick drafts must be saved/cleared before switching. Normal mode is a local user library, not a claim of production cloud/billing readiness.
- **Hard reset demo** from the banner, logo menu or Settings opens an explicit confirmation. It checks Test mode and the exact demo database name, removes only demo preferences/appearance/database, and reloads from the intro/onboarding. Unit and all three browser-profile reset-isolation checks passed; Normal notes/preferences survived.
- Dexie v1→v2→v3 migration; Zod-derived entity types and actual ProseMirror document validation. v3 adds Shelves/default-Journal settings and normalizes older notes' tags. Note/checkpoint/pending-change writes are atomic, revisions prevent stale-tab overwrites, and save labels follow commit results. Failed drafts remain available for retry/download; raw recovery never silently clears data.
- Pricing is settled: **3 days free, then US$7.99/week or US$299.88/year**, selected upfront, first payment due at trial end and recurring at that interval. **Start Free Trial** and alternate **Buy Now** appear in onboarding and Plans. Buy Now skips the trial, discloses the immediate amount and recurring cadence. Test simulates trial/purchase in isolated preferences; Normal rejects activation until secure checkout exists and ignores any demo access copied into its preferences. Header/contextual offers have a parenthesized status line below: remaining days for an active Test trial, not-started status otherwise, selected-plan status after a simulated purchase. No provider trial, checkout, subscription or payment exists.
- Existing preview stays at `http://127.0.0.1:5173/`. Owner explicitly wants the app left running and opened in Codex, not handed run instructions.

## Not implemented / limits

Attachments, complete native export/restore, installable/offline-reopening PWA, accounts/auth, hosted sync, live Stripe billing/entitlement enforcement, ENEX migration and operational backups remain future work. No cloud service was activated or deployment performed.

Browser data can be removed. Editing works offline after loading the editor; reload still needs the server. The prototype validates/loads the full small library on startup and has a 2 MB serialized document limit; no large-library/phone-performance claim. Draft/recovery JSON is not a tested exact-restore archive. Uncommitted keystrokes are not guaranteed to survive a killed process. Test mode unlocks available local features, not unimplemented cloud features.

## Actual verification

- Latest `npm run check` and `npm run build` passed. Strict app/test/config types, selected contrast pairs and internal documentation links passed. Shared initial JS 270.44 kB gzip, deferred editor 9.55 kB gzip; CSS 9.90 kB gzip; search worker 18.99 kB uncompressed. New intro poses plus sleeping image total 71,686 bytes; awake strip adds 45,870 bytes on note opening. Initial JS exceeds the 250 kB target, and all new mascot derivatives together exceed the 100 KB total target. Vite emits a large-chunk advisory. No measured device-performance claim.
- Additional static placeholder-opacity checks passed on both canvas/surface backgrounds in both themes (composited contrast approximately 4.87–5.10:1). This is still not a full accessibility audit.
- `npm test`: **24/24 passed**, covering persistence/migrations, save queues, organization/search/Undo, demo reset isolation, exact three-day simulation, countdown boundaries, malformed access and Normal ignoring simulated access.
- Latest full browser run: **66/69 passed**. It verified the corrected WebKit Journal-control layout, immediate new-note input/reload, all reset-isolation profiles, full onboarding, trial/purchase simulation, Normal checkout guards, offline-after-load editing, failure/recovery, stale-tab conflict, clear/Undo, note menus and responsive layout. The remaining failures were fixtures: a welcome heading selector matched the contextual guide, reload raced the asynchronous onboarding completion, and WebKit's root-paragraph selection included trailing block breaks. Corrected those fixtures and ran the affected onboarding-dismissal/settings/selection scenarios in Android Chromium, iPhone WebKit and desktop Chromium: **9/9 passed**. All 69 distinct scenarios now have passing evidence across the full and targeted runs; this was not a single clean 69/69 full run.
- The earlier approval-review usage limit cleared; authorized automated runs executed normally. It no longer blocks verification. Earlier failures and blocked runs are superseded by the actual results above.
- Manual in-app browser review verified logo→welcome→Journal→plan choice→Home; both displayed prices; focused/clearable setup fields; Home quick capture; separate Normal/Test libraries (the normal Inbox remained separate from demo Journals); Evie tap-hide and Settings restore; press-and-hold options; Shelf/Journal creation+filing; litter-box restore; clearing text and Undo; rapid new-note input; note title/body after reload. Phone layout inspected at 390×844 as a desktop-browser viewport. Reviewed screenshot: ignored `.local-qa/screenshots/home-test-mode-mobile.jpg`.
- Latest manual review also confirmed the silent green intro, requested welcome copy, visible trial days under both offers, Test Buy Now result/persistence, Normal rejecting activation, and sleeping/awake Evie on a narrow viewport. Demo reset runs used disposable automated browser contexts, leaving the owner's preview libraries intact. No physical iOS/Android, OS keyboard/selection-handle, full accessibility, installed-PWA or remote CI validation was performed.

## Next

T03 adds attachments and exact backup/restore; T04 adds install/offline reopening and physical-phone hardening. Reduce the shared startup bundle and mascot total toward their budgets. Live Stripe checkout/provider entitlements remain a later commercial gate. Keep the running preview usable throughout.

## Settled / pending decisions

Settled: mobile-first PWA; equal iOS/Android priority; one Evie; Normal/Pixel Art appearance; Notes → Journals → optional Shelves; local-first; Cloudflare for future beta; existing UK LTD/Stripe account; 3 days free then US$7.99/week or US$299.88/year, chosen upfront; no permanent free tier. Test/Normal environments are separate from appearance modes.

Before cloud/live billing: encryption/recovery requirement, accepted metering exposure, actual shared capacity, backup destination, identity-provider/recovery details, launch countries/tax display, retention and offline entitlement grace. Proposed beta attachments remain 100 MB/user with 10 MB/file, not an active allowance. Never publish or activate metered services merely because the local prototype works.
