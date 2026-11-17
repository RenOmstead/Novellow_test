-- =========================================================
-- NOVELLOW
-- DECORATIONS THAT STAY ON THEIR SHELF
--
-- Run after safety.sql (it's safe to run again).
--
-- A piece on the shelves (a cat curled up beside the books, a
-- candle, a little ghost) used to be placed a fixed distance
-- from the top of the bookcase. But shelves move: adding books
-- gives a shelf another row and pushes the shelves below it
-- down, and a narrower bookcase (a laptop) wraps the same books
-- into more rows than a phone does. So pieces drifted off their
-- shelves.
--
-- Now a piece remembers which shelf it sits on (shelf_id) and
-- which of that shelf's rows (shelf_row, counting from 0), and
-- its height is measured from the top of that row. Wherever the
-- shelf ends up, the piece goes with it.
--
-- If a shelf is deleted, its pieces move to the first shelf. A
-- piece placed before this keeps the old measure until it's
-- moved. Until this file is run, the app saves pieces the old
-- way.
-- =========================================================


alter table public.decorations
    add column if not exists shelf_id uuid
        references public.shelves (id) on delete set null,
    add column if not exists shelf_row smallint
        check (shelf_row between 0 and 200);

-- Let the API see the new columns straight away.
notify pgrst, 'reload schema';


-- =========================================================
-- CHECK
-- Every row should say true.
-- =========================================================

select 'decorations remember their shelf' as check,
    exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'decorations' and column_name = 'shelf_id'
    ) as ok
union all
select 'and their row',
    exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'decorations' and column_name = 'shelf_row'
    );
