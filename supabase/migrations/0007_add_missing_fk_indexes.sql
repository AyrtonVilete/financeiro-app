-- Supabase advisor (unindexed_foreign_keys): estas FKs não tinham índice cobrindo,
-- o que gera seq scan em joins/deletes por elas conforme a tabela cresce.
create index fin_categories_user_id_idx on public.fin_categories (user_id);
create index fin_households_created_by_idx on public.fin_households (created_by);
create index fin_transactions_category_id_idx on public.fin_transactions (category_id);
