-- getHousehold()/leaveHousehold() sempre filtram fin_household_members por
-- user_id sozinho, mas a PK composta (household_id, user_id) só serve buscas
-- por household_id. Sem este índice, cada carregamento de página faz um
-- full scan da tabela — não escala com mais usuários.
create index fin_household_members_user_idx on public.fin_household_members (user_id);
