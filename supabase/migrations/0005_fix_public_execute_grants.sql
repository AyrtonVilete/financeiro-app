-- A migration 0002 revogou EXECUTE de fin_handle_new_user apenas de anon/authenticated,
-- mas toda função nova recebe EXECUTE para PUBLIC por padrão do Postgres — revogar de
-- papéis específicos não remove esse grant. Resultado: a função continuava exposta em
-- /rest/v1/rpc/fin_handle_new_user para qualquer um (autenticado ou não).
--
-- fin_join_household e fin_my_household_ids também estavam com EXECUTE liberado para
-- anon (usuário não logado). Isso permitia a um atacante sem conta chamar
-- fin_join_household com códigos de convite e diferenciar "código inválido" de
-- "código válido" (a função lê fin_households antes de checar auth.uid()), um oráculo
-- de enumeração. Nenhuma dessas funções deveria ser chamável por anon: o fluxo do app
-- sempre exige login antes de entrar num household.
revoke execute on function public.fin_handle_new_user() from public;

revoke execute on function public.fin_join_household(text) from public, anon;
grant execute on function public.fin_join_household(text) to authenticated;

revoke execute on function public.fin_my_household_ids() from public, anon;
grant execute on function public.fin_my_household_ids() to authenticated;
