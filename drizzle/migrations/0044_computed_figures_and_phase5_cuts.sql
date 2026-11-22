-- Batch B items 8 and 9.
-- Phase 1 data model: NPV is not collected and not shown. Payback, first revenue year and funding
-- progress are computed from recorded inputs (src/lib/projectComputes.ts), so stored copies would
-- drift from their inputs. Equity required and minimum ticket live on project_transaction.
-- No database function, view or policy reads these columns.
ALTER TABLE public.financial_summary
  DROP COLUMN IF EXISTS npv,
  DROP COLUMN IF EXISTS payback_years,
  DROP COLUMN IF EXISTS first_revenue_year,
  DROP COLUMN IF EXISTS funding_progress_pct,
  DROP COLUMN IF EXISTS funding_remaining,
  DROP COLUMN IF EXISTS equity_required,
  DROP COLUMN IF EXISTS min_ticket;
-- Phase 5 deletion: the equivalent-cars conversion is cut everywhere.
ALTER TABLE public.sustainability_profile DROP COLUMN IF EXISTS equivalent_cars;
