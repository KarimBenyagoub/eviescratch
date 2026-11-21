# PWA onboarding, subscriptions, and revenue

Updated 21 November 2026. **Offer and Test simulations implemented locally; no Stripe price objects, customers, trials, checkout, emails, or charges have been created.**

## Confirmed context and open decisions

- Keep Cloudflare as the beta infrastructure: static assets/Worker, D1, private R2. Add other infrastructure only for demonstrated needs.
- Owner confirms a UK registered LTD with a working Stripe account used for more than two years. Use this existing account as the proposed payment platform; no Paddle, RevenueCat SDK, Supabase, or new payment processor is needed for the first version.
- Commercial goal is efficient, sustainable revenue alongside excellent usability. Attachment storage is secondary; Emily reportedly uses it little. Organization, writing, retrieval, and reliability are the primary value. The exact Evernote subscription restriction behind her spending is not independently verified.
- **Owner confirmed: a three-day free, fully featured trial followed by US$7.99 per week or US$299.88 per year. No permanent free tier.** Choose the interval straight away, before the trial/payment authorization. First payment is due immediately after the three-day trial ends, with recurring billing at the selected interval. Use payment-method-upfront Stripe checkout with explicit recurring-charge consent. Trial duration, prices and USD are settled; launch markets, tax setup, retention and offline grace remain to be defined. This supersedes the earlier monthly/annual proposal. Do not reopen trial duration, prices, monthly plans, or freemium by default.
- The trial itself is the hands-on product demonstration. Do not add a separate interactive pre-trial demo project that delays shipping. Local alpha development without accounts is an engineering stage, not a promise of free production access.

## What was previously planned, and what was missing

Existing PRODUCT/DESIGN covered first-use usability: write immediately, organize later, optional installation and theme preference. They did **not** include a researched acquisition-to-payment funnel, trial-length decision, renewal/cancellation communications, billing reconciliation or revenue measurement. This document fills that planning gap; it does not make those features implemented.

## Recommended first offer

One product, same core capabilities, **two billing intervals: weekly and annual**. Both get the same three-day trial and feature offer. Weekly is **US$7.99 billed every week**; annual is **US$299.88 billed every year**, charged in full. First payment is due at trial end; renew at the selected interval until canceled. State each actual charge prominently. No invented savings, false popularity badges, mandatory annual commitment, or lifetime-hosting promise.

Canonical local offer: `src/domain/offer.ts`, trialDays=3, currency=USD, weekly amount=799 cents / interval=week, annual amount=29988 cents / interval=year. Onboarding, the header and Settings use the same offer. **Start Free Trial** starts a three-day simulation in Test only; **Buy Now** simulates immediate purchase without a trial. Both store isolated demo preferences and never represent a live entitlement. Normal rejects activation until secure checkout exists. No payment method, provider trial, subscription or charge exists. Production Checkout must use server-allowlisted Stripe price IDs for these exact amounts/intervals; never trust a client amount.

The owner separately requested an internal **Test mode** with disposable demo data and a logo-to-onboarding reset, alongside a separate Normal local library. This is the same application and is not a new public pre-trial demo subsystem. After a silent 1.5-second green Evie animation, first-use screens are skippable. Neither environment performs live billing; Normal does not mean production services are connected. Demo timestamps are ignored in Normal, even if copied into its preferences. A simulated trial shows remaining whole days rounded up, capped at three and floored at zero. Unstarted trials say “(Trial not started)”; a simulated purchase shows the selected active plan instead. Live remaining time must use provider-confirmed entitlement state.

The owner removed the generic exact-dates/taxes reminder from prototype screens. Actual live checkout still needs the real charge amount, cadence, date and applicable tax treatment. Buy Now must clearly disclose the immediate amount, renewals and absence of a trial before payment authorization.

Users choose their eventual paid billing interval **before** authorizing the trial subscription at checkout. Show a concise real-product preview and transparent pricing on the landing page; avoid a separate demo registration or duplicated pricing wizard. After checkout, the three-day trial is the real product experience.

Confirmed initial trial: **three days**, measured from the provider-confirmed start timestamp to the exact provider-defined end timestamp, displayed clearly. The previous seven-day recommendation is superseded by the owner’s decision. Validate the short-trial checkout, reminder and cancellation behavior before launch; do not silently lengthen the offer.

