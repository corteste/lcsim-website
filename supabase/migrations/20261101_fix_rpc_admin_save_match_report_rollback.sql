-- Rollback: Fix rpc_admin_save_match_report
-- Date: 2026-11-01

DROP FUNCTION IF EXISTS public.rpc_admin_save_match_report(
  integer, integer, text, text, date, text, timestamp with time zone, text, text, text, jsonb, jsonb, jsonb, text, boolean
);
