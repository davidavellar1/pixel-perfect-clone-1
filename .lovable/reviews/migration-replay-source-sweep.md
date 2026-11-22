# App-wide replay source inventory - 2026-11-22

Rule: rebuilding from registered history must reproduce the live application schema and its access rules.

This is a static source/catalogue inventory, not a scratch/live diff. All migration SQL and manual archives were scanned for explicit definitions; source files were scanned for literal database references. A definition being present does not prove its final schema, policy, grants or runtime behavior matches production. Dynamic SQL, transitive imports and non-literal client calls require additional verification. No production records, access settings or example rows were changed.

## Live table coverage

| Live table | Baseline source | Replay status |
|---|---|---|
| `access_event` | No CREATE TABLE definition found in scanned SQL | No explicit baseline in registered history |
| `access_request` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered baseline found; parity unverified |
| `access_request_answers` | `drizzle/migrations/0004_dhc_access_lifecycle.sql` | Registered baseline found; parity unverified |
| `advisor` | `drizzle/migrations/0010_advisor_and_project_advisor.sql` | Registered baseline found; parity unverified |
| `answer` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered baseline found; parity unverified |
| `bundle` | `drizzle/manual/0023_bundles.sql` | No explicit baseline in registered history |
| `bundle_item` | `drizzle/manual/0023_bundles.sql` | No explicit baseline in registered history |
| `capital_stack_item` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered baseline found; parity unverified |
| `construction_package` | `drizzle/migrations/0003_dhc_transaction_process_construction_cases.sql` | Registered baseline found; parity unverified |
| `contact_request` | `drizzle/migrations/0033_catalogue_contact_requests_and_verified_amount_basis.sql` | Registered baseline found; parity unverified |
| `cron_token` | `drizzle/migrations/0008_cron_token_table.sql` | Registered baseline found; parity unverified |
| `developer_profiles` | `drizzle/migrations/0000_dhc_profiles_and_signup_trigger.sql` | Registered baseline found; parity unverified |
| `document` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered baseline found; parity unverified |
| `document_access_grant` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered baseline found; parity unverified |
| `energy_mix_item` | `drizzle/migrations/0011_technical_detail_tables.sql` | Registered baseline found; parity unverified |
| `financial_summary` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered baseline found; parity unverified |
| `funding_call` | `drizzle/manual/0024_funding_catalogue.sql` | No explicit baseline in registered history |
| `funding_change_log` | `drizzle/manual/0024_funding_catalogue.sql` | No explicit baseline in registered history |
| `funding_coverage` | `drizzle/manual/0024_funding_catalogue.sql` | No explicit baseline in registered history |
| `funding_programme` | `drizzle/manual/0024_funding_catalogue.sql` | No explicit baseline in registered history |
| `investor_profiles` | `drizzle/migrations/0000_dhc_profiles_and_signup_trigger.sql` | Registered baseline found; parity unverified |
| `legal_acceptance` | No CREATE TABLE definition found in scanned SQL | No explicit baseline in registered history |
| `listing_access_criteria` | `drizzle/migrations/0004_dhc_access_lifecycle.sql` | Registered baseline found; parity unverified |
| `margin_profile` | `drizzle/migrations/0003_dhc_transaction_process_construction_cases.sql` | Registered baseline found; parity unverified |
| `member_message` | `drizzle/migrations/0022_support_feedback.sql` | No explicit baseline in registered history |
| `milestone` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered baseline found; parity unverified |
| `nda_document_version` | `drizzle/manual/0023_disclosure_gate_and_signature_evidence.sql` | No explicit baseline in registered history |
| `nda_signature` | `drizzle/migrations/0003_dhc_transaction_process_construction_cases.sql` | Registered baseline found; parity unverified |
| `news_fetch` | `drizzle/migrations/0021_news_fetch_via_db.sql` | No explicit baseline in registered history |
| `news_item` | `drizzle/migrations/0020_market_news.sql` | No explicit baseline in registered history |
| `news_source` | `drizzle/migrations/0020_market_news.sql` | No explicit baseline in registered history |
| `notification` | `drizzle/migrations/0007_notifications_and_access_events.sql` | Registered baseline found; parity unverified |
| `offtake_ladder` | `drizzle/migrations/0003_dhc_transaction_process_construction_cases.sql` | Registered baseline found; parity unverified |
| `operating_parameter` | `drizzle/migrations/0011_technical_detail_tables.sql` | Registered baseline found; parity unverified |
| `organization` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered baseline found; parity unverified |
| `project` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered baseline found; parity unverified |
| `project_advisor` | `drizzle/migrations/0010_advisor_and_project_advisor.sql` | Registered baseline found; parity unverified |
| `project_case` | `drizzle/migrations/0003_dhc_transaction_process_construction_cases.sql` | Registered baseline found; parity unverified |
| `project_interest` | `drizzle/migrations/0002_dhc_interest_grants_and_document_sync.sql` | Registered baseline found; parity unverified |
| `project_process` | `drizzle/migrations/0003_dhc_transaction_process_construction_cases.sql` | Registered baseline found; parity unverified |
| `project_stage_event` | `drizzle/migrations/0025_stage_wizard_drafts_editing_and_history.sql` | Registered baseline found; parity unverified |
| `project_submission_work` | `drizzle/migrations/0026_private_stage_edit_working_copies.sql` | Registered baseline found; parity unverified |
| `project_transaction` | `drizzle/migrations/0003_dhc_transaction_process_construction_cases.sql` | Registered baseline found; parity unverified |
| `public_funding` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered baseline found; parity unverified |
| `question` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered baseline found; parity unverified |
| `revenue_stream` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered baseline found; parity unverified |
| `risk` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered baseline found; parity unverified |
| `sdg_alignment` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered baseline found; parity unverified |
| `subscription` | `drizzle/migrations/0030_separate_subscription_and_identity_disclosure.sql` | Registered baseline found; parity unverified |
| `sustainability_profile` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered baseline found; parity unverified |
| `technology_card` | `drizzle/migrations/0011_technical_detail_tables.sql` | Registered baseline found; parity unverified |
| `user_news_preference` | `drizzle/migrations/0020_market_news.sql` | No explicit baseline in registered history |
| `user_profile` | `drizzle/migrations/0016_profile_settings.sql` | Registered baseline found; parity unverified |
| `user_role` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered baseline found; parity unverified |
| `watchlist_item` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered baseline found; parity unverified |

