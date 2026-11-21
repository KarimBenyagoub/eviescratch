# EvieScratch — research, product brief, and building plan

> **Current implementation entry point:** [README.md](README.md), [current status](docs/STATUS.md), and [product contract](docs/PRODUCT.md). This long document preserves the original research. Later decisions supersede older proposals: **Normal is the default visual mode, Pixel Art is an optional alternative, and the proposed invited-beta attachment allowance is 100 MB/user**. The earlier 50 MB capacity example below is historical, not the current policy. See [design](docs/DESIGN.md) and [architecture](docs/ARCHITECTURE.md) for current implementation guidance.

> **Commercial update:** Cloudflare is confirmed for beta infrastructure, and the owner has a UK LTD with an existing Stripe account. **Confirmed: three-day free full-feature trial, then US$7.99/week or US$299.88/year, selected upfront, first payment due at trial end; no permanent free tier.** The trial is the hands-on demo. Retention, markets/tax treatment and offline grace remain pending. Older seven-day/free-local-forever/freemium proposals are superseded. Read [PWA onboarding and monetization](docs/GROWTH.md) for the current flow, billing requirements and pending decisions.

**Research checked:** 21 November 2026, Africa/Lagos.  
**Status:** original research plus initial Evie assets; a local two-theme development foundation and current planning files now exist. The notes application, installable/offline behavior and cloud services are not implemented; no deployment, purchase, or assignment to Gemini has been made.  
**Working name:** EvieScratch, named for Emily’s female cat, Evie. Renamed from EverScratch on 21 November 2026. Check naming and trademark availability before public launch.  
**Product promise:** “Your notes, neatly tucked away. A little cat company.”

## 1. Recommended direction

Build a personal notes app with Evernote’s useful organizational structure, a much calmer default interface, fast local editing, dependable optional sync, and **one mascot: Evie, Emily’s female calico cat**. Use **Notes → Journals → Shelves** as the proposed vocabulary: a Journal replaces a notebook; a Shelf replaces a notebook stack. Keep “Notes” familiar. Shelves are optional, and Journals do not require dated entries.

The recommended first platform is an installable **web app/PWA**, usable on desktop and mobile. Begin with a complete local version, then a small private cloud beta. This is the fastest route to a useful product using free software and Cloudflare’s free allowances. Native distribution, full Evernote parity, AI, and collaboration would substantially enlarge the project.

Use **a readable, contemporary writing interface with small, funny pixel-art appearances of Evie**. Pixel art is the user’s chosen mascot direction; usability testing should refine its size, motion, and placement. The relevant successful app in AppsRank is **Cat on Chair**. Its evidence supports distinctive illustration and emotional warmth; it does not prove that a full pixel-art interface improves note taking.

The strongest differentiation is the combination of simple organization, low friction, visible saving, easy departure/export, and personality. A mascot cannot compensate for losing a note.

### Emily’s requirements versus our proposals

| Requirement or idea | Origin | Treatment |
| --- | --- | --- |
| Evernote feels too busy | Emily, quoted by the user | Default to writing and retrieval; advanced controls appear when needed |
| Retain notes, notebooks, and notebook stacks | Emily | Preserve the same three levels; do not replace them with a graph or databases |
| Call notebooks “Journals” | Emily’s suggestion | Adopt provisionally; test whether it incorrectly suggests diary-only use |
| One cat: Evie, Emily’s female cat | User’s correction with reference photographs | Evie is the only mascot; preserve her recognizable markings; subtle by default and hideable |
| Funny pixel art | User’s chosen asset direction | Create her main mascot and pixel-art sprite sheet; test legibility and motion in the UI |
| Maximum simplicity and performance | User | Explicit interaction and performance budgets below |
| Free resources, including cloud file hosting | User | Free local mode; capped cloud beta with honest provider constraints |
| Shelves, Inbox, PWA, technical stack | This brief’s recommendations | Proposed implementation decisions, not quotations from Emily |

## 2. Research method and limits

This is a qualitative research synthesis, not an exhaustive bug census or a representative survey. Sources include current Evernote documentation and product updates, user discussions, the official feature-request forum, competing products’ own documentation, Cloudflare documentation, library repositories, and local AppsRank material.

Use these evidence labels throughout:

- **Documented:** described by the product/provider itself. Establishes availability or policy, not independent proof of quality.
- **Reported:** users describe a problem or preference. Useful for finding failure cases; does not establish how often all users experience it.
- **Historical request:** demonstrates interest, but may already be implemented, partially addressed, or obsolete.
- **Proposed:** our design or engineering response. Must be tested.

Public complaints overrepresent people with problems; successful users also appear in the same discussions. No original interviews, controlled usability study, signed-in Evernote benchmark, or app-store review scrape was performed. Emily’s Instagram was not accessed; her requirements come only from the supplied quotes. No numerical prevalence, retention lift, or performance comparison is claimed.

Some discussion pages show inconsistent relative timestamps compared with search indexing. Treat them as identified user reports retrieved on the research date, rather than relying on relative “days ago” labels. Provider terms and libraries should be checked again when implementation starts.

Figma research used public creator/product descriptions and linked resources. The editable Community files could not be inspected through the research browser because Figma blocked retrieval. The shortlist is a reasoned fit assessment, not a verified ranking of every template or a completed Figma audit.

## 3. What Evernote does well and should survive

