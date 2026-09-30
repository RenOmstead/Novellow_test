-- =========================================================
-- NOVELLOW
-- DECORATING THE WHOLE WALL
--
-- Run after public.sql (it's safe to run again).
--
-- Pieces on the wall are measured up from the floor, across
-- the first 820px; a piece above the bookcase is measured up
-- from its top, across the first 400px. On a tall screen the
-- wall goes higher than that, so the heights a piece can be
-- saved at now reach past those marks: -300 is three times
-- 820px above the floor's mark, 400 is four times 400px above
-- the bookcase.
-- =========================================================

alter table public.decorations
    drop constraint if exists decorations_position_y_check;

alter table public.decorations
    add constraint decorations_position_y_check
        check (position_y between -300 and 400);