## Live function coverage

Names below are inventoried from the live catalogue. Only specifically retrieved definitions were read semantically: news/support helpers in the primary audit, and access evidence, introduction deletion, access logging, document grant inheritance/synchronization, access checks and legal recording during this sweep. Remaining entries are source coverage only, not certified function equivalence.

| Live function | Definition source or generation | Status |
|---|---|---|
| `private.block_evidence_change` | No explicit definition found in scanned SQL | Unregistered or absent foundation; inspect generation/renaming before repair |
| `private.block_logged_introduction_delete` | No explicit definition found in scanned SQL | Unregistered or absent foundation; inspect generation/renaming before repair |
| `private.bundle_item_guard` | `drizzle/manual/0023_bundles.sql` | Unregistered or absent foundation; inspect generation/renaming before repair |
| `private.can_read_project_object` | `drizzle/migrations/0013_fix_helper_schema_references.sql` | Registered source found; parity unverified |
| `private.can_see_question` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql`; `drizzle/migrations/0005_harden_access_decisions_and_definer_functions.sql` | Registered source found; parity unverified |
| `private.developer_of_access_request` | `drizzle/migrations/0004_dhc_access_lifecycle.sql`; `drizzle/migrations/0005_harden_access_decisions_and_definer_functions.sql`; `drizzle/migrations/0013_fix_helper_schema_references.sql` | Registered source found; parity unverified |
| `private.enforce_access_request_decision` | `drizzle/migrations/0005_harden_access_decisions_and_definer_functions.sql`; `drizzle/migrations/0013_fix_helper_schema_references.sql` | Registered source found; parity unverified |
| `private.enforce_document_grant_approval` | `drizzle/migrations/0005_harden_access_decisions_and_definer_functions.sql`; `drizzle/migrations/0013_fix_helper_schema_references.sql` | Registered source found; parity unverified |
| `private.financial_summary_is_listed` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered source found; parity unverified |
| `private.funding_close_expired` | `drizzle/manual/0024_funding_catalogue.sql` | Unregistered or absent foundation; inspect generation/renaming before repair |
| `private.funding_upsert_call` | `drizzle/manual/0024_funding_catalogue.sql` | Unregistered or absent foundation; inspect generation/renaming before repair |
| `private.funding_upsert_programme` | `drizzle/manual/0024_funding_catalogue.sql`; `drizzle/manual/0025_qa_and_application_mode.sql` | Unregistered or absent foundation; inspect generation/renaming before repair |
| `private.handle_new_investor` | `drizzle/migrations/0000_dhc_profiles_and_signup_trigger.sql` | Registered source found; parity unverified |
| `private.has_project_access` | `drizzle/manual/0025_qa_and_application_mode.sql` | Unregistered or absent foundation; inspect generation/renaming before repair |
| `private.has_role` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql`; `drizzle/migrations/0005_harden_access_decisions_and_definer_functions.sql` | Registered source found; parity unverified |
| `private.inherit_project_document_access` | `drizzle/migrations/0002_dhc_interest_grants_and_document_sync.sql`; `drizzle/manual/0023_disclosure_gate_and_signature_evidence.sql` | Registered source found; parity unverified |
| `private.investor_notification_title` | `drizzle/migrations/0021_protect_investor_notification_identity.sql` | Registered source found; parity unverified |
| `private.lock_access_request_evidence` | `drizzle/manual/0023_disclosure_gate_and_signature_evidence.sql` | Unregistered or absent foundation; inspect generation/renaming before repair |
| `private.log_access_event` | No explicit definition found in scanned SQL | Unregistered or absent foundation; inspect generation/renaming before repair |
| `private.nda_signature_immutable` | No explicit definition found in scanned SQL | Unregistered or absent foundation; inspect generation/renaming before repair |
| `private.notify_admins_member_message` | `drizzle/migrations/0022_support_feedback.sql` | Unregistered or absent foundation; inspect generation/renaming before repair |
| `private.owns_access_request` | `drizzle/migrations/0004_dhc_access_lifecycle.sql`; `drizzle/migrations/0005_harden_access_decisions_and_definer_functions.sql` | Registered source found; parity unverified |
| `private.owns_document` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql`; `drizzle/migrations/0005_harden_access_decisions_and_definer_functions.sql` | Registered source found; parity unverified |
| `private.owns_financial_summary` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql`; `drizzle/migrations/0005_harden_access_decisions_and_definer_functions.sql` | Registered source found; parity unverified |
| `private.owns_project` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql`; `drizzle/migrations/0005_harden_access_decisions_and_definer_functions.sql`; `drizzle/migrations/0006_fix_owns_project_guard_and_public_read_grants.sql` | Registered source found; parity unverified |
| `private.owns_sustainability` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql`; `drizzle/migrations/0005_harden_access_decisions_and_definer_functions.sql` | Registered source found; parity unverified |
| `private.project_is_listed` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered source found; parity unverified |
| `private.queue_news_fetch` | `drizzle/migrations/0021_news_fetch_via_db.sql` | Unregistered or absent foundation; inspect generation/renaming before repair |
| `private.stamp_nda_signature` | `drizzle/migrations/0005_harden_access_decisions_and_definer_functions.sql` | Registered source found; parity unverified |
| `private.storage_project_id` | No explicit definition found in scanned SQL | Unregistered or absent foundation; inspect generation/renaming before repair |
| `private.sustainability_is_listed` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered source found; parity unverified |
| `private.sync_project_document_grants` | `drizzle/migrations/0002_dhc_interest_grants_and_document_sync.sql`; `drizzle/manual/0023_disclosure_gate_and_signature_evidence.sql` | Registered source found; parity unverified |
| `public.answer_question` | `drizzle/migrations/0029_private_questions_and_stage_follow_notices.sql`; `drizzle/manual/0025_qa_and_application_mode.sql` | Registered source found; parity unverified |
| `public.claim_signup_role` | `drizzle/migrations/0012_claim_signup_role_rpc.sql` | Registered source found; parity unverified |
| `public.contact_decision_guard` | `drizzle/migrations/0033_catalogue_contact_requests_and_verified_amount_basis.sql` | Registered source found; parity unverified |
| `public.contact_request_inbox` | `drizzle/migrations/0034_admin_contact_queue_context.sql` | Registered source found; parity unverified |
| `public.decline_question` | `drizzle/migrations/0029_private_questions_and_stage_follow_notices.sql` | Registered source found; parity unverified |
| `public.investor_document` | Generated from subscriber functions by registered 0038 | Generation code read; full replay unverified |
| `public.investor_document_index` | Generated from subscriber functions by registered 0038 | Generation code read; full replay unverified |
| `public.investor_project` | Generated from subscriber functions by registered 0038 | Generation code read; full replay unverified |
| `public.is_qualified_investor` | `drizzle/migrations/0038_replace_paid_gate_with_investor_qualification.sql` | Registered source found; parity unverified |
| `public.is_subscriber` | `drizzle/migrations/0030_separate_subscription_and_identity_disclosure.sql`; `drizzle/migrations/0038_replace_paid_gate_with_investor_qualification.sql` | Registered source found; parity unverified |
| `public.lock_matched_request_instruments` | `drizzle/migrations/0036_equity_like_investor_preferences.sql` | Registered source found; parity unverified |
| `public.member_message_inbox` | `drizzle/migrations/0022_support_feedback.sql` | Unregistered or absent foundation; inspect generation/renaming before repair |
| `public.news_claim_fetched` | `drizzle/migrations/0021_news_fetch_via_db.sql` | Unregistered or absent foundation; inspect generation/renaming before repair |
| `public.news_source_health` | `drizzle/migrations/0020_market_news.sql` | Unregistered or absent foundation; inspect generation/renaming before repair |
| `public.notify_access_request_event` | `drizzle/migrations/0007_notifications_and_access_events.sql`; `drizzle/migrations/0021_protect_investor_notification_identity.sql` | Registered source found; parity unverified |
| `public.notify_gate_followup` | `drizzle/migrations/0018_gate_mandate_and_notifications.sql` | Registered source found; parity unverified |
| `public.notify_question_event` | `drizzle/migrations/0021_protect_investor_notification_identity.sql`; `drizzle/manual/0025_qa_and_application_mode.sql` | Registered source found; parity unverified |
| `public.notify_stage_followers` | `drizzle/migrations/0029_private_questions_and_stage_follow_notices.sql` | Registered source found; parity unverified |
| `public.preview_investor_document` | `drizzle/migrations/0039_finalize_qualified_depth_and_independent_identity.sql` | Registered source found; parity unverified |
| `public.project_discovery_rows` | `drizzle/migrations/0035_safe_discovery_evidence_and_banded_equity.sql` | Registered source found; parity unverified |
| `public.project_identity` | `drizzle/migrations/0039_finalize_qualified_depth_and_independent_identity.sql` | Registered source found; parity unverified |
| `public.project_owner_user_id` | `drizzle/migrations/0007_notifications_and_access_events.sql` | Registered source found; parity unverified |
| `public.project_pdf_inputs` | `drizzle/migrations/0039_finalize_qualified_depth_and_independent_identity.sql` | Registered source found; parity unverified |
| `public.project_teaser_rows` | `drizzle/migrations/0022_gate_project_and_redact_teaser_sort.sql` | Registered source found; parity unverified |
| `public.publish_project` | `drizzle/migrations/0015_atomic_publish_project.sql`; `drizzle/migrations/0023_submission_question_evidence_and_rows.sql` | Registered source found; parity unverified |
| `public.question_response_record` | `drizzle/migrations/0029_private_questions_and_stage_follow_notices.sql` | Registered source found; parity unverified |
| `public.record_legal_acceptance` | No explicit definition found in scanned SQL | Unregistered or absent foundation; inspect generation/renaming before repair |
| `public.save_stage_listing` | `drizzle/migrations/0025_stage_wizard_drafts_editing_and_history.sql` | Registered source found; parity unverified |
| `public.set_updated_at` | `drizzle/migrations/0001_dhc_core_marketplace_schema.sql` | Registered source found; parity unverified |
| `public.subscriber_document` | `drizzle/migrations/0030_separate_subscription_and_identity_disclosure.sql` | Registered source found; parity unverified |
| `public.subscriber_document_index` | `drizzle/migrations/0030_separate_subscription_and_identity_disclosure.sql` | Registered source found; parity unverified |
| `public.subscriber_project` | `drizzle/migrations/0030_separate_subscription_and_identity_disclosure.sql` | Registered source found; parity unverified |
| `public.sync_profile_full_name` | `drizzle/migrations/0016_profile_settings.sql` | Registered source found; parity unverified |
| `public.update_updated_at_column` | `drizzle/migrations/0000_dhc_profiles_and_signup_trigger.sql` | Registered source found; parity unverified |

