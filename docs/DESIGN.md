# Design system and wireframes

Updated 21 November 2026. One layout system, two visual modes, one Evie.

## Evidence and reference selection

The shortlist favors note-specific flows, responsive components, simplicity, free availability, and implementation fit. “Best fit” is our assessment; no template ranking or user-retention comparison was measured. Public creator descriptions were reviewed. Figma Community blocked direct file retrieval, so editable layers, current free-subset contents, and complete component quality remain unverified. No Figma file was created, imported, or copied into this project.

| Reference | Why it fits | Adopt | Avoid |
| --- | --- | --- | --- |
| [Makarya Notes — creator’s free-kit description](https://dribbble.com/shots/19104031-Home-Screen-Makarya-Notes-Free-UI-Kit-Design-System), [Figma file](https://www.figma.com/community/file/1090245813253623841) | Most directly relevant note-app reference; creator describes resizable screens/components and a prototype | Note list/editor/organization patterns; consistent spacing | Assuming the free subset includes the full paid kit, or adopting every advanced screen |
| [Material 3](https://m3.material.io/), [Figma kit](https://www.figma.com/community/file/1035203688168086460/material-3-design-kit) | Official responsive/mobile component system | Bottom navigation, sheets, touch states, accessible hierarchy | Large decorative UI that crowds writing |
| [Untitled UI free Figma kit](https://www.untitledui.com/free-figma-ui-kit) | Useful neutral component/wireframing starting point | Forms, dialogs, empty/error states, component consistency | Treating premium products as free or adding a new runtime library just to match a kit |
| [Bear](https://bear.app/) | Award-recognized notes product with restrained animal branding; useful real-product reference | Quiet editor, list/navigation hierarchy, progressive disclosure | Treating awards as evidence for a particular palette or copying its mascot |
| [Evernote sidebar documentation](https://help.evernote.com/hc/en-us/articles/221189627-Sidebar-and-Navbar-Overview) | Familiar organization and adjustable navigation | Clear container navigation and useful shortcuts | Reproducing all dashboards, calendars, AI controls, and promotions |

Before reusing actual template assets, inspect the available file and its license. Inspiration does not require copying components or buying a kit. Make our own small wireframe using the screens below.

## Normal visual mode — default

Evie supplies **warm charcoal, paper/white, and ginger**. Add **muted teal** as the third chromatic accent: a calm cool counterpoint to ginger, with strong usable contrast for primary actions. This is an aesthetic proposal; no evidence establishes teal as the most successful color for this audience. It also distinguishes the app from Evernote’s brighter green branding.

- Cream canvas, light writing surface, charcoal text, muted secondary labels.
- Teal for New Note, selected controls, links and focus context; ginger for small Evie/brand details, not every action.
- Modest rounding, light borders, nearly flat surfaces, no card around every paragraph.
- System sans-serif throughout, 16–18 px editor body, approximately 1.5 line height, line length around 65–75 characters on desktop.
- Evie appears sparingly in empty states or a small corner. Existing art is pixel-style; a future clean illustration can be derived from the same reference identity. Do not substitute another cat. The foundation preview intentionally uses typography and tokens, avoiding an unoptimized mascot download.

## Pixel Art visual mode — optional

- Same screens, DOM, semantics, labels, data, actions, and reading sizes as Normal.
- Squared corners, crisp stepped borders and offset shadows, slightly warmer paper, limited palette, selected pixel decorations and Evie’s sprite art.
- Use system monospace for short brand/display headings only; body/editor/control labels retain readable system sans-serif.
- No entire canvas/game engine, animated room, bitmap text paragraphs, scan lines, flashing, sounds by default, or collectible cats.
- Keep Normal’s minimum touch target sizes and focus visibility. Pixel decoration must not steal space from writing or create layout shifts.

Both modes initially use a light color scheme. Visual mode and future light/dark preference are separate concepts; avoid six theme combinations in v1.

## Canonical tokens

Actual colors and metrics live in [`../src/styles/tokens.css`](../src/styles/tokens.css). Shared components consume semantic names (`--canvas`, `--surface`, `--text`, `--muted`, `--accent`, `--on-accent`, `--ginger`, `--control-border`, `--focus`, `--radius`, `--panel-shadow`). Do not hard-code duplicate palettes in components. `npm run verify` checks essential text/action/focus/control-border contrast pairs for both modes. This is not a full accessibility audit.

Theme setting: `normal | pixel`. Store only this non-sensitive preference in localStorage. On first use or corrupt/unavailable storage, default to Normal; switching remains usable even if the browser refuses to save preferences. Apply the root `data-theme` before React mounts. Do not remount the editor, reset undo, lose selection, or change stored note content on theme switch.

## Wireframe contract

### Phone: notes list

```text
EvieScratch                   More
Search notes…
All Notes / current Journal
Pinned (only when populated)
Note title                    date
Short preview, optional file icon
…
                          New Note
Notes       Journals        Search
```

New Note is one action. List rows have a large hit area. More opens Settings/Appearance, Archive and Trash. Show no empty Pinned section. Search is a route/view, with its current scope visible.

### Phone: editor

```text
Back                   More
Title (optional)
Journal chip → move picker
Writing area
…
Saved on this device
Format / insert toolbar, clear of keyboard
```

Focus the body immediately for a new note. Keep the caret visible when the keyboard opens; respect safe areas. Formatting appears on demand; no pet controls around the caret. A move-picker sheet supports search, creating a Journal inline, cancel, and returning to the same selection. Avoid nested modal stacks.

### Phone: Journals

```text
Journals                      Add
Inbox
Shelf name                 expand
  Journal name             count
Unfiled Journal            count
Notes       Journals        Search
```

Shelves are optional, and Add offers Journal first. Move via accessible menus, with drag-and-drop only as an extra desktop convenience.

### Tablet and desktop

At sufficient width, show Journal navigation, a note list, and one editor. Collapse navigation at medium width and use a single primary surface on phones. Breakpoints are content-driven starting points: below 640 px single pane, 640–1023 px at most two panes, 1024 px and above optional three panes. Focus mode hides side panes. Preserve current note, filter, scroll, selection, and focus across layout changes.

### Settings / Appearance

Show two equal preview options: Normal (default) and Pixel Art. Include reduced-motion respect and mascot visibility when implemented. Storage/backups live under Your data; account controls are absent until cloud exists. Label current capacity and unsynced files honestly.

### PWA onboarding and payment surfaces

The first-run splash is solid accent green, with only Evie scratching a little Journal and tucking it away. It plays for 1.5 seconds after the tiny pose assets are ready (preload has a 700 ms deadline), fading during the last 330 ms. No text or controls appear over it. Underlying onboarding is inert/hidden to accessibility until the splash ends. Reduced motion keeps the scene static for the same duration.

During app browsing Evie is curled asleep with only a 0.6% vertical breathing change over 6.8 seconds. Put her in the browsing header's layout, clear of Journal/note rows. An open visible note wakes her; one 240 ms blink occurs every random 6–14 seconds in the reserved editor corner. Timers pause in hidden documents and under reduced motion. Use existing unmirrored calico poses. No duplicated mascot in the contextual note guide. Notifications occupy their own layout space so Undo/dismiss never covers row controls. Header and guide pricing show a second, parenthesized line for trial time/status. Both plan surfaces offer **Start Free Trial** and **Buy Now**, with distinct trial-end versus immediate-charge terms.

Follow [GROWTH.md](GROWTH.md): public pricing and a brief optional sample before account/interval selection and hosted Stripe checkout. Offer one product with weekly/annual intervals (US$7.99/week or US$299.88/year after three days free), not multiple confusing feature tiers. State actual renewal total, cadence, trial end, cancellation route and usage limits. Account for checkout return/pending/failure, declined/action-required payment, canceled-but-still-entitled, expired trial, read/export access, and offline entitlement recovery. Put Manage subscription in account settings from the start of commercial trials. Installation comes after useful activity; it is optional and browser-specific. Do not stack Pixel Art, install and notification prompts.

## States designers and developers must cover

Empty library; populated list; long titles; no search matches; archived/trash scope; local saving; failed local write; file unavailable offline; storage full; export incomplete; restore review; later cloud pending/conflict/session-expired/quota-blocked. Prefer short inline explanations with an action over unexplained spinners. Never show a disabled fake Sync control in a local-only release.

## Validation before shipping

Test 360 px and 390 px phone widths, 768 px tablet, 1280 px desktop, 200% zoom, keyboard navigation, screen-reader labels, real Android/iPhone keyboards, and reduced motion. Verify Normal/Pixel parity. Use the same five tasks in both, measuring completion and distraction. Do not infer improved usability from a theme preference alone.
