# Delivery plan

One active task at a time. Check boxes only after the stated evidence exists. Current state and latest results live in [STATUS.md](STATUS.md). No calendar estimates are commitments.

## T00 — project preparation

- [x] Create a small current documentation map and assistant handoff.
- [x] Research and specify Normal/Pixel Art modes with shared tokens and screen contracts.
- [x] Add runnable React/TypeScript/Vite foundation with theme preference preview.
- [x] Verify dependency installation, typecheck, theme contrast/docs links, and production build; record actual results in STATUS.

## T01 — first local vertical slice (complete)

Add Dexie, runtime schemas/migrations and a minimal editor. Start with one default Inbox Journal. Create/edit a Note, transactionally persist it, reopen after reload/network loss, and display accurate local saving/error states. Build the same Note view in both themes through shared components. No cloud, fake Sync button, attachment subsystem, or elaborate Journal tree yet.

Acceptance: create and edit offline after initial load; committed text survives reload; an injected write failure cannot show Saved; keyboard focus and selection survive theme changes; corrupt database/migration failures produce an actionable recovery path. Automated persistence/browser tests are required. Preserve scope if rich-editor integration reveals a blocker; document it instead of substituting an unsupported custom editor.

- [x] Inbox, Tiptap editor, validated IndexedDB transactions/migration, accurate save/failure/recovery UI, and shared responsive themes. Evidence: 10 unit tests and 27 Chromium/WebKit browser scenarios; limits and real-device gaps recorded in STATUS.

## T02 — organization and retrieval (locally implemented and verified)

Journals/Shelves, move picker, flat tags, title/body/tag search, pin, archive, Trash/Undo. Enforce organization/deletion rules in PRODUCT. Add phone list/editor navigation and desktop panes. Keep index work off the typing path.

Acceptance: the first four primary tasks work with long titles/Unicode; search has explicit scope; moves preserve IDs/content; deleting a Shelf never deletes Journals; Journal deletion cannot orphan Notes; tests cover search updates and move/delete semantics.

- [x] Implement Journals/Shelves, searchable filing, worker search/tags, pin/archive/litter box, revision-safe container deletion and Undo. Earlier organization/persistence unit suite passed; current sources/build typecheck.
- [x] Updated browser verification after async new-note/focus and mascot-layout fixes: latest full run 66/69, followed by 9/9 affected scenarios after correcting test fixtures. All 69 distinct scenarios have passing evidence; exact run details and physical-phone limits are in STATUS.

### Owner-requested prototype experience

- [x] Home with quick capture, recent/pinned notes, Journal shortcuts and Home navigation.
- [x] Visible Evie companion with tap-hide and Settings restore, slight movement and reduced-motion handling.
- [x] Hold/right-click note options and complete shared menus at both editor corners; Shelf moves resolve to a Journal on that Shelf; litter-box restore preserves notes.
- [x] Editable-field cues, clear controls and primary-field focus; full logo/welcome/organization/upfront-plan onboarding.
- [x] Separate Test and Normal libraries/preferences; visible Test banner; demo-only hard reset entry points and confirmation.
- [x] Onboarding/mode/reset isolation verified in 24 passing unit cases and Android Chromium/iPhone WebKit/desktop Chromium scenarios. Test trial/purchase simulations, parenthesized countdown, silent green intro and sleeping/awake Evie are included. Live billing remains pending.

## T03 — files, backup, and exact restore (complete locally and verified)

Local attachments, original bytes/checksums, file status, storage health, native archive export/restore, readable Markdown/HTML exports. Stream/chunk large operations; make partial exports explicit.

Acceptance: fresh-profile restore matches canonical content, relationships and file hashes; duplicate titles and filenames remain distinct; interrupted/corrupt imports do not overwrite the current library; local quota failure is recoverable. The complete initial vertical-slice goal is achieved at this stage.

- [x] Local attachments in IndexedDB (`attachments` and `attachmentData`), 10 MB per-file limit, SHA-256 checksums, drag-and-drop & file picker in editor.
- [x] Visible storage indicators: location badge ("Location: On this device"), cloud sync status ("Cloud sync: Not connected"), and remaining device space visible when using attachments.
- [x] Storage management in Settings: health & quota overview, complete file browser with search/filter, multi-selection with "Select all", selected count/size summary, and batch deletion with confirmation.
- [x] Exact native full backup (`.zip` via fflate) with manifest, canonical JSON, and binary attachments. Exact restore into clean profile with checksum verification and atomic commit. Readable Markdown archive export (`.zip`) with YAML frontmatter and index table of contents.
- [x] Verified in 11 new unit tests (35/35 passing total) and browser scenarios across Android Chromium, iPhone WebKit, and desktop Chromium (3/3 passing).