## Live policy inventory

Every policy below was read from the live catalogue. Its presence is not a replay comparison. Policy predicates/roles were retrieved, but there is no scratch policy catalogue to compare them with.

| Table | Policy | Verification |
|---|---|---|
| `access_event` | `access_event_read_party` | Live catalogue read; scratch equivalence not verified |
| `access_request` | `access_request_insert_own` | Live catalogue read; scratch equivalence not verified |
| `access_request` | `access_request_investor_update` | Live catalogue read; scratch equivalence not verified |
| `access_request` | `access_request_owner_update` | Live catalogue read; scratch equivalence not verified |
| `access_request` | `access_request_read` | Live catalogue read; scratch equivalence not verified |
| `access_request` | `subscriber_interest_submission` | Live catalogue read; scratch equivalence not verified |
| `advisor` | `advisor_admin_write` | Live catalogue read; scratch equivalence not verified |
| `advisor` | `advisor_public_read` | Live catalogue read; scratch equivalence not verified |
| `answer` | `answer_delete_own` | Live catalogue read; scratch equivalence not verified |
| `answer` | `answer_insert_own` | Live catalogue read; scratch equivalence not verified |
| `answer` | `answer_read` | Live catalogue read; scratch equivalence not verified |
| `bundle` | `bundle_own_all` | Live catalogue read; scratch equivalence not verified |
| `bundle` | `qualified_portfolio` | Live catalogue read; scratch equivalence not verified |
| `bundle_item` | `bundle_item_own_all` | Live catalogue read; scratch equivalence not verified |
| `bundle_item` | `qualified_portfolio_items` | Live catalogue read; scratch equivalence not verified |
| `capital_stack_item` | `capital_stack_owner_all` | Live catalogue read; scratch equivalence not verified |
| `capital_stack_item` | `capital_stack_read` | Live catalogue read; scratch equivalence not verified |
| `capital_stack_item` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `construction_package` | `construction_package_owner_write` | Live catalogue read; scratch equivalence not verified |
| `construction_package` | `construction_package_read` | Live catalogue read; scratch equivalence not verified |
| `construction_package` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `contact_request` | `contact_admin_update` | Live catalogue read; scratch equivalence not verified |
| `contact_request` | `contact_insert` | Live catalogue read; scratch equivalence not verified |
| `contact_request` | `contact_own_read` | Live catalogue read; scratch equivalence not verified |
| `document` | `document_gated_read` | Live catalogue read; scratch equivalence not verified |
| `document` | `document_open_read_after_grant` | Live catalogue read; scratch equivalence not verified |
| `document` | `document_owner_all` | Live catalogue read; scratch equivalence not verified |
| `document_access_grant` | `grant_delete` | Live catalogue read; scratch equivalence not verified |
| `document_access_grant` | `grant_insert_own` | Live catalogue read; scratch equivalence not verified |
| `document_access_grant` | `grant_owner_manage` | Live catalogue read; scratch equivalence not verified |
| `document_access_grant` | `grant_read_own` | Live catalogue read; scratch equivalence not verified |
| `energy_mix_item` | `energy_mix_item_owner_all` | Live catalogue read; scratch equivalence not verified |
| `energy_mix_item` | `energy_mix_item_public_read` | Live catalogue read; scratch equivalence not verified |
| `energy_mix_item` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `financial_summary` | `financial_owner_all` | Live catalogue read; scratch equivalence not verified |
| `financial_summary` | `financial_read` | Live catalogue read; scratch equivalence not verified |
| `financial_summary` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `funding_call` | `call_admin_update` | Live catalogue read; scratch equivalence not verified |
| `funding_call` | `funding_call_read` | Live catalogue read; scratch equivalence not verified |
| `funding_change_log` | `funding_change_log_admin` | Live catalogue read; scratch equivalence not verified |
| `funding_coverage` | `funding_coverage_admin` | Live catalogue read; scratch equivalence not verified |
| `funding_programme` | `funding_programme_read` | Live catalogue read; scratch equivalence not verified |
| `funding_programme` | `programme_admin_update` | Live catalogue read; scratch equivalence not verified |
| `legal_acceptance` | `legal_acceptance_read_own` | Live catalogue read; scratch equivalence not verified |
| `margin_profile` | `margin_profile_owner_write` | Live catalogue read; scratch equivalence not verified |
| `margin_profile` | `margin_profile_read` | Live catalogue read; scratch equivalence not verified |
| `margin_profile` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `member_message` | `member_message_admin_status` | Live catalogue read; scratch equivalence not verified |
| `member_message` | `member_message_insert_own` | Live catalogue read; scratch equivalence not verified |
| `member_message` | `member_message_read` | Live catalogue read; scratch equivalence not verified |
| `milestone` | `milestone_owner_all` | Live catalogue read; scratch equivalence not verified |
| `milestone` | `milestone_read` | Live catalogue read; scratch equivalence not verified |
| `milestone` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `nda_document_version` | `nda_document_version_read` | Live catalogue read; scratch equivalence not verified |
| `nda_signature` | `nda_signature_insert_own` | Live catalogue read; scratch equivalence not verified |
| `nda_signature` | `nda_signature_read_own` | Live catalogue read; scratch equivalence not verified |
| `news_item` | `news_item_admin_moderate` | Live catalogue read; scratch equivalence not verified |
| `news_item` | `news_item_read` | Live catalogue read; scratch equivalence not verified |
| `news_source` | `news_source_read` | Live catalogue read; scratch equivalence not verified |
| `notification` | `notification_read_own` | Live catalogue read; scratch equivalence not verified |
| `notification` | `notification_update_own` | Live catalogue read; scratch equivalence not verified |
| `offtake_ladder` | `offtake_ladder_owner_write` | Live catalogue read; scratch equivalence not verified |
| `offtake_ladder` | `offtake_ladder_read` | Live catalogue read; scratch equivalence not verified |
| `offtake_ladder` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `operating_parameter` | `operating_parameter_owner_all` | Live catalogue read; scratch equivalence not verified |
| `operating_parameter` | `operating_parameter_public_read` | Live catalogue read; scratch equivalence not verified |
| `operating_parameter` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `organization` | `organization_admin_write` | Live catalogue read; scratch equivalence not verified |
| `organization` | `organization_read` | Live catalogue read; scratch equivalence not verified |
| `project` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `project` | `project_read_accepted` | Live catalogue read; scratch equivalence not verified |
| `project` | `project_read_own` | Live catalogue read; scratch equivalence not verified |
| `project` | `project_write_own` | Live catalogue read; scratch equivalence not verified |
| `project_advisor` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `project_advisor` | `project_advisor_owner_all` | Live catalogue read; scratch equivalence not verified |
| `project_advisor` | `project_advisor_public_read` | Live catalogue read; scratch equivalence not verified |
| `project_case` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `project_case` | `project_case_owner_write` | Live catalogue read; scratch equivalence not verified |
| `project_case` | `project_case_read` | Live catalogue read; scratch equivalence not verified |
| `project_interest` | `project_interest_delete_own` | Live catalogue read; scratch equivalence not verified |
| `project_interest` | `project_interest_insert_own` | Live catalogue read; scratch equivalence not verified |
| `project_interest` | `project_interest_insert_owner` | Live catalogue read; scratch equivalence not verified |
| `project_interest` | `project_interest_read` | Live catalogue read; scratch equivalence not verified |
| `project_interest` | `project_interest_update_owner` | Live catalogue read; scratch equivalence not verified |
| `project_process` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `project_process` | `project_process_owner_write` | Live catalogue read; scratch equivalence not verified |
| `project_process` | `project_process_read` | Live catalogue read; scratch equivalence not verified |
| `project_transaction` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `project_transaction` | `project_transaction_owner_write` | Live catalogue read; scratch equivalence not verified |
| `project_transaction` | `project_transaction_read` | Live catalogue read; scratch equivalence not verified |
| `public_funding` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `public_funding` | `public_funding_owner_all` | Live catalogue read; scratch equivalence not verified |
| `public_funding` | `public_funding_read` | Live catalogue read; scratch equivalence not verified |
| `question` | `question_delete_own` | Live catalogue read; scratch equivalence not verified |
| `question` | `question_insert_own` | Live catalogue read; scratch equivalence not verified |
| `question` | `question_read` | Live catalogue read; scratch equivalence not verified |
| `revenue_stream` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `revenue_stream` | `revenue_stream_owner_all` | Live catalogue read; scratch equivalence not verified |
| `revenue_stream` | `revenue_stream_read` | Live catalogue read; scratch equivalence not verified |
| `risk` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `risk` | `risk_owner_all` | Live catalogue read; scratch equivalence not verified |
| `risk` | `risk_read` | Live catalogue read; scratch equivalence not verified |
| `sdg_alignment` | `sdg_owner_all` | Live catalogue read; scratch equivalence not verified |
| `sdg_alignment` | `sdg_read` | Live catalogue read; scratch equivalence not verified |
| `subscription` | `subscription_owner_read` | Live catalogue read; scratch equivalence not verified |
| `sustainability_profile` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `sustainability_profile` | `sustainability_owner_all` | Live catalogue read; scratch equivalence not verified |
| `sustainability_profile` | `sustainability_read` | Live catalogue read; scratch equivalence not verified |
| `technology_card` | `paid_depth` | Live catalogue read; scratch equivalence not verified |
| `technology_card` | `technology_card_owner_all` | Live catalogue read; scratch equivalence not verified |
| `technology_card` | `technology_card_public_read` | Live catalogue read; scratch equivalence not verified |
| `user_news_preference` | `news_pref_own` | Live catalogue read; scratch equivalence not verified |
| `user_profile` | `user_profile_insert` | Live catalogue read; scratch equivalence not verified |
| `user_profile` | `user_profile_select` | Live catalogue read; scratch equivalence not verified |
| `user_profile` | `user_profile_update` | Live catalogue read; scratch equivalence not verified |
| `user_role` | `user_role_admin_write` | Live catalogue read; scratch equivalence not verified |
| `user_role` | `user_role_read_own` | Live catalogue read; scratch equivalence not verified |
| `watchlist_item` | `watchlist_own_all` | Live catalogue read; scratch equivalence not verified |

