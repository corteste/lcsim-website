-- ==============================================================================
-- LCSIM Rollback: Ripristina login Cosmo FC
-- Data: 01/11/2026
-- ==============================================================================

INSERT INTO public.app_user (id, username, password, name, team_id, is_admin, created_at, updated_at)
VALUES (
  '6b4f6d8b-6996-480a-9789-1b0d42baf63b',
  'cosmo',
  'cosmo',
  'Sig. Stroppa',
  'COS',
  false,
  '2026-10-25 17:25:46.075+00',
  '2026-10-25 17:25:46.075+00'
)
ON CONFLICT (id) DO UPDATE
SET username = EXCLUDED.username,
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    team_id = EXCLUDED.team_id,
    is_admin = EXCLUDED.is_admin;
