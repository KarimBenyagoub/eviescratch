# Architecture and decisions

## Shape

One React/TypeScript/Vite PWA. Local IndexedDB is the working store; a later Worker API syncs notes/metadata to D1 and private files to R2. No backend, service worker, credentials, or metered subscriptions are configured in the local prototype.

Cloudflare is confirmed as the beta infrastructure choice. The owner confirms a UK LTD with a working Stripe account; subscriptions will use the existing Stripe platform rather than adding a new backend/payment stack. See [GROWTH.md](GROWTH.md) for the proposed trial/checkout funnel, entitlement projection, webhooks and unapproved commercial decisions. Billing is separate from note/file storage and is not implemented yet.

```text
Shared React views ── semantic CSS tokens ── Normal | Pixel Art
        │
Domain operations → IndexedDB (Dexie) → local search index
                         │
                    durable outbox
                         │  later
                 authenticated Worker
                   │            │
            D1 notes/metadata   private R2 files
```

## Boundaries and dependencies

`src/app` owns view composition. `src/domain` owns types and pure rules. Add `src/data` for transactional storage, `src/editor` for Tiptap adapters, `src/sync` for protocol/outbox, and `worker` for backend only when used. Keep browser and server imports separate. No extra state manager until local component state and database subscriptions are insufficient.

Add dependencies by milestone: Dexie for IndexedDB, Tiptap open-source packages for rich text, MiniSearch for search, fflate for archives, maintained sanitization/import helpers, and Better Auth/Hono for cloud if compatibility checks pass. Do not invent editing engines, password cryptography, or XML parsers. Review current licenses and versions when adding; no paid extension/cloud service is assumed.

## Entity contract

See [`../src/domain/model.ts`](../src/domain/model.ts). UUID-style stable IDs, numeric server revisions, ISO timestamps, explicit schema versions, nullable deletion/archive timestamps. A Note has one Journal; a Journal optionally has a Shelf. Preserve stable IDs through rename/move/export/restore. Body is versioned editor JSON, not arbitrary executable HTML; plain text/search indexes are derived. File bytes are separate from note JSON.

T01 derives Note/Journal/Entity types from Zod runtime schemas. Persisted editor JSON is checked against the same ProseMirror schema used by Tiptap. IndexedDB v1 contains Notes/Journals; v2 adds previous-version checkpoints and coalesced pending changes. Migration failures abort and retain the original database. Startup validates the small prototype library before permitting writes; T02 must profile/list metadata separately as libraries grow.

T02 adds v3 Shelves and a default-Journal setting, normalizes missing tags, and validates container relationships. Organization changes and Undo use transactions and revision checks; deleting containers cannot leave orphaned notes. MiniSearch runs in a Web Worker, with changed documents sent incrementally. The small-library startup/load model remains a performance limitation.

The owner-requested environments use distinct names: `eviescratch-demo` (Test) and the original `eviescratch` (Normal). Preference and visual-mode keys are likewise separated. A new development profile defaults to Test; a new production-build profile defaults to Normal. Explicit mode choices persist per browser origin. Mode switching flushes the current Note and refuses to discard a Home quick draft. Demo reset checks both the active Test mode and exact database name, clears only demo keys/database, and reloads to the full introduction. The normal library is never a reset target. Reset-isolation tests are authored but await execution after approval-service recovery.

## Save and sync invariants

1. Local editing must never wait for a network request. Commit note + pending mutation in one local transaction; say Saved only after commit succeeds.
2. Failed writes keep the last committed version and present a copy/export escape route. Reload recovers committed data; do not promise uncommitted keystrokes survive process termination.
3. Server mutations use unique IDs, base revisions, ownership checks, and atomic compare-and-update/change-log handling. Retry is idempotent. Stale responses cannot erase newer pending edits.
4. Pull with server sequence cursors, not client clocks. Conflicts preserve both versions initially; no silent last-write-wins for note bodies.
5. Deletions use tombstones, bounded retention, and a full-resync path for old cursors. Preserve unsynced edits during reconciliation. Test moves/deletes/container deletion, not just body conflicts.
6. Attachments have local/pending/uploading/ready/failed states. Reserve quota → upload → verify → commit ready; clean orphan uploads and expired reservations.
7. Prefer revision conflicts over CRDT infrastructure until collaboration is justified. Mobile background sync is optional; foreground/reconnect retry must work independently.

## Offline and portability

IndexedDB can be removed when browser storage is cleared or under storage pressure. Request persistence after meaningful use; explain local backup. Service-worker activation must not reload an active editor; coordinate schema migration/version updates and multiple tabs.

Export contains versioned manifest, canonical JSON, readable Markdown/HTML, relationships, original attachments, and checksums. An incomplete file download means an explicitly partial export. Restore into a fresh profile must reconcile counts, relationships, and bytes. ENEX migration comes after exact native backup/restore.