## Database-backed application reference inventory

These are direct source references found by scanning application code. This is not a claim that each complete screen or journey was manually reviewed or run. Storage buckets, including avatars, are managed storage dependencies rather than public tables. Aliased/type-cast RPC calls and table names nested inside select strings may need a further pass.

| Source surface | Direct tables/RPCs | Status |
|---|---|---|
| `src/components/news/NewsPreferencesDialog.tsx` | `user_news_preference` | References unregistered table baseline: user_news_preference |
| `src/components/news/ProjectNewsCard.tsx` | `news_item` | References unregistered table baseline: news_item |
| `src/components/platform/ContactRequestDialog.tsx` | `contact_request` | Direct reference inventory only; runtime/replay unverified |
| `src/components/project/GeneratedProjectDocuments.tsx` | `project_pdf_inputs` | Direct reference inventory only; runtime/replay unverified |
| `src/components/project/InvestorInformation.tsx` | `investor_document_index` | Direct reference inventory only; runtime/replay unverified |
| `src/components/project/ManageAdvisorsDialog.tsx` | `advisor`, `project_advisor` | Direct reference inventory only; runtime/replay unverified |
| `src/components/project/ManageDocumentsDialog.tsx` | `document` | Direct reference inventory only; runtime/replay unverified |
| `src/components/project/ManageTechnicalDialog.tsx` | `energy_mix_item`, `operating_parameter`, `technology_card` | Direct reference inventory only; runtime/replay unverified |
| `src/components/project/ProjectDocuments.tsx` | `document` | Direct reference inventory only; runtime/replay unverified |
| `src/components/project/ProjectQA.tsx` | `answer_question`, `decline_question`, `question`, `question_response_record` | Direct reference inventory only; runtime/replay unverified |
| `src/components/settings/MandateStep.tsx` | `investor_profiles` | Direct reference inventory only; runtime/replay unverified |
| `src/components/submit/PublicFundingEditor.tsx` | `funding_programme` | References unregistered table baseline: funding_programme |
| `src/components/submit/StageWizard.tsx` | `capital_stack_item`, `developer_profiles`, `energy_mix_item`, `financial_summary`, `funding_programme`, `milestone`, `offtake_ladder`, `operating_parameter`, `preview_investor_document`, `project`, `project_submission_work`, `project_transaction`, `public_funding`, `save_stage_listing` | References unregistered table baseline: funding_programme |
| `src/contexts/AuthContext.tsx` | `avatars`, `user_profile`, `user_role` | Direct reference inventory only; runtime/replay unverified |
| `src/hooks/useBundles.ts` | `bundle`, `bundle_item` | References unregistered table baseline: bundle, bundle_item |
| `src/hooks/useInvestorGrade.ts` | `construction_package`, `margin_profile`, `offtake_ladder`, `project_case`, `project_process`, `project_transaction` | Direct reference inventory only; runtime/replay unverified |
| `src/hooks/useProfileSettings.ts` | `developer_profiles`, `investor_profiles`, `legal_acceptance`, `user_profile` | References unregistered table baseline: legal_acceptance |
| `src/hooks/useProjectListings.ts` | `access_request`, `financial_summary`, `investor_project`, `offtake_ladder`, `project`, `project_case`, `project_discovery`, `project_identity`, `project_transaction`, `watchlist_item` | Direct reference inventory only; runtime/replay unverified |
| `src/hooks/useProjectRecord.ts` | `capital_stack_item`, `energy_mix_item`, `financial_summary`, `milestone`, `operating_parameter`, `project_advisor`, `project_transaction`, `public_funding`, `revenue_stream`, `risk`, `sustainability_profile`, `technology_card` | Direct reference inventory only; runtime/replay unverified |
| `src/hooks/useWatchlist.tsx` | `watchlist_item` | Direct reference inventory only; runtime/replay unverified |
| `src/lib/access.ts` | `is_qualified_investor` | Direct reference inventory only; runtime/replay unverified |
| `src/lib/funding.ts` | `developer_profiles`, `funding_programme`, `project` | References unregistered table baseline: funding_programme |
| `src/lib/googleSignup.ts` | `claim_signup_role` | Direct reference inventory only; runtime/replay unverified |
| `src/lib/mcp/tools/add-to-watchlist.ts` | `project_teaser`, `watchlist_item` | Direct reference inventory only; runtime/replay unverified |
| `src/lib/mcp/tools/get-project.ts` | `access_request`, `financial_summary`, `investor_project`, `project`, `project_case`, `project_identity`, `project_teaser` | Direct reference inventory only; runtime/replay unverified |
| `src/lib/mcp/tools/list-my-access-requests.ts` | `access_request` | Direct reference inventory only; runtime/replay unverified |
| `src/lib/mcp/tools/list-watchlist.ts` | `watchlist_item` | Direct reference inventory only; runtime/replay unverified |
| `src/lib/mcp/tools/search-opportunities.ts` | `project_teaser` | Direct reference inventory only; runtime/replay unverified |
| `src/lib/news/ingest.server.ts` | `news_item`, `news_source`, `project` | References unregistered table baseline: news_item, news_source |
| `src/lib/projectDisclosure.ts` | `access_request`, `developer_profiles`, `project`, `project_teaser` | Direct reference inventory only; runtime/replay unverified |
| `src/pages/ProjectDetail.tsx` | `access_request`, `access_request_answers`, `investor_profiles`, `investor_project`, `listing_access_criteria`, `nda_document_version`, `project_identity`, `project_interest` | References unregistered table baseline: nda_document_version |
| `src/pages/platform/AccessRequests.tsx` | `access_request`, `access_request_answers`, `developer_profiles`, `document`, `document_access_grant`, `listing_access_criteria`, `project`, `project_interest` | Direct reference inventory only; runtime/replay unverified |
| `src/pages/platform/DataRoomRequests.tsx` | `access_request`, `access_request_answers`, `developer_profiles`, `document`, `document_access_grant`, `project`, `project_interest` | Direct reference inventory only; runtime/replay unverified |
| `src/pages/platform/DeveloperDashboard.tsx` | `access_request`, `developer_profiles`, `project`, `project_interest` | Direct reference inventory only; runtime/replay unverified |
| `src/pages/platform/Ecosystem.tsx` | `advisor` | Direct reference inventory only; runtime/replay unverified |
| `src/pages/platform/Feedback.tsx` | `member_message` | References unregistered table baseline: member_message |
| `src/pages/platform/InvestorDashboard.tsx` | `access_request`, `capital_stack_item`, `financial_summary`, `investor_profiles`, `notification`, `project`, `project_case`, `project_interest`, `project_process`, `watchlist_item` | Direct reference inventory only; runtime/replay unverified |
| `src/pages/platform/MarketNews.tsx` | `access_request`, `developer_profiles`, `news_item`, `news_source`, `project`, `project_teaser`, `user_news_preference`, `watchlist_item` | References unregistered table baseline: news_item, news_source, user_news_preference |
| `src/pages/platform/Notifications.tsx` | `notification` | Direct reference inventory only; runtime/replay unverified |
| `src/pages/platform/PlatformLayout.tsx` | `access_request`, `notification` | Direct reference inventory only; runtime/replay unverified |
| `src/pages/platform/ProfileSettings.tsx` | `avatars`, `developer_profiles`, `investor_profiles`, `user_profile` | Direct reference inventory only; runtime/replay unverified |
| `src/pages/platform/PublicFunding.tsx` | `funding_coverage` | References unregistered table baseline: funding_coverage |
| `src/pages/platform/Support.tsx` | `member_message` | References unregistered table baseline: member_message |
| `src/pages/platform/WorkspaceOverview.tsx` | `access_request`, `developer_profiles`, `funding_call`, `news_item`, `notification`, `project`, `project_teaser`, `public_funding` | References unregistered table baseline: funding_call, news_item |
| `src/pages/platform/admin/ContactRequests.tsx` | `contact_request`, `contact_request_inbox` | Direct reference inventory only; runtime/replay unverified |
| `src/pages/platform/admin/FundingReview.tsx` | `funding_programme` | References unregistered table baseline: funding_programme |
| `src/pages/platform/admin/NewsHealth.tsx` | `news_source_health` | Direct reference inventory only; runtime/replay unverified |
| `src/routes/api/public/hooks/access-reminders.ts` | `access_request`, `cron_token`, `notification`, `project_teaser` | Direct reference inventory only; runtime/replay unverified |
| `src/routes/api/public/hooks/ingest-news.ts` | `cron_token` | Direct reference inventory only; runtime/replay unverified |
| `src/routes/app.advisors.$slug.tsx` | `advisor` | Direct reference inventory only; runtime/replay unverified |

