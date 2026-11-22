# Database rebuild guide

How to build a fresh database that matches the live one, and how migrations are
kept from now on. Checked against `drizzle.__drizzle_migrations` on 22 Nov 2026.

## How the tracking table works

The installed drizzle-orm migrator (0.45.2, `pg-core/dialect.js`) reads the
newest `created_at` in `drizzle.__drizzle_migrations` and runs a journal entry
only if its `when` is later. A file is recorded as `hash` = sha256 of the file
bytes and `created_at` = the journal `when`. So a journal entry whose `when` is
older than the newest applied row is treated as applied and never runs. Renaming
a file is safe; editing an applied file's content is not (its hash would no
longer match its row).

## Build order

Apply in this order, by applied date. "Journal" files run through drizzle.
Every other step is applied by hand, then recorded in the tracking table.

| Order | File | Tracking id | Applied (UTC) | Notes |
|---|---|---|---|---|
| 1 | journal `0000` to `0015` | 1 to 16 | 21 to 22 Sep | hashes match |
| 2 | `0016_nda_signature_append_only.sql` | 17 | 24 Sep 13:51 | not in this repo, see below |
| 3 | `0017_access_evidence_log_and_lock.sql` | 18 | 24 Sep 13:51 | not in this repo, see below |
| 4 | `0018_legal_acceptance.sql` | 19 | 24 Sep 14:10 | not in this repo, see below |
| 5 | `0019_project_capacity_optional.sql` | 20 | 24 Sep 16:55 | not in this repo, see below |
| 6 | journal `0048_market_news` | 21 | 4 Oct 23:01 | was 0020_market_news, renamed |
| 7 | journal `0049_news_fetch_via_db` | 22 | 4 Oct 23:25 | was 0021_news_fetch_via_db, renamed |
| 8 | journal `0050_support_feedback` | 23 | 4 Oct 23:57 | was 0022_support_feedback, renamed |
| 9 | `manual/0023_bundles.sql` | 24 | 8 Oct 20:00 | hash matches |
| 10 | `manual/0024_funding_catalogue.sql` | 25 | 8 Oct 21:00 | file hash differs from the row; the row was written for an earlier text |
| 11 | `manual/0025_qa_and_application_mode.sql` | 26 | 8 Oct 22:35 | row hash is the literal `manual-0025_qa_and_application_mode` |
| 12 | 0026 developer company profile | (27, removed) | 8 Oct | applied, then rolled back; skip it |
| 13 | `manual/0027_rollback_developer_company_profile.sql` | none | 8 Oct 23:03 | undoes step 12; skip both on a fresh build |
| 14 | journal `0016` to `0018` | 28 to 30 | 6 Nov to 13 Nov 21:25 | hashes match |
| 15 | `manual/0023_disclosure_gate_and_signature_evidence.sql` | none | 13 Nov, between rows 30 and 31 | live state matches; never re-run it after step 16, see below |
| 16 | journal `0019` to `0047` | 31 to 61 | 13 Nov to 22 Nov | hashes match |

Ids 27, 55 and 58 are absent. 27 is the rolled-back step 12. 55 and 58 are
sequence values consumed by dry runs of 0043 and 0045 inside transactions that
were rolled back; no migration is missing for them.

### Tracking rows 17 to 20

These four files were applied and registered on 24 Sep 2026 from a branch that
never reached `main`. Their `created_at` values equal the journal `when` values
in the patches kept in the DHC project (claude/patches):

- 17 (`1790257869397`) and 18 (`1790257869398`): `0001-evidence-lock-migrations-0016-0017.patch`
- 19 (`1790259031462`): `0002-legal-pages-acceptance-cookie-consent.patch`
- 20 (`1790268946055`): `all-changes-since-main.diff`, `0019_project_capacity_optional`

No `.sql` file in this repository, at any commit, hashes to rows 17 to 20. A
fresh build needs those four files taken from the patches. The rows themselves
are left as they are.

### The disclosure gate file (step 15)

`manual/0023_disclosure_gate_and_signature_evidence.sql` is unregistered and
safe to edit. It recreates `project_teaser` with a `slug` column, so running it
after 0041 would put the slug back on the public view. Run it only in its place
in the order above.

### Em dash in 0050_support_feedback

`0050_support_feedback.sql` has an em dash (U+2014) in the admin notification
string, between the subject and the body. The file is registered, so its content is not
edited. The live function `private.notify_admins_member_message` still contains
it as of 22 Nov 2026. Fix it with a new journal migration that replaces the
function, not by editing the file.

## Rule for new migrations

Every schema or policy change goes in `drizzle/migrations` with the next free
number and a journal entry, never only into the live database or this folder.
No two files may share a number. `scripts/check-hygiene.mjs` fails the build if
two files in `drizzle/migrations` share a numeric prefix or a `.sql` file there
is missing from the journal.
