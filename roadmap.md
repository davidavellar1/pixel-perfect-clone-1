# Profile settings
- [x] Account menu and first-name/avatar display
- [x] Profile schema, backfill, and avatar storage access
- [x] Settings forms, independent saves, account details and unsaved warnings
- [x] Signed-in save/read verification, validation tests and responsive checks
- [ ] Public avatars: blocked by workspace public-bucket policy; private owner-visible fallback
- [ ] Legal document links: existing legal pages are missing; show acceptance history and support link instead
- [ ] Account-deletion cleanup: platform policy prohibits auth.users reference or deletion trigger for user_profile

# Payments
- [ ] Enable Stripe after user confirmation; no payment integration changes yet

# Gate workflow
- [x] Oldest-first decision queue and sticky actions
- [x] Investor replies, shared SLA and bilateral lapse notifications
- [x] Remove auto-accept reads and controls
- [x] Compatible mandate profile, once-only onboarding and editable prefill
- [x] Informational fit before submission and truthful workspace overview
- [x] Versioned agreement evidence, electronic consents and required qualification
- [ ] Full signed submission and developer decision verification: requires authorized test signatories on both sides
- [x] Verify onboarding, fit, signing safeguards, settings and rule tests

# Frontend hygiene
- [x] Semantic token sweep and enforced colour/dash checks
- [x] Null-safe financial, transaction and blank-project sections
- [x] Light-only Sonner and removal of legacy toasts
- [x] Current sidebar primitive, mobile drawer and per-user persistence
- [x] Accessible validated expression-of-interest form and dialog navigation
- [x] Labelled opportunity filters, sorting, clear actions and loading skeletons
- [x] Truthful dashboard metrics and single project interest action
- [x] Consistent workspace width and accessible wizard fields
- [x] Regression tests, signed-in desktop/mobile checks and commit

# Disclosure fixes
- [x] Gate investor-grade queries and locked DOM/hero figures
- [x] Read teaser-only data for unapproved detail/listing viewers and update card metrics
- [x] Restrict MCP output, redirect public project detail, and update robots
- [x] Verify disclosure behavior, tests, and compilation without database changes

# Figure corrections
- [x] Remove fabricated public figures and use real teasers
- [x] Gate case-labelled bundle returns and remove legacy KPI
- [x] Replace invented structure, compliance and chart data
- [x] Correct fee wording and design-load ladder
- [x] Test and verify without database changes

# Funnel cleanup
- [x] Consolidate legacy signup and marketing routes with preserved destinations
- [x] Add legal placeholders and password recovery pages
- [x] Canonical links, locked account CTA and public skip link
- [x] Remove unused landing, portfolio and demo code
- [x] Verify navigation, recovery validation and mobile signup access

# Independent review corrections
- [x] Validate semantic tokens and workspace utilities
- [x] Remove invented public examples and legacy project dataset
- [x] Restore bilateral lapse notices and escalation
- [x] Correct signature disclosure and granted bundle figures
- [x] Fix numeric funding, metadata and case-only return entry
- [x] Refresh types, run regression tests and verify preview

# Incomplete migration history

A rebuild from `drizzle/migrations/` alone will not reproduce the current database. Migration 0019 is missing. Out-of-band objects without migration definitions include `private.lock_access_request_evidence`, `private.block_logged_introduction_delete`, `private.can_read_project_object`, `public.record_legal_acceptance`, `public.access_event` and `private.log_access_event`.

The access gate, data room fix, `project_teaser` view and signature evidence are archived in `drizzle/manual/0023_disclosure_gate_and_signature_evidence.sql`. This archive is not registered in the journal and must be applied by hand after a rebuild.

Migration-history inspection also reports files 0020 to 0022 as unlisted and database bookkeeping as invalid, with no automatic repair available. A human must reconcile this history before anyone relies on a from-scratch rebuild.

- [ ] Append the supplied auto-accept removal statement and correct the archive header: blocked by file protection covering `drizzle/manual/` as well as `drizzle/migrations/`.

# Batch 8 public design audit
- [x] Contrast, public focus, button consistency and heading scale
- [x] Home alignment, listing states and verbatim fee line
- [x] Signup destinations, public wording and evidence disclosure
- [x] Verify IRR and numeric-money leftovers, hygiene and browser checks

# Batch 9 public re-audit
- [x] Preserve home button variant colors and darken primary tokens
- [x] Correct account links, checkbox naming and signup panel contrast
- [x] Fit the signup action into the initial mobile screen
- [x] Unify public secondary buttons and cap mobile stat type
- [x] Measure browser contrast, check all home buttons and run hygiene

# Batch 10 layout re-audit
- [x] Reserve two computed title lines in shared project cards
- [x] Use solid primary for the translucent public step badge
- [x] Verify public and signed-in cards at 320, 375 and 1440 widths and run hygiene

# Batch 12 account error handling
- [x] Inline signup and sign-in errors, retry-state cleanup and edit-to-clear behavior
- [x] Keep password recovery alerts readable and use shared error classification
- [x] Reproduce real rejected-email response, verify mobile action visibility and run tests and hygiene

# Batch 14 developer gate findings
- [x] Anonymize investor notices before acceptance and clarify data room approval
- [x] Omit absent review values and distinguish gated data from absent data
- [x] Move mandate review to Express interest only
- [x] Verify notices in rolled-back transactions, owner workspace in browser, simulated locked tabs, tests and hygiene