## T04 — installable/offline PWA and polish

Add manifest/icons, controlled service worker and update flow, persistence request, safe schema upgrades/multiple-tab behavior, accessibility/device testing, optimized Evie derivatives and optional animation. Implement the one-time Pixel Art nudge only after a real first save.

Implement the relevant first-use/install steps from [GROWTH.md](GROWTH.md): preserve first drafts, no forced installation, browser-appropriate instructions, no stacked permission/theme prompts. Build the commercial landing/sample/offer flow alongside the billing milestone, not a fake working checkout in the local alpha.

Acceptance: installed app opens offline after initial load; update does not force active editor reload; focus/selection survive resizing/theme change; real iOS/Android checks; dismissal/reduced-motion behavior works. No claim of permanent browser storage or native-client capabilities.

## T05 — hosted-sync risk spike and owner decisions

Resolve E2EE requirement, account/provider requirements, zero-budget versus R2 metering exposure, backup destination, actual shared Cloudflare usage and invited-user count. Benchmark Worker auth/D1 paths and produce tested protocol/quota contracts. Credentials and subscriptions are not created by the local milestones.

Cloudflare is confirmed for beta, and the owner confirms an existing UK LTD/Stripe account. The offer is confirmed at three days free, full-featured, then US$7.99/week or US$299.88/year, chosen upfront, first payment due immediately after trial end; no permanent free tier. Before launch, settle initial customer markets/tax treatment, cloud retention and offline entitlement grace. Validate supported Stripe Checkout/Billing/portal/reminder behavior in test mode; see [GROWTH.md](GROWTH.md).

Acceptance: concrete cost/capacity and recovery plan, reviewed auth isolation and compare-and-update behavior; no assumption that a provider’s free allowance is per user or a hard billing cap.

## T06 — private cloud beta

Authenticated Worker/D1/private R2, outbox/cursors/idempotency, server checkpoints, conflict copies, tombstones/old-cursor resync, upload reservations, account deletion, capacity metrics, backups/restore and operator runbook.

Acceptance: two-device edit/move/delete races, stale acknowledgments, duplicate retries, session expiry, unauthorized file access and simultaneous uploads pass; no silent loss; local editing continues during provider/quota outage; operational restore passes. Start invited testing only after these gates.

### T06-B — commercial onboarding and Stripe billing gate

After T05 commercial decisions, implement transparent landing/demo/account/interval selection, server-created hosted Checkout, verified and idempotent webhooks, D1 entitlement projection/reconciliation, customer portal, confirmation/reminder/receipt delivery, and failed-payment handling. Start the trial from provider-confirmed creation; do not infer a successful paid charge from a return URL, zero-value trial invoice or device clock. Add the optional installation prompt after real value, with no repeated nagging.

Acceptance: test-mode trial creation/end, cancel-before-charge, paid conversion, action-required/failed payment, duplicate/reordered/missed webhooks, refunds, portal ownership and offline/expiry recovery. All approved terms appear before consent. No lost drafts or blocked export. Verify the small privacy-conscious funnel and retained-net-revenue measurements in GROWTH. No live billing rollout merely because test checkout works; full advertised functionality and recovery gates must pass first.

Onboarding acceptance: the confirmed three-day trial is the hands-on demo. Return from checkout directly to an editable Inbox note; target first writing within five seconds on the reference phone/network, with truthful commit confirmation. Test skippable contextual filing/retrieval hints, interrupted checkout/draft recovery, resuming users, no stacked installation/theme prompts, and accessible billing/expiry states. Observe real first-time users before claiming low-friction onboarding. Do not add a separate demo subsystem or mandatory setup tour.

## T07 — migration and launch evaluation

Evaluate Yarle/native ENEX conversion; preview supported/unsupported content and counts; preserve originals; resumable import; consented sample libraries; formative user tests. Review bugs, real performance, cloud capacity, privacy text and support readiness before public launch. Advanced features remain separate proposals.

## Definition of done for every task

Behavior works, meaningful checks pass, limitations are recorded, current docs agree, and STATUS names the next task. A mock screen, generated code, or passing typecheck alone is not proof of data safety or a completed app.
