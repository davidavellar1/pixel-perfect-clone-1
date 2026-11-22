# Migration replay audit - 2026-11-22

Status: audit complete for the three specified files; history repair and scratch-rebuild proof blocked. No production SQL was executed. No migration file or journal entry was changed.

## Repository and production evidence

- Journal: 40 entries. Migration SQL files: 43. All 40 registered files exist, and their SHA256 checksums match recorded production rows.
- The three unlisted files also have exact SHA256 matches in production bookkeeping. They were applied, not merely inferred from table names.
- Duplicate prefixes are 0020, 0021 and 0022, each used by two files.
- Production bookkeeping contains 50 rows, including the non-SHA256 marker `manual-0025_qa_and_application_mode`. The history inspection tool reports `invalid_database_row` and offers no automatic repair plan.

| Unlisted file | Confirmed live objects | Production checksum match |
|---|---|---|
| `0020_market_news.sql` | `news_category`, `news_source_kind`; `news_source`, `news_item`, `user_news_preference`; source/preference update triggers; news indexes; `news_source_health()`; news and preference policies | `43401d731a95e7866de3a2507f1e4e24b732a9b04dc0e62fad329ffe20cbbad0` |
| `0021_news_fetch_via_db.sql` | `news_fetch`, its primary/source indexes and foreign key; `private.queue_news_fetch(text)`; `news_claim_fetched()`; RLS enabled with no client policies | `0ea00200a369d734ae69a7278045675e9b50900445ad0433226b13fb16101640` |
| `0022_support_feedback.sql` | `member_message_kind`, `member_message_status`; `member_message`, its indexes and constraints; three member-message policies; notification trigger/helper; `member_message_inbox()` | `93cc81f79627326a15d40a67f85928eb67b1cbe69ad81793b0eb02d947ec40a9` |

All three features are referenced by current application code. None qualifies for deletion as an unwanted, unapplied change.

## Observed live policies

All listed policies are permissive and scoped to authenticated users. All five tables have RLS enabled.

| Table | Policy | Command | Predicate / check |
|---|---|---|---|
| `news_source` | `news_source_read` | SELECT | Active source or admin |
| `news_item` | `news_item_read` | SELECT | Visible item or admin |
| `news_item` | `news_item_admin_moderate` | UPDATE | Admin, including new-row check |
| `user_news_preference` | `news_pref_own` | ALL | Owner, including new-row check |
| `news_fetch` | None | None | No client policy |
| `member_message` | `member_message_insert_own` | INSERT | Owner and initial open status |
| `member_message` | `member_message_read` | SELECT | Owner or admin |
| `member_message` | `member_message_admin_status` | UPDATE | Admin, including new-row check |

The original news-source policy in `0020_market_news.sql` is `USING (true)`. Production correctly has the later active-or-admin policy from registered `0020_restrict_nda_version_and_news_source_read.sql`. Appending the original file after the current journal would overwrite that restriction. Registration must preserve dependency and policy chronology, not just remove duplicate numbers.

## Additional replay dependencies

- Registered `0020_restrict_nda_version_and_news_source_read.sql` requires `news_source` before it can create its policy. Merely registering the news baseline after entry 39 does not solve an empty replay.
- Registered `0024_structured_public_funding_submission.sql` requires `funding_programme`. Its table definition exists in `drizzle/manual/0024_funding_catalogue.sql`, outside registered migrations. `funding_call`, `funding_change_log` and `funding_coverage` are also live and defined in that manual archive.
- Other manual gate, legal and Q&A changes must be included in a full schema reconciliation. This audit does not certify completeness of their replay definitions.
- Live extensions include `pg_cron` 1.6.4 and `pg_net` 0.20.4. The fetch baseline schedules SQL cron jobs and depends on managed auth, roles and networking objects. Cron job inspection was refused by the read tool, so the individual jobs remain unverified.

## Blockers and acceptance status

1. The supported main-history inspection returned no repair plan because of invalid bookkeeping. Direct main-journal editing is prohibited; the permitted manual-edit exception is only for draft refresh/accept repairs.
2. A supported isolated Cloud scratch-rebuild target is not available through the tools in this session. Local PostgreSQL binaries exist, but that is not a provisioned replica of the managed auth/extension baseline. No scratch database was created and no replay was run.
3. Consequently, no table-by-table or policy-by-policy scratch/live diff exists. The result is **not verified**, not an empty diff. Static dependency findings above are not a substitute for the requested rebuild.

Next required work: supported production-history reconciliation preserving all applied SQL checksums and chronology, followed by a clean isolated replay and a canonical schema comparison covering application tables, columns/defaults, constraints, indexes, RLS enablement, every policy and its role/predicate, grants, functions, views and triggers. Keep further phase work paused until the actual comparison is empty.