-- Supabase advisor (auth_rls_initplan): policies chamando auth.uid() diretamente fazem
-- o Postgres reavaliar a função para cada linha. Envolver em (select auth.uid()) deixa
-- o planner tratar como initplan (avaliado uma vez por query). Puramente performance,
-- não muda o resultado de nenhuma policy — reescreve exatamente a mesma condição.

drop policy "fin_profiles_select_own" on public.fin_profiles;
create policy "fin_profiles_select_own" on public.fin_profiles
  for select using ((select auth.uid()) = id);

drop policy "fin_profiles_update_own" on public.fin_profiles;
create policy "fin_profiles_update_own" on public.fin_profiles
  for update using ((select auth.uid()) = id);

drop policy "fin_profiles_insert_own" on public.fin_profiles;
create policy "fin_profiles_insert_own" on public.fin_profiles
  for insert with check ((select auth.uid()) = id);

drop policy "fin_households_select_member" on public.fin_households;
create policy "fin_households_select_member" on public.fin_households
  for select using (
    id in (select public.fin_my_household_ids())
    or created_by = (select auth.uid())
  );

drop policy "fin_households_insert_self" on public.fin_households;
create policy "fin_households_insert_self" on public.fin_households
  for insert with check (created_by = (select auth.uid()));

drop policy "fin_household_members_select_own_household" on public.fin_household_members;
create policy "fin_household_members_select_own_household" on public.fin_household_members
  for select using (
    household_id in (select public.fin_my_household_ids())
    or user_id = (select auth.uid())
  );

drop policy "fin_household_members_insert_self" on public.fin_household_members;
create policy "fin_household_members_insert_self" on public.fin_household_members
  for insert with check (user_id = (select auth.uid()));

drop policy "fin_household_members_delete_self" on public.fin_household_members;
create policy "fin_household_members_delete_self" on public.fin_household_members
  for delete using (user_id = (select auth.uid()));

drop policy "fin_categories_select_own_or_default" on public.fin_categories;
create policy "fin_categories_select_own_or_default" on public.fin_categories
  for select using (user_id is null or user_id = (select auth.uid()));

drop policy "fin_categories_insert_own" on public.fin_categories;
create policy "fin_categories_insert_own" on public.fin_categories
  for insert with check (user_id = (select auth.uid()));

drop policy "fin_categories_update_own" on public.fin_categories;
create policy "fin_categories_update_own" on public.fin_categories
  for update using (user_id = (select auth.uid()));

drop policy "fin_categories_delete_own" on public.fin_categories;
create policy "fin_categories_delete_own" on public.fin_categories
  for delete using (user_id = (select auth.uid()));

drop policy "fin_transactions_select_own_or_shared" on public.fin_transactions;
create policy "fin_transactions_select_own_or_shared" on public.fin_transactions
  for select using (
    user_id = (select auth.uid())
    or (is_shared = true and household_id in (select public.fin_my_household_ids()))
  );

drop policy "fin_transactions_insert_own" on public.fin_transactions;
create policy "fin_transactions_insert_own" on public.fin_transactions
  for insert with check (user_id = (select auth.uid()));

drop policy "fin_transactions_update_own" on public.fin_transactions;
create policy "fin_transactions_update_own" on public.fin_transactions
  for update using (user_id = (select auth.uid()));

drop policy "fin_transactions_delete_own" on public.fin_transactions;
create policy "fin_transactions_delete_own" on public.fin_transactions
  for delete using (user_id = (select auth.uid()));

drop policy "fin_transaction_items_select_via_transaction" on public.fin_transaction_items;
create policy "fin_transaction_items_select_via_transaction" on public.fin_transaction_items
  for select using (
    exists (
      select 1 from public.fin_transactions t
      where t.id = transaction_id
        and (t.user_id = (select auth.uid()) or (t.is_shared = true and t.household_id in (select public.fin_my_household_ids())))
    )
  );

drop policy "fin_transaction_items_insert_via_transaction" on public.fin_transaction_items;
create policy "fin_transaction_items_insert_via_transaction" on public.fin_transaction_items
  for insert with check (
    exists (select 1 from public.fin_transactions t where t.id = transaction_id and t.user_id = (select auth.uid()))
  );

drop policy "fin_transaction_items_update_via_transaction" on public.fin_transaction_items;
create policy "fin_transaction_items_update_via_transaction" on public.fin_transaction_items
  for update using (
    exists (select 1 from public.fin_transactions t where t.id = transaction_id and t.user_id = (select auth.uid()))
  );

drop policy "fin_transaction_items_delete_via_transaction" on public.fin_transaction_items;
create policy "fin_transaction_items_delete_via_transaction" on public.fin_transaction_items
  for delete using (
    exists (select 1 from public.fin_transactions t where t.id = transaction_id and t.user_id = (select auth.uid()))
  );
