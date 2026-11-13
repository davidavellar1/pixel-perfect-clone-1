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
