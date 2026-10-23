-- Rollback per le tabelle di preferiti, wishlist draft e impostazioni autopick
DROP TABLE IF EXISTS public.draft_autopick_settings CASCADE;
DROP TABLE IF EXISTS public.draft_team_wishlist CASCADE;
DROP TABLE IF EXISTS public.team_player_favorites CASCADE;
