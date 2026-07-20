-- Bug: createHousehold() insere e pede o id de volta (select().single()), mas a
-- policy original só deixava ver households onde o usuário já é membro — e o
-- membro só é adicionado no passo seguinte. O INSERT ... RETURNING é filtrado
-- pela policy de SELECT, então a criação falhava com "row violates RLS policy".
drop policy if exists "fin_households_select_member" on public.fin_households;

create policy "fin_households_select_member" on public.fin_households
  for select using (
    id in (select public.fin_my_household_ids())
    or created_by = auth.uid()
  );

-- Backfill: usuários cadastrados antes do trigger fin_on_auth_user_created
-- existir ficaram sem linha em fin_profiles.
insert into public.fin_profiles (id, full_name)
select u.id, u.raw_user_meta_data ->> 'full_name'
from auth.users u
left join public.fin_profiles p on p.id = u.id
where p.id is null;