## Hosted beta policy — proposed, not activated

- 100,000,000 bytes (100 MB decimal) of live cloud attachments per invited user; 10,000,000 bytes per file. Separate text/history accounting.
- Start with 25–50 invited users, conditional on actual account-wide free capacity. Fifty fully allocated users use 5 GB live files; backup replicas, Trash and temporary files are extra.
- Enforce per-user quotas and a configurable project/account headroom limit server-side with atomic reservations. Public signup stays off until capacity/abuse controls pass.
- D1 Free’s 500 MB per-database limit, daily rows read/written, Worker request/CPU allowances, and R2 operation allowances must all be monitored. Recheck provider terms when activation is proposed.
- R2’s allowance is metered, not a universal hard $0 cap. Strict no-charge operation remains local-only. Do not present a file quota or alert as a guaranteed billing ceiling.
- Keep R2 private; authorized requests or narrow short-lived URLs; validate actual bytes/MIME; no arbitrary HTML inline; avoid public filenames/listings.
- No blob Base64 in D1/KV, no per-keystroke network writes, no server OCR or arbitrary URL fetcher in MVP.

Primary references: [R2 pricing](https://developers.cloudflare.com/r2/pricing/?ref=filebase.com), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/). These are shared account/service constraints, not free allowances multiplied by user count.

## Privacy and operations

No content analytics/AI by default. Never log note text, titles, search terms or filenames. Validate permissions server-side for every note/file. Keep sessions secure and owner-scoped; prevent cross-account local caches. No client secrets. Selected server-side encryption is not full E2EE; resolve the encryption/recovery requirement before finalizing cloud sync.

Before cloud beta: operational restore drill, backup retention and deletion policy, failed-upload cleanup, support contact, incident/rollback procedure, and user-requested export/deletion. No cloud backup exists until created and successfully restored. Paid services and deployment need a concrete plan first; implementation can proceed locally.

## Small decision log

| Date | Decision | Reason / implication |
| --- | --- | --- |
| 2026-11-21 | PWA only, custom small app using established libraries | Fits simple UI and Cloudflare; avoids porting a full server stack |
| 2026-11-21 | One Evie; Normal default and optional Pixel Art | Latest user requirement; supersedes the earlier pixel-only direction |
| 2026-11-21 | Semantic CSS themes on shared components | Same behavior/accessibility; no duplicated app implementation |
| 2026-11-21 | 100 MB invited-beta proposal replaces 50 MB | Reasonable test allowance with global capacity and backup accounting |
| 2026-11-21 | Local vertical slice before hosted sync | Prove capture/recovery/export before accepting cloud complexity |
| 2026-11-21 | Keep Cloudflare for beta; existing UK Stripe account for payments | Confirmed hosting direction and account context; no live billing changes or new infrastructure |
| 2026-11-21 | Explicit onboarding/revenue plan added and commercial model confirmed | Three-day free full-feature trial then paid, no permanent free tier; supersedes earlier seven-day/freemium proposals. Prices now confirmed at US$7.99/week or US$299.88/year; retention and offline grace pending |
| 2026-11-21 | Owner confirmed US$7.99/week or US$299.88/year after three days free | Choose upfront, first payment due at trial end; replaces monthly/annual and undecided-price proposals. Local chooser creates no trial/subscription/charge. |
| 2026-11-21 | Home/full onboarding, visible Evie, complete note menus and isolated Test/Normal modes | Owner explicitly requested a complete usable prototype; keep normal data outside demo reset and keep the app running for handoff. |
| 2026-11-21 | Trial/purchase simulation restricted to isolated Test preferences | Real action labels and countdown can be tested without pretending billing exists. Normal discards demo access and rejects activation; production must use provider-confirmed state. |
| 2026-11-21 | T03 local attachments, storage manager, and fflate ZIP exact backup/restore | 10 MB per-file limit, SHA-256 checksums, Dexie v4 stores (`attachments` and `attachmentData`), visible device/cloud location indicators, storage health monitoring, batch deletion, and full ZIP export/restore into clean profile. |

Update this log only for consequential choices. Resolve conflicting current docs when a decision changes.

T01 implementation (21 November 2026): saves coalesce after a 180 ms typing pause and flush on supported visibility/page-hide events. Note, previous checkpoint, and pending-change record commit together. Local revisions detect stale-tab writes. Pending records are groundwork for later sync, not evidence of any cloud service. The editor uses open-source Tiptap with links/images disabled at this stage; unsupported pasted markup has no schema representation. Draft/raw-recovery downloads preserve canonical/original JSON but have no restore UI yet. Document size is limited to 2 MB in the prototype. Both iOS and Android are initial mobile targets; OS keyboards and selection handles still require physical-device tests.