## Confirmed affected areas

- News, preferences, project news, source-health administration and ingest/fetch jobs: unlisted baseline migrations.
- Support, feedback and admin message notifications: unlisted baseline migration.
- Bundle builder and saved portfolios: bundle/bundle_item baseline and guard exist only in the manual archive. Registered qualification policies depend on them.
- Funding catalogue/detail, submission funding selector, funding review/contact queue, workspace deadlines and funding agent/expiry helpers: catalogue baseline is manual-only; application-mode changes are also manual-only.
- Signing, NDA-version lookup, account legal history and immutable access audit: NDA baseline is manual-only; legal_acceptance/access_event have no explicit CREATE TABLE in scanned SQL.
- Q&A, identity disclosure and document access inheritance: private.has_project_access and manual document-grant helper versions are outside registered history.
- Registered project/profile/technical/financial tables have definitions, but dependent missing foundations prevent certifying those journeys after a rebuild.

## What remains unchecked or blocked

- No isolated scratch replay was performed. There is no table-by-table or policy-by-policy diff and no empty-diff acceptance result.
- Main-history inspection still reports invalid bookkeeping and offers no supported repair plan. Direct main-journal changes are prohibited.
- Individual cron jobs could not be inspected through the SQL read tool.
- Full browser journeys, every transitive source dependency, storage configuration parity and complete live function-definition equivalence were not verified.
- The manual rollback archive contains destructive operations and a now-superseded organization policy. It must not be appended blindly or executed against production.
- Repair must retain all applied production SQL bytes, preserve ordering and later security restrictions, cover every out-of-band foundation, and then pass a real isolated replay comparison. Further phase work stays paused.
