# Phases 0 to 11
- [x] Remove retired inputs/panels; add atomic timeline, capital, revenue, risk, technical and structured public-funding writes
- [x] Add recorded asked_fields/form_version, stage specification, central resolver and core absence tests
- [ ] Complete absence coverage, conditional-field stamps, completeness counter and mechanical tab provenance enforcement
- [ ] Complete publish/readback verification and rollback-only failure tests
- [ ] Integrate simple payback: pure formula tested; operational actuals and projected revenue/opex sources are not yet present
- [ ] Emissions, lifetime/cars and committed-capital calculations: blocked by absent sourced country factors and unspecified lifetime/car/commitment definitions
- [x] Phase 0: close direct project reads, secure the teaser projection and audit consumers
- [x] Phase 0B: deactivate unapproved advisors and disable unrecorded assistance submissions
- [ ] Phase 1: typed absence, field provenance and publish payload coverage
- [ ] Phase 2: stage-aware wizard, drafts, editing and promotion
- [ ] Phase 3: low-completion listing pages, following and private Q&A
- [ ] Phase 4: evidence filters and null-safe financial-close sorts
- [ ] Phase 5: independent subscription gate, sourced country/benchmark libraries and PDFs
- [ ] Phase 6: bilateral overview work queue
- [ ] Phase 7: funding coverage, verification, programme detail and contact requests
- [ ] Phase 8: consented advisor directory and recorded contact pathway
- [ ] Phase 9: scoped news placement and source health
- [ ] Phase 10: portfolio view with factual aggregates and sequential interests
- [ ] Phase 11: investing and listing pipeline/closed dashboards

Stop at the first unsafe or externally blocked prerequisite and report it explicitly. The uploaded brief contains conflicting subscription/access wording; resolve that before phase 3 changes the gate. Phase 5 also needs the annual price and currency. No invented country sources, advisor agreements or closed-position figures.

Current checkpoint: phases 0 and 0B applied and verified. Anonymous exact-project queries return zero rows while all nine teasers remain available; ticket sort returns only band ordinals. Opportunities, Overview, Bundle builder and the empty advisor directory opened under the requesting member's session.

Phase 0 audit: owner-scoped readers are DeveloperDashboard, AccessRequests, DataRoomRequests and funding.useOwnProjects. Accepted-only readers are loadDisclosedProject, useProjectListings, BundleBuilder and MCP get_project. MarketNews and MCP add_to_watchlist were switched to teasers. InvestorDashboard still asks for exact rows for pending/watchlisted IDs: database RLS now filters them, but its pending-row presentation needs to use teasers during the later dashboard rebuild. News ingestion is privileged server-side matching, not a member read.

Phase 1 partial checkpoint: migrations 0023 and 0024 add recorded questions and atomic row writes including structured public funding. Retired governance/capitalisation/process panels, NPV and SFDR/SDG displays are removed. Break-even values, transaction ticket/equity and renewable share are wired. Sixteen targeted tests and hygiene passed; the signed-in wizard accepted timeline, capital and funding inputs without publishing. Full save/readback is not verified. Absence coverage, conditional question tracking, completeness and mechanical provenance enforcement remain unfinished. Generation tags are omitted rather than invented until a sourced classification rule is available. Phases 2 to 11 have not started.

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
