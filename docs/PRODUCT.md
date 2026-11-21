# Product contract

Updated 21 November 2026. Current requirements for implementation; the original research is background.

## Purpose and audience

Help Emily and people with similar needs capture, organize, and retrieve personal notes without Evernote’s perceived visual busyness. Evie adds warmth while the writing surface stays quiet.

Core promise: write immediately, find it quickly, know it saved, and take your data with you.

## Confirmed and proposed decisions

| Decision | Status |
| --- | --- |
| PWA only, responsive on phone/tablet/desktop | Confirmed |
| First prototype supports both iOS Safari and Android Chrome | Confirmed; Emily’s device is unknown; browser emulation precedes physical-device checks |
| Notes and two levels of containers | Confirmed structure; names Journals and Shelves proposed |
| Evie is the single mascot | Confirmed |
| Normal and Pixel Art visual modes | Confirmed; Normal default, Pixel offered gently |
| Local-first app assembled from maintained libraries | Recommended implementation baseline |
| 100 MB cloud attachment allowance | Proposed invited-beta policy, replacing the earlier 50 MB proposal; no service activated |
| Full end-to-end encrypted sync | Deferred decision before cloud implementation; never claim it exists |
| Cloudflare for beta infrastructure | Confirmed; add other infrastructure for demonstrated needs |
| Stripe for subscriptions | Existing UK LTD/account confirmed by owner; integration not implemented |
| Full-feature trial then paid subscription | Confirmed: three days free, then US$7.99/week or US$299.88/year, chosen upfront; first payment due at trial end. No permanent free tier. Markets/tax, retention/offline grace pending — see [GROWTH.md](GROWTH.md) |

## Five primary tasks

1. New Note → type immediately. No account, pet setup, or organization wizard.
2. Move the note into a Journal through a searchable picker. Filing is optional.
3. Group Journals on a Shelf when needed. Shelf creation is not onboarding.
4. Search title/body/tags; understand the current scope; open the matching note.
5. Export the whole library and restore it into a fresh profile, including files.

## Organization and state rules

- Every Note has one Journal. Inbox is the default Journal; it can be renamed but must have a replacement before deletion.
- A Journal has zero or one Shelf. Shelves contain Journals; no nested Shelves or loose Notes inside a Shelf.
- All Notes and Shelf contents are views, not copies. Tags are optional/flat.
- Pin, Archive, and Litter box (formerly Trash) have distinct meanings. Archived notes remain searchable when included; the litter box is excluded by default. Notes there can be restored.
- Deleting a Shelf keeps its Journals. Deleting a Journal requires an explicit choice to move its notes or put them in Trash, plus Undo.
- Visible save states: Saving; Saved on this device; Waiting to sync; Synced; Save failed; Conflict needs review. Only implement applicable states in each stage.

## Minimum useful local release

Notes/Journals/Shelves; basic rich text and checklists; transactional local saving; search; images/files; pins, Archive, Trash and recovery; complete backup/restore plus readable export; keyboard/mobile accessibility; both visual modes; app manifest/service worker once offline update behavior is safe.

Cloud sync is a separate beta stage. Local alpha writing and the public sample preview do not require sign-up; production accounts/paid entitlements follow the commercial decisions in [GROWTH.md](GROWTH.md). The earlier free-local-forever proposal is not a finalized pricing policy. Cloud quota exhaustion pauses uploads, not local editing or export; this is separate from the still-pending post-trial feature policy. Device storage is finite and browser data can be removed; explain backups without interrupting first use.

## PWA onboarding and commercial flow

Usability onboarding is part of the plan; the payment/retention funnel is in [GROWTH.md](GROWTH.md). Confirmed commercial direction: transparent landing/pricing/product preview → account → upfront choice of US$7.99/week or US$299.88/year → Stripe-hosted three-day free trial checkout → immediate real note → optional installation after useful activity. First payment is due at trial end, then recurring at the selected interval until canceled. **Buy Now** is the alternate action: skip the trial and pay the selected amount immediately, then renew at that interval. The trial is the hands-on demo; do not add a separate mandatory interactive demo funnel. Do not start the trial timer just by visiting or installing. Collect clear recurring-payment authorization. Local Test mode simulates these actions; Normal cannot activate either until secure checkout is implemented.

Educational-first baseline: land trial users in an editable Inbox note, let them write and see an honest save confirmation, then optionally file/retrieve. Aim for the first keystroke within five seconds of checkout return; measure on actual phones. Hints are contextual and skippable; no quiz, setup wizard, forced import, theme/install prompt or feature carousel before writing. Returning users resume their work. The video summary’s freemium suggestion is not selected. Core offline use remains part of trial/paid access, and AI is outside the initial offer.

## Appearance behavior

Owner's expanded prototype requirements (21 November): a useful Home screen; first-run logo/Evie introduction followed by skippable welcome, optional Journal setup and upfront plan selection; visible company from Evie with tap-hide and Settings restore; long-press/right-click note options and complete shared editor menus; muted editable-field cues, clear controls and primary-field focus. "Move to Shelf" chooses a Journal on that Shelf. User-facing Trash is now **Litter box**, with the same restore/Undo semantics.

Latest owner refinement: a silent green splash contains only Evie scratching a Journal and tucking it away, lasts about 1.5 seconds, and fades into onboarding. No visible text or Skip intro control. Welcome copy is “Take notes: Ideas, plans, everyday little things. Give them a quiet place to land, with Evie beside you.” Buttons use **Start Free Trial** and **Buy Now** in both environments. The header and contextual offer show parenthesized remaining days beneath the offer; an unstarted trial says so. Evie sleeps while browsing with a 0.6% breathing movement, wakes beside an open note, and blinks once every random 6–14 seconds. Pause animation when hidden and honor reduced motion.

Test and Normal environments are distinct from visual appearance. Fresh development profiles default to Test; fresh production-build profiles default to Normal. Test is explicitly marked at the top, uses a separate disposable demo library, and offers a hard reset from the logo/banner/Settings. Reset must never delete Normal notes. Normal mode is the user's separate local library; live accounts, billing and cloud functionality remain unimplemented and must not be implied by that label.

Normal uses cream, charcoal, ginger, and muted teal. Pixel Art changes presentation, never organization, note formatting, accessibility, or capabilities. Keep readable proportional body text in both. The preference persists on the device; later account preference syncing must not block startup.

Suggest Pixel Art once after the first successfully saved note or in Appearance settings: “Want a little pixel charm? Try Pixel Art.” Include Try and Not now, honor dismissal, and never repeat automatically after dismissal. The local app offers both looks in Settings; the separate one-time appearance nudge remains a later polish task. Reduced motion and hiding the mascot are independent settings. No guilt, streak pressure, paid skins, or extra cats.

## Outside the initial scope

Native distribution, collaboration/public sharing, full Evernote parity, AI, audio transcription, calendar/task platforms, handwriting, deeper nesting, plugin systems, and theme marketplaces. No dark-mode expansion until the two visual modes and basic flows are stable.

## Success criteria

Users can complete the five primary tasks unassisted in formative tests; no unexplained save state; full restoration preserves canonical content/relationships/file bytes; no cross-account access when cloud is added. Performance and release checks live in [DEVELOPMENT.md](DEVELOPMENT.md); ordered delivery lives in [PLAN.md](PLAN.md).