The current product is more capable than the “old, abandoned app” narrative suggests. Evernote v11 launched in January 2026; subsequent recaps describe ongoing editor, search, organization, mobile, and media improvements. That makes a selective product with a clear audience more plausible than attempting to beat every feature. [Evernote v11](https://evernote.com/en-us/blog/introducing-v11), [Q3 2026 recap](https://evernote.com/en-us/blog/everyday-evernote-q3-2026).

| Strength | What to retain | Scope consequence |
| --- | --- | --- |
| Familiar note organization | A clear place for every note, with optional grouping and tags | Journal/Shelf hierarchy stays shallow |
| Mixed-content capture | Text, lists, links, images, and documents in a note | Text first; attachments follow with explicit storage behavior |
| Retrieval | Search and filters, with visible matches | Search is a first-class workflow, not an AI chat substitute |
| Web capture | Save useful material with its source | Basic paste/link capture first; an article clipper later |
| Cross-device access | Continue writing across devices | Must handle offline edits and conflicts before public launch |
| Interconnected notes | Stable links and navigation back to related notes | Internal links and backlinks are useful, optional detail |
| Customization | Hide unnecessary navigation and select useful defaults | Ship a calm default instead of requiring cleanup |

Evernote already offers advanced search, a Web Clipper, and configurable navigation. Those are strengths to learn from, not features to describe as missing. [Search documentation](https://help.evernote.com/hc/en-us/articles/208313828-Use-advanced-search-syntax), [Clipper](https://evernote.com/en-us/web-clipper/clip-web-page-to-evernote), [sidebar overview](https://help.evernote.com/hc/en-us/articles/221189627-Sidebar-and-Navbar-Overview).

## 4. Current limits and the trust problem

On the research date, Evernote’s comparison page lists Free at **50 notes, one notebook, and one connected device**; Starter at **1,000 notes, 20 notebooks, and three devices**. Availability and pricing can vary; this brief deliberately does not present one subscription price as universal. [Current plan comparison](https://evernote.com/en-us/compare-plans).

Evernote says downgrading does not remove existing notes, but creation and device limits can constrain ongoing use. Therefore, “Evernote deletes your notes when you stop paying” would be an inaccurate criticism. [Downgrade explanation](https://help.evernote.com/hc/en-us/articles/33872737333907-Will-I-lose-my-notes-if-I-cancel-my-subscription-and-my-account-is-downgraded-to-Free).

**EvieScratch policy proposal:** keep local editing, local search, and exports free. Publish cloud quotas clearly before sign-up. If cloud capacity runs out, keep local writing working and explain exactly what has not synced. Do not disguise the free product as a temporary trial. Do not promise unlimited hosted storage or free hosting forever.

## 5. Issue map: what to avoid and how

The priorities below reflect impact on Emily’s use case and data trust, not a measured ranking of complaint frequency.

| Issue / evidence status | Research signal | EvieScratch response | Acceptance evidence |
| --- | --- | --- | --- |
| Busy navigation and feature overload — reported | Emily; users say added features exceed their needs [U4] | One New Note button, modest navigation, contextual formatting, no dashboard required | New users create and find notes without setup help |
| Slow opening and scrolling — reported | Notes/list loading and scrolling complaints [U1] | Read locally first; paginate lists; load one editor and note body at a time | Meet the performance budgets in section 13 |
| Offline notes unavailable or slow — reported | Offline access complaints [U1, U5] | Text is available locally after initial download; explicit attachment download status | Flight-mode open, edit, search, restart, and reconnect tests pass |
| Sync uncertainty — reported, with positive counterexamples | Mixed experiences; some users report excellent stability [U2] | Separate local save from server acknowledgment; retryable outbox; conflict preservation | No silent overwrite in two-device tests |
| Search misses or unclear scope — reported | Search reliability and offline search complaints [U1, U5] | Title/body/tag search locally; clear Journal filter; explain unindexed files | A fixed query set finds expected results offline |
| Price and limit frustration — reported/documented | Complaints about value and bundled complexity [U4]; actual limits above | Explicit quotas, no forced annual plan, optional cloud | Quota boundary never blocks local writing/export |
| Export/backup friction — documented, sometimes overstated by users | Desktop-only export; notebook export exists [E1] | Whole-library portable export in the web app | Restore into a fresh profile preserves data |
| Formatting and copy/paste friction — reported | Mobile copy/paste feedback [U6] | Short formatting menu; paste clean text option; preserve normal rich text | Test real mobile keyboards, selections, lists, and IME |
| Inconsistent platform behavior — reported | Users describe different failures on phone versus computer [U4] | Shared core with deliberate responsive behavior; test each browser | Same content round-trips across the supported matrix |
| Support/account-deletion frustration — reported | Ticket and deletion complaints; an official response acknowledges the report [U3] | Self-service export/deletion; minimal diagnostic report with consent | Deletion completes and backup-retention policy is visible |
| Privacy expectations exceed actual protection — documented distinction | Server encryption differs from complete end-to-end encryption [E2] | Honest v1 privacy explanation; no content analytics or AI by default | Security review confirms claims match implementation |
| Organization too shallow for some — historical/current interest | Nested notebook requests [F1, F2] | Preserve Emily’s shallow model initially; evaluate deeper nesting separately | Users organize sample material without inventing workarounds |
| Archive, pinning, and display controls desired — historical requests | Feature forum [F1] | Pin and archive in simple menus; list view default | Archive remains searchable; selected thumbnail optional later |
| Accidental deletion or editing — historical request/risk | Read-only interest [F1] | Undo, Trash, revision recovery; optional read-only toggle later | Restore tests and delete/edit conflict tests pass |
| Migration loses meaning or files — documented conversion limits | ENEX conversion can change styling and recognition data [C3] | Preview, counts, warnings, originals retained, checksums | Import report reconciles notes and every resource |

### User-report sources and interpretation

- **[U1] [What is going on with Evernote?](https://www.reddit.com/r/Evernote/comments/1sxwv6a/what_is_going_on_with_evernote/)** — opening/offline/search/list/bulk-operation complaints. Another participant reports no comparable Mac problems. The claim that export does not exist is contradicted by official export documentation; the valid insight is discoverability and backup friction.
- **[U2] [How are things going with Evernote these days?](https://www.reddit.com/r/Evernote/comments/1uopayd/how_are_things_going_with_evernote_these_days/)** — mixed experiences, including strong praise for sync and improvements. Prevents treating every historical bug as universal.
- **[U3] [Evernote support has become a disaster](https://www.reddit.com/r/Evernote/comments/1w5na6q/evernote_support_has_become_a_disaster/)** — account-deletion and support concerns. An official reply offers follow-up; this is a service-design signal, not proof that deletion fails for everyone.
- **[U4] [Bending Spoons user-experience discussion](https://www.reddit.com/r/Evernote/comments/1xck16w/bending_spoons_evernote_parent_company_user/)** — value, complexity, platform consistency, and positive reports. Comments are opinions, not independent billing records.
- **[U5] [Android experience discussion](https://www.reddit.com/r/Evernote/comments/1lhdca5/the_android_app_is_so_bad_i_wanna_cry/)** — mobile navigation, offline search, and sync complaints. Older evidence; use as regression scenarios rather than a current defect inventory.
- **[U6] [Evernote team’s 115+ improvements discussion](https://www.reddit.com/r/Evernote/comments/1v3qjax/an_update_from_the_evernote_team_on_115/)** — users welcome editor improvements while requesting better search and mobile copy/paste.

## 6. What users wish Evernote had

Evernote’s feature forum shows long-running interest in Markdown, password-protected notebooks, deeper nesting, thumbnail control, archiving, read-only notes, recurring reminders, table calculations, Linux support, and task organization. Votes are self-selected historical interest, not market-size estimates or proof that a feature remains absent. [F1: official request index](https://discussion.evernote.com/forums/forum/304-general-feature-requests/).

| Wish / underlying job | Current-status qualification | Our decision |
| --- | --- | --- |
| Write and move notes using Markdown | Markdown shortcuts, native Markdown storage, and import/export are different capabilities; do not conflate them | Basic shortcuts plus .md import/export; structured JSON remains lossless canonical data |
| Password-protected Journals / full privacy | A UI lock is not cryptographic protection; Evernote supports selected-text encryption, not a claim of whole-library E2EE | Investigate true encrypted sync separately; no misleading “private vault” label in v1 |
| Deeper nested notebooks | Long-running request; recent users still discuss the limitation [F2] | Do not add to MVP; test against Emily’s simpler hierarchy |
| Choose list thumbnails and colors | Historical visual-control request | Text list first; optional cover/thumbnail choice later |
| Archive old material | Historical request; deletion and archive serve different jobs | Include simple Archive; archived notes appear only when requested or scope includes them |
| Pin important notes | Historical request may already be addressed | Include because it is useful, not as an exclusive invention |
| Better internal links, backlinks, headings, contents | Backlinks already shipped in 2023; newer updates cover more navigation/editor capabilities [E3, E4] | Stable note links early; backlinks/contents as progressive detail |
| Tables, equations, code highlighting, recurring tasks, calendar links | Different specialist workflows; several have existing or newer Evernote support | Basic tables after core; postpone calculations, task platform, and calendar integrations |
| Linux/cross-platform access | Browser access and native Linux are different promises | PWA supports modern Linux browsers; do not advertise a native Linux client |
| Reliable local access, easy backup, predictable value | Repeated user jobs across the discussions above | Core differentiators and release gates |

**Avoid outdated positioning:** do not advertise “Evernote has no backlinks,” “no export,” “no customizable sidebar,” or “no tabs.” Backlinks and customization are documented; the 2026 official recap also describes tabs, table of contents, and editor changes. [E3: backlinks](https://evernote.com/blog/introducing-backlinks), [E4: official 2026 recap video](https://www.youtube.com/watch?v=MrDkQYTy510).

**[F2] [Recent nested-folder discussion](https://www.reddit.com/r/Evernote/comments/1xn44xq/lack_of_nested_folders_on_evernote/)** illustrates disagreement: some want hierarchy; others value the constrained model. This is a design tradeoff, not a mandate to add unlimited nesting.

## 7. Cat on Chair: the AppsRank reference

### Identification and provenance

Confirmed directly in the local **Claude_AppsRank.xlsx**, first worksheet, row 25: **D25 = Cat on Chair**, **A25 = rank 21**, **B25 = score 7.3**, **G25 = reference 25**. Those scores are the workbook’s own assessment, not an independent store ranking.

Supporting local sources:

- `../Claude_AppsRank.xlsx` — source workbook, inspected read-only.
- `../scripts_claude/_appsrank_mobile.json` — matching generated AppsRank entry.
- `../Summaries/25_Summary_Gemini_This Simple App Makes $18K／Month_249.06K views_07-26-2026.txt` — timestamped case summary.
- `../Transcripts_starterstory/25_This Simple App Makes $18K／Month_249.06K views_07-26-2026.txt` — source transcript.

The local case reports approximately **127,000 downloads**, almost **$80,000 over 8–9 months**, and over **$18,000 in a trailing 30-day period measured from April 13**. These are founder/interview claims from that snapshot, not independently audited current revenue, profit, or recurring subscription revenue. Its interview publication date must not be confused with the revenue measurement date.

The official [Cat on Chair site](https://catonchair.app/en/) confirms the cozy focus-companion positioning. [Founder Ryan Yao’s account](https://www.linkedin.com/posts/ryanqyao_got-featured-on-starter-story-this-week-activity-7487515814334509057-97Vy) provides a separate, later self-reported milestone. Different snapshots should not be merged into one number.

### Lessons worth borrowing

The local case describes a standard timer made distinctive through a cat, handmade illustrations, furniture customization, and small rewards. Organic recommendation posts helped distribution. It also describes early bugs, including failed device sync, despite beta testing. A simple utility can still contain difficult engineering.

For EvieScratch, borrow the **principle of comforting company**, not the character artwork, furniture, layout, sounds, or brand. Proposed interactions:

- Evie dozes beside the Journal list or on an empty-state shelf.
- On a user-initiated tap, it stretches or bats at a pencil. Sound starts off.
- A lightweight visual acknowledgment may accompany a completed local save, but the authoritative save status is always text and an icon.
- There are no alternate cats or selectable coats: Evie’s identity and real markings remain fixed.
- Future visual variety comes from Evie’s expressions and poses, not collectible animals, paid skins, or a pet-care economy.
- No punishment, sad abandoned pet, lost streak, guilt notification, or essential action behind pet care.

**Pixel-art verdict:** use the requested pixel-art Evie. Evidence supports a memorable cat utility and also an animal-branded writing app such as Bear; it does not establish that pixel art outperforms illustrated art. [Bear’s official site](https://bear.app/) reports its Apple Design Award and emphasizes a minimal writing interface. Test Evie’s scale and animation with identical writing tasks; keep her optional without changing the app’s mascot identity.

### Evie’s identity and supplied references

Evie is a short-haired calico/tortoiseshell-and-white cat with a dark face and central nose bridge, golden-green eyes, a broad orange patch on her anatomical right cheek (viewer-left when facing her), a smaller orange blaze above her anatomical left eye (viewer-right), white chin/bib, mottled black-and-ginger body, and white mittens/socks. Her anatomical right foreleg is largely ginger; the other is darker. Do not mirror her sprites to create opposite-facing poses: mirroring swaps these identifying markings.

The user supplied ten photographs on 21 November 2026. The clear calico face/full-body photographs are the primary identity references. The close-up sleeping photograph shows a predominantly black-and-white appearance and is not used to override the clearly visible calico markings in the other references. Reference photos remain in their original screenshot directory; generated app assets belong in `assets/mascot/`.

The main mascot and sprite sheet are app-specific image assets, not a ChatGPT Work pet. Only the sprite frames needed for a UI moment should be loaded or animated. See `assets/mascot/ASSETS.MD` for the generated files, layout, prompts, and integration notes.

## 8. Design inspiration and visual brief

### Best-fit Figma shortlist, with honest availability

“Best” here means fit to this project’s needs: clarity, responsive components, accessibility, implementation effort, and free availability. It is not a popularity leaderboard. All three are inspiration resources; no paid kit is required.

| Resource | Evidence/access | What to borrow | What to avoid |
| --- | --- | --- | --- |
| **Makarya Notes — free Community version** | [Creator’s public description and free link](https://dribbble.com/shots/19104031-Home-Screen-Makarya-Notes-Free-UI-Kit-Design-System), [Figma file](https://www.figma.com/community/file/1090245813253623841) | Note-specific screens, resizable component thinking, consistent flows | Its advanced-app scope and every dashboard feature; the free subset is not the complete paid kit |
| **Google Material 3 Design Kit** | [Official Material site](https://m3.material.io/) links the kit | Mobile navigation, states, type/spacing tokens, accessible control patterns | Oversized expressive decoration or copying Android styling everywhere |
| **Material UI Community Figma kit** | [Official resource page](https://mui.com/material-ui/design-resources/material-ui-for-figma/) distinguishes free Community and full paid versions | Forms, dialogs, empty/error states, consistent component variants | Adding the entire MUI runtime merely to match a mockup; premium assets are outside the free plan |

Implementation reference: [shadcn/ui’s Figma documentation](https://ui.shadcn.com/docs/figma) identifies its files as community contributions. A paid shadcn-compatible Figma product is not automatically free because shadcn/ui code is free. Prefer a small set of accessible primitives and project-specific tokens; verify each asset’s license before copying.

The [Makarya creator site](https://makarya.framer.website/) advertises a large full kit. Its “99+ screens” claim should not be assigned to the free subset without checking the actual file. Before design implementation, duplicate the available free files, inspect components and rights, and discard anything that increases navigation complexity.

### Adjacent products: useful benchmarks, not templates to clone

- **Bear:** restrained writing surface and mascot branding. Take the editorial calm and progressive disclosure, not Apple-only assumptions. [Official site](https://bear.app/).
- **UpNote:** nested organization, offline use, focus mode, backups, and portable export are advertised together. This demonstrates a clear competing feature bundle, not measured superiority. Take the simplicity and focus mode. [Official site](https://getupnote.com/).
- **Joplin:** useful reference for honest migration limitations and export completeness. [Import/export documentation](https://joplinapp.org/help/apps/import_export/).
- **Obsidian:** local Markdown files demonstrate strong ownership and portability. EvieScratch can borrow the ownership principle while shielding Emily from filesystem/plugin administration. [Storage documentation](https://help.obsidian.md/Files+and+folders/How+Obsidian+stores+data).

### Visual system proposal

- **Mood:** a cozy stationery desk, a mildly mischievous Evie, generous breathing room.
- **Balance:** approximately 90% quiet functional UI, 10% personality. This is an art-direction heuristic, not a measured optimum.
- **Type:** system sans-serif initially for speed and legibility; comfortable 16–18 px note text, around 1.5 line height, adjustable. Pixel lettering only for optional tiny decorative headings, never note bodies or essential labels.
- **Palette:** warm paper `#FAF7F0`, dark ink `#242424`, sage accent `#55745E`, muted peach decoration `#EBC4AB`. Validate actual foreground/background pairings; these are starting tokens, not a pre-certified palette.
- **Layout:** neutral surfaces, one accent color for actions, restrained borders, minimal shadow. Avoid a green Evernote imitation.
- **Cat assets:** the supplied-photo-based Evie mascot and sprite sheet. Preserve her asymmetric calico markings. Use nearest-neighbor/integer display scaling where practical; test the actual generated image dimensions before choosing production logical-pixel sizes. No alternate cats or full-screen animated world.
- **Motion:** brief, transform/opacity-based, idle pauses, suspended off-screen/background; respect reduced motion. No animation during sustained typing by default.
- **Dark mode:** warm charcoal surfaces; adjust contrast rather than simply inverting every color.
- **Accessibility:** target WCAG 2.2 AA, keyboard access, visible focus, semantic labels, screen-reader save status without constant announcements, 200% zoom/reflow. Use roughly 44 px primary touch targets as a product preference; WCAG AA’s target-size rule is different and has exceptions. [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

### Main screens

Desktop, when space permits:

```text
Navigation              Note list                  Editor
New Note                Search / filter            Note title
All Notes               Pinned notes               Journal selector
Inbox                   Recent notes               Writing area
Journals                Title + short preview      Contextual formatting
  Shelf → Journals                                 Save/sync status
More → Archive, Trash
Settings                [small optional cat]
```

At medium widths, collapse navigation. On a phone, show one primary surface at a time: note list, Journal list, or editor. Bottom navigation: **Notes / Journals / Search**; one accessible New Note action. In the editor, prioritize Back, title, body, a small format control, and More. Keep the virtual keyboard from covering the caret. Desktop focus mode hides the two left panes.

Only New Note uses the main action treatment. Never require a user to understand Shelves before writing.

## 9. Product behavior: the simplest complete experience

### Organization rules

1. A Note belongs to exactly one Journal. An Inbox Journal exists by default and can be renamed, but cannot be removed while it is the default destination.
2. A Journal belongs to zero or one Shelf. A Shelf contains Journals, not loose Notes or another Shelf.
3. Tags are optional and flat in v1. They are not a required filing step.
4. All Notes is a view, not a duplicate container. A Shelf view aggregates its Journals.
5. Archive hides material from normal lists without deleting it. Trash is a separate recoverable state.
6. Moving is available through a clearly labeled menu/dialog; drag-and-drop is optional desktop convenience, never the only route.
7. Deleting a Shelf keeps its Journals. Deleting a Journal offers moving its Notes to another Journal or moving them to Trash, with a count and Undo. Destructive choices are never the default.

### Essential flows

**First use:** open → choose “Start writing” → type immediately in Inbox. No account, survey, pet naming, or organization wizard first. Explain local-only storage briefly after the first useful action, and offer backup/sync when relevant.

**Quick note:** New Note → caret in body with an optional title field. An untitled note gets a first-line preview; naming is optional. Creating a note inside a Journal keeps that context; creating from All Notes or Search uses Inbox.

**Organize later:** choose the Journal chip → searchable Journal picker → move. Creating a Journal is inline in this picker. Creating a Shelf is in Journal organization, not onboarding.

**Find something:** Search → title/body/tag results while typing → visible query highlighting → open exact note. Global scope is the default; a Journal filter is obvious and removable. Archived and trashed scope is explicit. Attachment text search appears only once its extraction/indexing capability actually exists.

**Attach a file:** drop/paste/select → local attachment saved → preview or download action → separate cloud upload state. Text remains usable if an upload fails. Compression is optional; retain the original unless the user agrees otherwise.

**Go offline:** continue reading/writing locally; show “Saved on this device — waiting to sync.” An attachment not downloaded says so before opening. Never suggest that a placeholder is an offline copy.

**Return online:** drain the outbox; reconcile remote changes; show “Synced” only after acknowledgment. A conflicting note offers both versions and a simple comparison; never silently discard one.

**Export/leave:** Settings → Your data → Export library → portable archive plus summary. Local mode exports everything actually held locally; cloud mode identifies any files still needing download. A partial export is clearly labeled partial.

**Privacy controls:** cloud sign-out stops sync and offers clearing this device’s copies. Clearing local data is explicit and checks for unsynced changes. Account deletion is separate from sign-out, explains backup retention, and has a completion status.

## 10. Feature scope and release boundaries

### P0 — local alpha: prove the core

- Notes, Journals, optional Shelves, Inbox, move/rename/delete/Undo.
- Lightweight rich-text editor: paragraphs, headings, bold/italic, links, bullet/numbered lists, checklists, quotes. Paste as plain text option; ordinary keyboard shortcuts.
- Local autosave and crash recovery; clear failure if local storage cannot commit.
- Local search across title/body/tags; list sort and pins; Archive and Trash.
- Local image/file attachments with explicit storage limits/status.
- Portable JSON + attachments backup, readable Markdown/HTML export, and restore/import of the app’s own archive.
- Responsive layout, focus mode, accessible controls, reduced motion, optional cat.
- Storage health and backup guidance. No account required.

This alpha is not yet a safe replacement for a large Evernote archive. Use noncritical samples until restore and persistence tests pass.

### P0 — private cloud beta: earn trust

- Optional sign-in, authenticated sync, per-account data isolation.
- Offline outbox, idempotent mutations, revision checks, tombstones, conflict copies, retry/backoff.
- Private file hosting; resumable/retryable transfer behavior appropriate to supported file sizes.
- Basic local revision recovery and bounded server checkpoints.
- ENEX migration preview and reconciliation, retaining originals and warning on unsupported content.
- Quotas, account-wide cost guards, administrative capacity metrics, restore drill, self-service account deletion.
- Supported-browser testing, actual-device mobile testing, measured performance and accessibility.

### P1 — only after beta release gates

- Browser article clipper; source URL and saved date; clean article extraction.
- Better ENEX fidelity, note link reconstruction where possible, migration batch resume.
- Internal links/backlinks if not yet completed in beta; table of contents for long notes.
- Simple tables, optional covers/thumbnails, a few useful templates, bulk operations.
- PDF text extraction and opt-in OCR after device performance testing.
- Read-only note mode, carefully scoped reminders, better export convenience.

### P2 — separate decisions

True encrypted sync, native clients/share extensions/widgets, public sharing, real-time collaboration, handwriting, calendar/task platforms, audio transcription, semantic search, and AI assistance. These are not included in the free MVP promise.

**Feature admission rule:** a feature must solve an observed user problem, fit a clear place in the interface, pass a performance review, and have a sustainable operating cost. A frequently requested feature can still be outside this app’s audience.

## 11. Technical architecture and free libraries

### Recommended stack

Use **TypeScript + React + Vite**, a local database, and a Cloudflare Worker API. A content-editing app does not need server rendering for its private editor. Keep any future marketing website independent and optimize its public pages separately.

| Concern | Recommended free resource | Reason / boundary |
| --- | --- | --- |
| UI | React + Vite + small CSS token system | Common ecosystem and rapid iteration; import only what is needed |
| Editor | [Tiptap open-source core/extensions](https://tiptap.dev/docs/editor/getting-started/overview), MIT | Reuse editing, selection, lists, and schema behavior; exclude paid cloud/AI/conversion services |
| Local database | [Dexie](https://github.com/dexie/Dexie.js), Apache-2.0 | IndexedDB transactions, indexes, migrations; no Dexie Cloud subscription assumed |
| Local search | [MiniSearch](https://github.com/lucaong/minisearch), MIT | Browser text search; run indexing/query work off the UI thread when needed |
| API | [Hono](https://github.com/honojs/hono), MIT | Small web-standards framework for Workers |
| Authentication | [Better Auth](https://github.com/better-auth/better-auth), MIT | Reuse session/auth security; its [1.5 release](https://better-auth.com/blog/1-5) documents native D1 support |
| ZIP backup | [fflate](https://github.com/101arrowz/fflate), MIT | Streaming/async archive processing; verify actual output size and memory |
| HTML sanitization | [DOMPurify](https://github.com/cure53/DOMPurify), Apache-2.0 or MPL-2.0 | Sanitize browser imports/previews; Workers still validate structure and never blindly render HTML |
| Migration accelerator | [Yarle](https://github.com/akosbalasko/yarle), MIT | Evaluate as an optional local ENEX-to-Markdown migration path, not an assumed drop-in browser library |
| Icons | [Lucide](https://github.com/lucide-icons/lucide), ISC | Familiar, selective SVG imports; create original mascot separately |
| Later article extraction | [Mozilla Readability](https://github.com/mozilla/readability/blob/main/README.md?plain=1), Apache-2.0 | Client/extension extraction with sanitization; not a universal URL scraper |
| Testing | Vitest, Playwright, axe-core | Free developer tooling; choose/pin compatible versions and check package licenses at implementation |

Avoid a paid dependency hidden inside an otherwise free library. The open-source Tiptap editor is distinct from its hosted platform. Better Auth hosting/enterprise products are also distinct from self-hosting its core. Preserve license notices and audit transitive dependencies before shipping.

Start cloud auth with a small, verified OAuth configuration using Better Auth; Google is the proposed first provider. Use the maintained provider integration, minimum identity scopes, CSRF/state protection, secure HTTP-only cookies, and server-side sessions. Check provider production requirements before launch. This avoids inventing password cryptography or assuming free transactional email. Keep a provider-independent internal user ID; plan recovery/additional sign-in methods before broad release.

Do not assume heavy password hashing, large parsing jobs, PDF conversion, or OCR fit a Free Worker’s CPU allowance. Keep large parsing and compression client-side; measure the actual auth callback and API execution path.

### Data model proposal

```text
Shelf:      id, ownerId, name, sortKey, revision, deletedAt
Journal:    id, ownerId, shelfId?, name, sortKey, revision, deletedAt
Note:       id, ownerId, journalId, title, documentJson, schemaVersion,
            plainText, pinned, archivedAt?, createdAt, updatedAt,
            revision, deletedAt
Tag:        id, ownerId, name
NoteTag:    noteId, tagId, ownerId
Attachment: id, ownerId, noteId, filename, mime, size, checksum,
            objectKey, transferState
Mutation:   id, deviceId, entityId, baseRevision, payload, state
Change:     ownerId, sequence, entityType, entityId, revision, deletedAt
Checkpoint: noteId, revision, content, createdAt
```

Keep local-only outbox state out of the server’s canonical content model. Server sessions/accounts follow the auth library’s schema. Add foreign keys/ownership validation and indexes for `(ownerId, sequence)`, Journal membership, updated-time listing, and object lookup. Use server-generated monotonic change sequence numbers, not client clocks, for delta sync.

Canonical note content is versioned, schema-validated editor JSON; derive plain text for search and Markdown/HTML for portable reading. Export JSON for exact restoration. Markdown alone cannot losslessly represent every rich-text feature.

### Save and sync contract

1. Apply editor changes immediately in memory; persist locally using bounded batching, approximately 250 ms, plus a periodic checkpoint during continuous typing. Keep the last committed version recoverable.
2. Commit the note and its pending mutation in one local transaction. Only then report “Saved on this device.” A failed write produces an actionable save error and a copy/export escape route.
3. Sync compacted mutations after a short pause, approximately 2 seconds; cap continuous-edit upload frequency, initially about once per 10 seconds. Immediate navigation should not discard pending local work. These timings are proposed tuning values.
4. Every mutation has a unique idempotency key and base revision. The server atomically checks the expected revision, updates the entity, and appends the change record. Duplicate retries return the previous outcome.
5. A successful acknowledgment advances server revision and removes only the corresponding local pending state. A stale acknowledgment must not erase newer local changes.
6. Pull changes by bounded cursor; apply them transactionally. Retry with exponential backoff/jitter; sync on foreground, reconnection, and manual retry. Do not depend on mobile background sync.
7. Same-note conflicts retain both versions. Metadata conflicts need explicit rules too: move versus delete, Journal deletion versus new Note, and renamed/deleted Shelves must not orphan content.
8. Use tombstones so offline devices cannot resurrect deletions. Publish retention; if a device’s cursor predates retained history, perform a full reconciliation while preserving its unsynced edits.
9. Coordinate multiple browser tabs with a single sync leader where supported and database-level safeguards. Do not rely solely on an in-memory mutex.
10. Treat attachment upload as a separate recoverable state machine. Reserve quota → upload to a new private key → verify bytes/checksum/ownership → mark ready. Expire abandoned reservations and clean orphan objects safely.

For v1, revision checking with conflict copies is simpler than collaborative CRDT infrastructure. Do not claim automatic concurrent merging. Reconsider CRDTs only if real-time collaboration becomes a validated requirement.

### Offline storage is useful, but not a backup

IndexedDB can be removed under browser storage pressure; persistence requests are not guaranteed. [Dexie’s StorageManager explanation](https://dexie.org/docs/StorageManager), [StorageManager API](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager).

Request persistent storage after meaningful use, expose storage health, handle quota exceptions, and make portable backup easy. Local-only onboarding must explain that clearing site data or losing the device can lose notes. Do not promise permanent local durability from a PWA. Initial offline use requires a successful first load and downloaded app assets; cloud attachments are offline only after download.

Service-worker updates must not force a reload during editing. Keep versioned assets and compatible database migrations; coordinate activation and recovery. Cached private responses and local databases must be scoped to the current account, including on shared devices.

## 12. Cloudflare hosting, private files, and the real zero-cost boundary

### Preferred deployment shape

**One Worker with Static Assets + D1 + private R2**, with a free `workers.dev` address initially. Cloudflare documents React SPA/static-asset hosting directly. [Static Assets](https://developers.cloudflare.com/workers/static-assets/).

Pages is an acceptable alternative if it matches existing tooling; Pages Functions consume Workers allowances, and Pages has separate build limits. Do not assume unlimited dynamic API execution from free static hosting. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Pages limits](https://developers.cloudflare.com/pages/platform/limits/).

| Service | Verified allowance / constraint at research date | Product consequence |
| --- | --- | --- |
| Static assets | Workers pricing lists static-asset requests as free/unlimited under the standard asset-serving path | Route app assets without unnecessary Worker execution; no user uploads in the deployment bundle |
| Workers Free API | 100,000 requests/day; 10 ms CPU/invocation | Batch sync; no per-keystroke server writes; benchmark auth/import paths |
| D1 Free | 5 million rows read/day, 100,000 rows written/day, 5 GB total account storage | Index queries; monitor actual rows scanned/written, including index overhead |
| D1 per-database limit | 500 MB on Free; 10 databases; seven-day Time Travel | A single free database does not offer 5 GB; budget history and indexes explicitly |
| R2 Standard free allowance | 10 GB-month storage, 1 million Class A operations/month, 10 million Class B operations/month; no egress fee | Small private file beta is feasible; stored bytes and operations still matter |
| R2 activation | R2 subscription checkout is required; usage beyond allowances is billed | Confirm account/payment prerequisites; “free allowance” is not a guaranteed hard spending cap |
| Turnstile Free | Free plan includes unlimited challenges, with widget/hostname limits | Optional abuse control around cloud account creation; never in the writing flow |

Sources: [Workers](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/?ref=filebase.com), [R2 onboarding](https://developers.cloudflare.com/r2/get-started/), [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/?ref=builtplain.com).

These allowances apply to the account/products as specified by Cloudflare, not independently to every app or user. Inspect existing account usage before enabling EvieScratch. Sharing an account with pixelapps.site or other projects reduces available headroom.

### Provisional beta capacity model — assumptions, not measured consumption

Start with **50 invited users**, not open registration:

- Cloud attachments: **50 MB/user**, maximum **10 MB/file** initially. At full allocation, 50 × 50 MB = **2.5 GB** live files.
- Reserve capacity for backups/versions, temporary uploads, and other account usage. Use an **8 GB project operating ceiling only if the rest of the account has sufficient headroom**; otherwise reduce it.
- Text budget: **2 MiB live text + 2 MiB history/user** initially. Fifty users consume at most **200 MiB** before indexes, auth, metadata, and logs. Keep the whole D1 database below a provisional **350 MB** operating ceiling; measure actual storage and stop new admissions early.
- Proposed supported note-body ceiling: **256 KiB serialized JSON** in the beta. Retain oversized imports locally as preserved originals/read-only content with an explicit warning; never silently truncate. Revisit after measurement.
- Example sync load: 50 active users × 100 sync requests/day = **5,000 dynamic requests/day**, before auth, file reads, checks, and other account traffic.
- If each request caused 10 actual row writes, that would be **50,000 writes/day**. This is an illustrative workload, not an expected measurement; indexes, history, and auth can change it substantially. Inspect D1 query metadata.

The quotas are beta operating assumptions, not the final offer. They accommodate lightweight notes, not importing a lifetime of scans into free cloud storage. Local mode has no artificial note-count cap, but remains bounded by device storage and supported document sizes.

### Avoid surprise bills and data loss

- Keep Workers on Free during the beta. Free D1 daily exhaustion returns errors; queue changes locally rather than marking them synced.
- R2 is metered beyond its allowance. Alerts, Worker spending controls, and file-size caps are not a universal R2 hard dollar cap.
- Enforce authenticated per-user reservations and an account-aware aggregate byte budget atomically before uploads. Include temporary objects, retained revisions, and backups in the calculation.
- Track operation usage and stop new admissions/uploads well before allowance exhaustion. Reads and abusive requests also consume operations; reservations alone cannot guarantee zero charges.
- Keep buckets private. Deliver files only after authorization via the Worker or narrowly scoped short-lived signed URLs. Disable public listing and `r2.dev` exposure for note files. Do not use predictable filenames as authorization.
- Apply rate limits, request-size limits, MIME/content rules, short upload authorization lifetimes, and orphan cleanup. Validate declared size against actual size. Serve unsafe types as downloads; do not inline arbitrary HTML/SVG.
- Do not store file blobs as Base64 in D1, KV, source control, or public static assets. Do not use KV as the authoritative note store.
- On a quota rejection, retain the local attachment, display why cloud upload paused, and keep export available.

**Strict $0 option:** ship the fully local PWA with device attachments and user-controlled exports; do not activate R2 until accepting metered-service exposure. This satisfies free operation but does not provide automatic cross-device cloud file hosting. A capped R2 beta is the recommended practical path if the owner accepts that distinction. No honest plan guarantees unlimited publicly available hosted files at zero cost.

Domain registration, app-store distribution, paid developer accounts, premium design assets, paid AI usage, and human support time are outside the free hosting promise. Use an existing domain only if its ownership and incremental cost are already settled.

## 13. Performance specification

These are proposed engineering targets, not measured results or claims that EvieScratch is already faster than Evernote.

| Metric | Initial target | Test condition |
| --- | --- | --- |
| Warm local note open | p95 ≤150 ms to readable content | Mid-range Android reference device; app already loaded |
| Create note and focus editor | p95 ≤200 ms | Warm app with 10,000-note synthetic library |
| Input responsiveness | INP ≤200 ms; no repeated typing jank | Real keyboard, formatting, long list, sync in progress |
| Local search | p95 ≤150 ms after index ready | 10,000 notes / approximately 20 MB searchable text |
| Cold usable editor | ≤2.5 seconds target | Defined mid-range device, reproducible throttled connection; test first-visit and cached paths separately |
| Local commit after typing pause | p95 ≤500 ms | Normal browser storage; show errors on failure |
| Cross-device propagation | p95 ≤5 seconds after upload scheduling under normal network | Foreground devices, service healthy, no conflict |
| Initial JS | Aim ≤250 KB gzip shell, ≤500 KB total including editor | Exclude deferred import/PDF/OCR tools; assess actual build |
| Cat payload | Aim ≤100 KB initial compressed assets | Deferred sprite sheet; no continuous render loop |
| Search/index work | Avoid main-thread tasks >50 ms | Worker indexing, chunked rebuilds, incremental updates |

The 10,000-note local benchmark intentionally exceeds beta cloud text quotas. It tests scalability without promising that the free cloud beta stores that fixture. Record device model, browser version, dataset generation, network profile, cold/warm state, and p50/p95 results.

Implementation rules:

- Read only visible list metadata; load full bodies on demand. Use keyset pagination; introduce virtualization when profiling shows a benefit.
- Do not re-render the whole app on each keystroke. Keep editor state isolated; derive list previews asynchronously.
- Persist incrementally; do not serialize all notes for one edit. Build/rebuild search indexes in bounded chunks and store index versions.
- Lazy-load migration, compression, PDF, OCR, and large settings tools. Do not load every icon/font variant.
- Search local text rather than scanning cloud rows per keystroke. Avoid per-device constant polling; choose a measured foreground interval and adapt after activity.
- Index server ownership/cursor queries; monitor rows read and written, not only request count.
- Keep images sized for display and previews lazy. Original files download on demand; no video autoplay.
- Record failures and timings without note text, titles, search queries, filenames, or attachments in logs.

## 14. Migration, portability, privacy, and recovery

### Evernote migration

**[E1]** Officially, Evernote exports through its Mac/Windows desktop app as ENEX or HTML, with whole-notebook export and a 100-selected-notes limit. Free users can export. The guide does not offer native Markdown export. [Export documentation](https://help.evernote.com/hc/en-us/articles/209005557-Export-Notes-and-Notebooks-as-ENEX-or-HTML).

The migration assistant should explain that workflow, then accept exported files locally. Do not ask for Evernote credentials or require the Evernote API for initial migration.

Import requirements:

1. Preview counts, resource bytes, supported content, and cloud-quota fit before modifying the library.
2. Parse ENEX incrementally in a worker; avoid loading multi-gigabyte files and Base64 resources all into memory. Size-limit the initial supported import and provide a local conversion path for larger files.
3. Preserve title, timestamps, tags, source URL, checklists, basic formatting, and resource bytes/checksums where available. Save the original import files unchanged under user control.
4. Map one exported notebook to a Journal, with a user-confirmed name. Recreate Shelves manually if the export lacks stack metadata.
5. ENEX references can limit exact internal-link reconstruction. Do not promise preserved links, OCR indexes, encrypted content, task metadata, reminders, or unsupported formatting without a verified mapping.
6. Store sanitized original HTML/ENML alongside a conversion fallback where practical; show a read-only original view if rich conversion would lose meaning.
7. Dedupe with a documented import identity/checksum strategy; preview true duplicates versus intentional copies. Retry must not create duplicates or silently merge distinct notes.
8. Make import cancellable and resumable with a manifest. Report imported/skipped/failed counts and every unsupported resource. Upload only after local review.

**[C3]** Joplin’s import documentation explains that ENEX conversion can change recognition data and rich styling, and describes internal-link limitations. These are useful migration pitfalls, not a license to assume every converter has identical behavior. [Joplin import/export](https://joplinapp.org/help/apps/import_export/).

Evaluate Yarle as a free, local conversion accelerator before writing the whole converter. Its desktop/Node assumptions, dependency footprint, round-trip fidelity, and metadata handling need a spike. Do not import Joplin’s implementation wholesale without a separate license review.

### Portable export contract

Every full export includes a versioned `manifest.json`, canonical note JSON, readable Markdown/HTML, Journal/Shelf/tag metadata, and an `attachments/` directory with original bytes. Use stable IDs and collision-safe filenames; rewrite internal/attachment links. Include checksums and an export completeness report. A new-profile restore must reproduce counts, relationships, and file checksums.

Markdown/HTML is for readable ownership and interoperability; JSON plus files is the exact app restore format. Browser “Print to PDF” can provide a basic free print path later, with honest pagination limits; do not depend on a paid conversion API.

### Privacy/security boundary

**[E2]** Evernote documents TLS and server-side encryption at rest, plus selected-text passphrase encryption on desktop. Those protections are distinct from making an entire account and all attachments end-to-end encrypted. [Security overview](https://evernote.com/legal/security), [selected-text encryption](https://evernote.com/en-us/security/tips).

Proposed v1: private authenticated cloud storage with a clear statement that it is **not full E2EE**. Local-only mode has no app-server copy but is not a password-encrypted vault. The host/administrator’s potential access and operational retention must be disclosed. Do not send content to external AI, analytics, or support automatically.

Mandatory cloud-beta controls: owner-scoped authorization on every entity and file; validation on the server; safe cookies; CSRF/origin checks; strict content policy; sanitized imports; no remote image fetching on import without consent; no secrets in the frontend; account-isolation tests; least-privilege deployment credentials. Arbitrary server URL fetching would introduce SSRF risk, so clipper extraction should begin in the browser extension/client.

If E2EE becomes a requirement, stop before finalizing cloud storage/auth recovery. Use a reviewed protocol/library, documented key derivation and device-key distribution, recovery strategy, encrypted files, and a threat model. Encryption changes search, previews, sharing, account recovery, and migration; it is not a late checkbox.

### Recovery and deletion

- Keep local crash checkpoints and bounded server revisions; define byte limits and retention before beta.
- Use D1 Time Travel as short-term operational recovery, not a portable user backup or complete file backup.
- Export periodic application backups to a separate owner-controlled destination and test restoration. Any cloud backup bytes count toward free allowances. No backup is claimed until the restore drill passes.
- Trash target: 30 days, clearly described, with its storage counted. User-requested permanent deletion should remove live content promptly and document the bounded backup expiry; deletion tombstones contain no note body.
- Define a restore procedure that reapplies deletion records so an old backup cannot silently resurrect deleted accounts.
- Export and recovery operations must distinguish complete local copies from cloud-only files. Never present a partial backup as complete.

## 15. Building plan: ready for either Codex or Gemini

The plan assigns work packages rather than choosing a model on reputation. Keep one technical owner responsible for schema, migrations, saving, sync, and release gates. Demonstrated output on the same small task is a better selection criterion than a blanket claim that one assistant is best.

| Stage | Concrete deliverable | Exit gate | Planning allowance* |
| --- | --- | --- | --- |
| 0. Product validation | Vocabulary card sort; five task flows; pixel Evie placement/motion mockups; inspect actual free Figma files | Emily and 4–6 relevant testers can capture, file, and retrieve without guidance | 2–3 focused days |
| 1. Risk spikes | Editor + Dexie persistence; representative ENEX conversion; Worker auth/D1 compatibility; quota prototype | Document browser/CPU/storage measurements and any failed assumptions | 2–4 days |
| 2. Local alpha | P0 organization/editor/search/files/export/restore; responsive UI and original cat | Offline restart and full restore tests pass; first performance profile | 5–8 days |
| 3. Cloud beta | Auth, sync protocol, private files, revisions, quotas, deletion | Two-device conflict, authorization, quota, and restore matrix passes | 5–10 days |
| 4. Migration and hardening | ENEX review/resume/reporting; actual-device UX/accessibility; performance fixes | Sample Evernote libraries reconcile; no unresolved data-loss/security defects | 4–7 days |
| 5. Invited field beta | 20–50 invited users, initially sample/noncritical content; monitored usage and support | Two weeks of observation, incident review, validated budget and recovery | 2 calendar weeks minimum |

*Rough estimates for one experienced builder with AI assistance and existing tooling. They are not commitments, and AI generation speed does not eliminate field testing or data-integrity work. Native clients, full migration fidelity, E2EE, and collaborative editing require separate estimates.*

### Suggested work split — pending the user’s choice

| Package | Suggested ownership | Contract / handoff |
| --- | --- | --- |
| EvieScratch persistence, sync, files, auth, migrations | One primary builder, Codex or Gemini | Schema definitions, revision rules, API contract, migration fixtures, tests |
| EvieScratch visual exploration | Either assistant, independently if desired | Same five screens using the supplied Evie assets, identical tasks; no backend edits |
| EvieScratch review | Other assistant after implementation is concrete | Reproduce save/conflict/import/export failures, verify measurements |
| pixelapps.site | Gemini is a reasonable proposed separate project owner | Independent repository/brief and delivery milestones; no automatic assignment in this task |
| Product decisions | User with Emily | Vocabulary, visual preference, beta audience, operating-cost/privacy choices |

A practical option is Codex for EvieScratch and Gemini for pixelapps.site, with cross-review later. This is a workload-separation suggestion, not a claim of measured model superiority. Do not have two assistants independently design the same sync protocol or simultaneously modify the same migration/schema files.

If splitting EvieScratch itself, agree first on entity schemas, API requests/responses/error codes, editor schema, CSS tokens, component boundaries, and acceptance fixtures. Use separate branches/worktrees and review integration. The project can progress without deciding the marketing-site builder.

### First implementation ticket

> Build an offline vertical slice: create a Note in Inbox, write formatted text, save transactionally in IndexedDB, reload in flight mode, search for it, move it into a Journal on a Shelf, export a full archive, and restore it into a fresh browser profile. Include a small optional appearance of Evie using the supplied mascot assets. No cloud or large dashboard. Record actual save/open timings and prove restored attachment checksums.

This tests the foundations before polishing the brand or adding accounts.

## 16. Release tests and definition of done

### Data-integrity scenarios

- Offline edit → close/reopen after committed save → reconnect: content preserved.
- Rapid typing with checkpoints; simulated storage failure and forced process termination: last committed version recoverable; do not promise uncommitted keystrokes survived.
- Two devices edit one note offline; duplicate retry; stale acknowledgment; concurrent move/delete: no silent data loss or orphaned entities.
- Device reconnects after tombstone retention: full reconciliation preserves unsynced edits without resurrecting deleted content.
- Multiple tabs, expired session, account switch, browser storage pressure, service-worker/database upgrade: no cross-account leakage or overwritten pending work.
- Upload interrupted or too large; wrong MIME; checksum mismatch; quota racing; abandoned reservation: recoverable state and correct accounting.
- ENEX with Unicode, large resources, repeated titles, tables, checklists, malformed markup, encrypted/unsupported content: explicit reconciliation and originals preserved.
- Export/restore across a fresh profile: counts, relationships, canonical content, and original file checksums match; partial exports are labeled.
- Database/file restoration and account deletion: no unintended resurrection; backup retention documented and verified.

### Usability and device scenarios

Test Chrome/Edge/Firefox desktop, Safari on macOS, Chrome on Android, and Safari plus installed PWA on iPhone. Start with a documented supported-version range. Playwright’s WebKit is useful but does not replace actual iPhone testing.

Observe Emily plus 4–6 target users doing five tasks: capture an idea, create a Journal, group Journals, find a previous note, and export/restore. Proposed threshold: at least 80% unassisted completion per task in this small formative sample, with no catastrophic mistakes. This small sample guides iteration; it is not statistical market validation.

Measure time to first written note; one-action New Note; typical Journal move within two intentional choices; find-by-search success; perceived visual busyness; and whether “Journal” sounds diary-only. Compare static and briefly animated Evie at different sizes with the same content/layout. Ask preference after task completion and watch whether the mascot distracts.

### Public-release gates

- No unresolved critical data-loss or account-isolation defect.
- Save/sync labels accurately reflect local commit and remote acknowledgment.
- Complete export and verified restore work without a subscription.
- Defined browser support, measured performance report, keyboard/screen-reader review, and mobile text-selection tests.
- Cloud limits visible in product; cost telemetry and quota enforcement tested; invite capacity fits the actual shared account.
- Privacy text matches the implemented encryption, retention, logging, and deletion behavior.
- A support contact, reproducible bug-report flow, rollback plan, and operational restore runbook exist.

## 17. Decisions to settle before cloud implementation

These do not block the first offline vertical slice:

1. **Names:** confirm Notes/Journals/Shelves with Emily; final app name remains open.
2. **Art:** Evie is confirmed as the single mascot, in pixel art. Refine placement, size, and motion using identical tasks; do not reopen alternate-cat selection.
3. **Cost:** accept capped R2 metering exposure or remain strictly local; verify shared Cloudflare capacity and account requirements.
4. **Privacy:** standard private sync or true E2EE requirement before cloud design is locked.
5. **Platforms:** PWA first is proposed; native widgets/share sheets are later work.
6. **Builder:** choose one EvieScratch technical owner; decide pixelapps.site separately.
7. **Migration:** obtain consented, representative export samples; no need to collect private libraries for initial development.

The immediate next deliverable is the offline slice and a small visual prototype. Expansion should follow demonstrated reliability and Emily’s task success.