Never advertise features that do not yet exist as included in a “fully featured” trial. Full access means the shipping product’s capabilities within clearly disclosed attachment/usage limits, not unlimited files or planned integrations.

## Proposed PWA onboarding funnel

### Educational-first refinement from the owner’s video summary

The owner supplied a summary of [this indie-developer video](https://www.youtube.com/watch?v=Z0b4RN84uwc) favoring educational/hybrid onboarding for utility apps. The video itself could not be retrieved by the research browser; the following incorporates the supplied summary, not a verified transcript or a measured conversion claim.

Use **learning through action**: open a note → write one sentence → see a truthful local-save confirmation → optionally file it in a Journal → retrieve it. Aim for first useful writing within seconds. Offer a skip for hints, reveal one contextual hint at a time, and avoid a feature-list carousel, mandatory profiling questions, or compulsory organization setup. Frame the benefit as scattered thoughts becoming easy-to-find notes, without promising a life transformation we have not validated.

Keep the educational advice, but the owner has now chosen the **three-day trial-to-paid model**, not the summary’s freemium suggestion. Offline capture/retrieval is part of the trial and paid PWA experience; do not make it a confusing extra add-on. Do not add AI merely to create something to charge for. Paid access does not justify arbitrary Journal limits or withholding existing notes/export.

### Immediate-value acceptance contract

- Before checkout: one concise benefit statement, real product preview and clear trial/renewal terms. No feature carousel, use-case quiz, forced import, theme choice, pet setup, installation or notification request. Offer one primary trial action. The account/checkout flow must preserve the return destination and avoid duplicate identity entry.
- After confirmed trial activation: land directly in a clean editable note in Inbox. Focus the writing area on a fresh activation while respecting browser/mobile keyboard restrictions; never steal focus from resumed work. A short placeholder can say “What would you like to remember?” It must not be saved as the user’s content.
- First value target: let the user begin writing within **five seconds of returning from checkout** on the reference device/network; show Saved only after real local commit. This is a target to measure, not a current claim.
- After the first save, one dismissible hint: “Keep it in Inbox, or choose a Journal.” Creating/choosing a Journal should not require learning Shelves. Next, offer a short contextual search/retrieval hint only when useful. No checklist blocks the editor or demands a contrived task.
- Track first-note activation (a real committed note) separately from deeper activation (file or deliberately keep in Inbox, then retrieve). Do not force filing/search just to count a successful onboarding. Preserve drafts and undo through navigation, theme changes, checkout return and recovery.
- Return visits reopen the last useful context, not a welcome screen. Existing users can skip all hints. Storage/save/network failure messages have a direct recovery action; never use optimistic Saved/Synced labels to make onboarding look smoother.
- Sequence prompts: save first; teach only the next relevant action; offer installation after useful activity; offer Pixel Art later as a separate dismissible choice. Honor dismissal and do not stack prompts. No push request as a condition of access.
- Trial time remaining and Manage subscription are easy to find but do not dominate writing. Reminder and cancellation communications stay explicit. Expiry never deletes a draft or makes export a payment hostage.
- Formative verification: observe first-time users on actual phones without coaching; measure return-to-first-keystroke, time to committed note, errors/abandonment, next-day return and retrieval success. Test keyboard/zoom/reduced motion and interrupted checkout. Do not call the flow “best” based only on a screenshot or conversion count.

1. **Landing:** explain the actual problem solved: simple notes, flexible Journals/Shelves, fast search and reliable offline use once implemented. Show a realistic mobile screen, transparent price, three-day trial terms and one primary Start free trial action. No unverified speed claims or Evernote savings figures.
2. **Brief value preview:** use a real screenshot or short in-page preview; no separate mandatory interactive-demo funnel. The three-day trial is the hands-on demo. Do not start the subscription clock on a landing visit.
3. **Account:** minimal identity flow, with consented association of any local draft to the correct account. Accounts are required for subscription ownership and cloud sync, not for rendering the public demo. Avoid repeated identity entry where Stripe can receive a verified customer email.
4. **Choose weekly/annual:** US$7.99/week or US$299.88/year, the same benefits, three days free, explicit first-charge date/time and cancellation route. Neither interval is preselected in the first local offer view. Recommend neither price nor interval using a fabricated popularity claim.
5. **Stripe-hosted Checkout:** collect a supported recurring payment method and clear agreement to recurring billing. Complete trial subscription creation on the server/provider. The trial starts at the provider-confirmed timestamp, not page visit, PWA installation, or an untrusted local timer.
6. **Activate:** return to the app, reconcile the subscription server-side, then land directly in a real note. Guide only the next useful action: create a note → file it → retrieve it. No long tutorial carousel. Keep paid access pending rather than assuming success from a return URL.
7. **Install later:** offer Add to Home Screen after a successful first save or subsequent meaningful use, not before checkout and not as a condition for using the web app. Use supported install prompts; provide browser-appropriate instructions on iOS. Keep notification permission separate and optional. Do not stack installation, theme, and notification prompts at once.
8. **Retention and billing clarity:** show days remaining discreetly, provide Manage subscription from day one, deliver required confirmation/reminder/receipt messages, and give a relevant help path. Pixel Art is a one-time optional nudge after value, not a prerequisite for activation.

Do not require PWA installation to subscribe. Payment happens through ordinary web checkout; merely installing/uninstalling the PWA neither starts nor cancels a subscription. Explain cancellation in the app and billing emails.

## Automatic billing: exact meaning

Automatic first payment is possible when a recurring payment method and authorization were collected and the subscription has not been canceled. The provider attempts the first charge when the trial ends; payment can fail or require customer authentication. Never mark the customer successfully paid merely because the scheduled date passed.

A cardless trial requires a later payment step. No card/payment method on file means no automatic charge. Do not mix “no payment details required” marketing with an automatic-charge promise.

Required checkout copy, with actual values substituted only after approval:

> Try all advertised features free for 3 days. Then US$7.99 per week or US$299.88 per year, according to your selected plan, starting [provider-confirmed trial-end date/time]. Renews automatically at that interval until canceled. Cancel before the trial ends in Manage subscription to avoid the first charge. [Clear tax treatment and usage limits.]

Use Stripe Checkout, Stripe Billing, and Stripe’s customer portal rather than custom card forms, custom subscription collection, or a second billing service. Preserve access until the communicated trial/paid-through date when cancellation is scheduled. Keep cancellation easy to locate, confirm it, and ensure cancel-before-deadline actually prevents the charge.

Trial confirmation and upcoming-charge reminders need verified delivery and timing. Short trials have less time for notice; do not assume a one-day reminder is universally sufficient. Validate the chosen three-day automatic-conversion flow against current Stripe/card-network and launch-market requirements before activation. Provider tooling is not blanket legal/tax compliance. An existing Stripe account does not mean trial emails, customer portal, Stripe Billing, or tax settings are already configured.

## Trust and post-trial behavior

During the shipping trial, all advertised functionality works subject to disclosed limits. After cancellation/expiry without a paid entitlement, allow reading existing local notes, exporting a complete local copy, subscription management and deleting account data. Never encrypt/delete/withhold a user’s existing notes to obtain payment. Define cloud-file export/download availability and retention explicitly before sales.

New writing and other subscribed capabilities require a current trial or paid entitlement after the trial. Disclose this before signup. Finish/recover an in-progress edit safely, retain unsynced content, and explain the transition. Existing-note reading/export remains available; precise cloud retention and offline grace must be defined before sales. The prior free-local-writing proposal is superseded. Do not let cloud attachment quota errors masquerade as subscription expiry.

Offline entitlement handling must respect the app’s offline promise. Design a bounded cached entitlement/grace policy before billing enforcement; temporary inability to reach Stripe/our API must not destroy drafts or abruptly interrupt an active editor. Do not rely solely on localStorage or the device clock for paid access. A browser client cannot provide tamper-proof DRM; protect paid server resources while prioritizing legitimate users and recovery.

## Minimal billing architecture on Cloudflare

- Worker endpoints create authenticated Checkout and customer-portal sessions. Keep price IDs allowlisted on the server; never accept an arbitrary amount or customer ID from the client.
- Store provider customer/subscription IDs, status, trial end, interval and paid-through timestamps in D1, scoped to our user ID. Store no card data. Stripe is the billing authority; D1 is a reconciled local entitlement projection.
- Verify webhook signatures against raw request bytes. Process duplicates idempotently, tolerate event reordering, and fetch authoritative state when needed. Test creation, trial end, cancellation, failed/action-required payments, later recovery, refunds and disputes.
- A zero-value trial invoice is not collected revenue. Checkout completion is not proof of a successful later charge. Use invoice/subscription state together for entitlements and revenue recognition appropriate to the accounting model.
- Add a reconciliation route/job for missed webhooks. Show pending/error states rather than creating duplicate subscriptions after a retry. Prevent multiple simultaneous active subscriptions per user through server-side logic.
- Configure test-mode Checkout/portal, time-advanced trial tests, confirmation/reminder emails and failed-payment recovery before requesting any live billing change.
- Start with Stripe’s available customer emails/portal, validating their actual behavior. Add an external mail or analytics service only if a concrete gap remains. Payment/Billing/Tax transaction fees are operating costs to include, not free Cloudflare services.
- Stripe is a payment platform, not automatically a merchant-of-record arrangement for all sales. Establish actual customer countries, tax responsibilities, prices/tax display and applicable consumer terms before launch. Do not infer a complete legal answer from the LTD’s location alone.

## Efficient revenue measurement

The goal is retained net revenue, not the shortest time to an accidental first charge. Track a small, privacy-conscious event funnel without note content: landing/demo, account completion, offer view, selected interval, checkout start, provider-confirmed trial start, activation, return visit, successful first payment, cancellation, refund/dispute and renewal.

Define activation initially as writing and saving a real note, organizing it or explicitly choosing Inbox, then retrieving it. Measure return use separately; do not invent activity to satisfy a metric. Start with bounded aggregated/consented events on our existing stack, consistent with launch-market privacy obligations. No advertising pixels or content capture by default.

Use consistent cohort denominators and observation windows:

- Visitor → trial and visitor → successfully paying customer, not only trial → paid.
- First-payment rate after the whole trial plus a defined payment-recovery window.
- Net receipts after refunds/disputes, processing/Billing costs, hosting and support; distinguish annual upfront cash from monthly recurring revenue.
- Paid retention, second renewal and D30/D60/D90 net revenue per acquisition cohort.
- Customer acquisition cost/payback only when acquisition spend exists; early organic interviews are not proof of paid-ad economics.

Start with one offer and user interviews. Do not split a tiny beta into many underpowered price/trial tests. Later test one major variable at a time, with a predeclared observation window, retention/refund guardrails and enough data. Annual plans need longer follow-up than their first payment to judge retention.

## Evidence reviewed and limits

- [RevenueCat State of Subscription Apps 2026](https://www.revenuecat.com/state-of-subscription-apps/): observational aggregated subscription-app data across multiple categories/platforms. Reports higher median trial-to-paid conversion for longer trial groups. It does not establish that seven days causally beats three for a new notes PWA, nor that a higher trial-to-paid rate maximizes visitor-to-paid or long-term profit. Web tactics and native/in-app funnels must not be conflated. No precise conversion forecast is adopted here.
- [Stripe trial documentation](https://docs.stripe.com/billing/subscriptions/trials) and [Checkout free-trial entry point](https://docs.stripe.com/payments/checkout/free-trials): trial and automatic paid-transition capabilities. The current general page also describes newer Trial Offers with integration/version restrictions; implement a stable supported Checkout free-trial flow for this account rather than assuming every new API works in Checkout.
- [Stripe subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks): asynchronous subscription lifecycle and signature-verification requirements.
- [Stripe customer portal](https://docs.stripe.com/customer-management): existing subscription/payment/invoice management tools.
- [Stripe recurring-billing guidance](https://support.stripe.com/questions/guidance-for-mastercard-recurring-billing-compliance-updates): terms, receipts, cancellation instructions and reminder configuration must be reviewed for the actual trial/interval/market. This is not a complete jurisdiction-specific legal assessment.
- [web.dev PWA installation guidance](https://web.dev/learn/pwa/installation-prompt), [MDN installation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing): browser-specific installation behavior; do not promise a universal install prompt or treat installation as a payment mechanism.

## Decisions before a paid trial launch

1. Configure/test the confirmed three-day free trial with US$7.99/week and US$299.88/year price objects and first payment due at trial end; finalize cloud retention and offline grace. Prices and intervals do not need to be chosen again.
2. Confirm first customer countries, currencies, tax display and offer/cancellation terms.
3. Validate the existing account’s Checkout/Billing/portal/payment-method support and reminder delivery in test mode. No secret keys in files/chat; no live account changes in this planning task.
4. Agree post-trial reading/export, cloud retention and offline grace; test interrupted drafts.
5. Complete reliable save, retrieval, native backup/restore, sync if advertised, and billing-state tests before taking customers’ money. Invited reliability testing may precede paid commercial testing; label the cohorts separately.
