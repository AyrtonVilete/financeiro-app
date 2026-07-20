-- ============================================================================
-- Financeiro App - Schema inicial
-- Modelo: cada pessoa tem seus próprios lançamentos. Duas pessoas podem
-- formar um "household" (casal). Um lançamento marcado como is_shared=true
-- fica visível para os dois membros do household na visão combinada.
--
-- Este projeto Supabase é compartilhado com outro sistema (PainelRelacional).
-- Todos os objetos deste app usam o prefixo "fin_" para não colidir com as
-- tabelas/funções/triggers já existentes (profiles, handle_new_user,
-- on_auth_user_created, etc. pertencem ao outro sistema).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- fin_profiles: 1:1 com auth.users
-- ---------------------------------------------------------------------------
create type fin_risk_profile as enum ('conservador', 'moderado', 'arrojado');

create table public.fin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  risk_profile fin_risk_profile,
  monthly_surplus numeric(12,2),
  created_at timestamptz not null default now()
);

alter table public.fin_profiles enable row level security;

create policy "fin_profiles_select_own" on public.fin_profiles
  for select using (auth.uid() = id);

create policy "fin_profiles_update_own" on public.fin_profiles
  for update using (auth.uid() = id);

create policy "fin_profiles_insert_own" on public.fin_profiles
  for insert with check (auth.uid() = id);

-- Cria o profile automaticamente quando um usuário se cadastra
create function public.fin_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.fin_profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger fin_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.fin_handle_new_user();

-- ---------------------------------------------------------------------------
-- fin_households: agrupa duas pessoas (casal) para visão combinada
-- ---------------------------------------------------------------------------
create table public.fin_households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Nossa casa',
  invite_code text not null unique default substr(md5(random()::text), 1, 8),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.fin_household_members (
  household_id uuid not null references public.fin_households(id) on delete cascade,
  user_id uuid not null references public.fin_profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

alter table public.fin_households enable row level security;
alter table public.fin_household_members enable row level security;

-- Função auxiliar: household_ids do usuário atual (evita recursão de RLS)
create function public.fin_my_household_ids()
returns setof uuid
language sql
security definer set search_path = public
stable
as $$
  select household_id from public.fin_household_members where user_id = auth.uid();
$$;

create policy "fin_households_select_member" on public.fin_households
  for select using (id in (select public.fin_my_household_ids()));

create policy "fin_households_insert_self" on public.fin_households
  for insert with check (created_by = auth.uid());

create policy "fin_household_members_select_own_household" on public.fin_household_members
  for select using (household_id in (select public.fin_my_household_ids()) or user_id = auth.uid());

create policy "fin_household_members_insert_self" on public.fin_household_members
  for insert with check (user_id = auth.uid());

create policy "fin_household_members_delete_self" on public.fin_household_members
  for delete using (user_id = auth.uid());

-- RPC para entrar em um household via código de convite (evita expor a tabela toda)
create function public.fin_join_household(p_invite_code text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_household_id uuid;
  v_member_count int;
begin
  select id into v_household_id from public.fin_households where invite_code = p_invite_code;

  if v_household_id is null then
    raise exception 'Código de convite inválido';
  end if;

  select count(*) into v_member_count from public.fin_household_members where household_id = v_household_id;

  if v_member_count >= 2 then
    raise exception 'Este espaço já tem dois membros';
  end if;

  insert into public.fin_household_members (household_id, user_id)
  values (v_household_id, auth.uid())
  on conflict do nothing;

  return v_household_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- fin_categories: categorias de gasto/receita. user_id null = categoria padrão do sistema
-- ---------------------------------------------------------------------------
create type fin_category_kind as enum ('expense', 'income');

create table public.fin_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default 'circle',
  color text not null default '#6b7280',
  kind fin_category_kind not null default 'expense',
  created_at timestamptz not null default now()
);

alter table public.fin_categories enable row level security;

create policy "fin_categories_select_own_or_default" on public.fin_categories
  for select using (user_id is null or user_id = auth.uid());

create policy "fin_categories_insert_own" on public.fin_categories
  for insert with check (user_id = auth.uid());

create policy "fin_categories_update_own" on public.fin_categories
  for update using (user_id = auth.uid());

create policy "fin_categories_delete_own" on public.fin_categories
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- fin_transactions: lançamentos (total simples ou com itens analíticos)
-- ---------------------------------------------------------------------------
create type fin_transaction_kind as enum ('expense', 'income');

create table public.fin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references public.fin_households(id) on delete set null,
  category_id uuid references public.fin_categories(id) on delete set null,
  kind fin_transaction_kind not null default 'expense',
  amount numeric(12,2) not null check (amount >= 0),
  description text,
  occurred_at date not null default current_date,
  is_shared boolean not null default false,
  created_at timestamptz not null default now()
);

create index fin_transactions_user_idx on public.fin_transactions (user_id, occurred_at desc);
create index fin_transactions_household_idx on public.fin_transactions (household_id, occurred_at desc) where household_id is not null;

alter table public.fin_transactions enable row level security;

create policy "fin_transactions_select_own_or_shared" on public.fin_transactions
  for select using (
    user_id = auth.uid()
    or (is_shared = true and household_id in (select public.fin_my_household_ids()))
  );

create policy "fin_transactions_insert_own" on public.fin_transactions
  for insert with check (user_id = auth.uid());

create policy "fin_transactions_update_own" on public.fin_transactions
  for update using (user_id = auth.uid());

create policy "fin_transactions_delete_own" on public.fin_transactions
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- fin_transaction_items: detalhamento item a item (opcional) de um lançamento
-- ---------------------------------------------------------------------------
create table public.fin_transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.fin_transactions(id) on delete cascade,
  name text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index fin_transaction_items_transaction_idx on public.fin_transaction_items (transaction_id);

alter table public.fin_transaction_items enable row level security;

create policy "fin_transaction_items_select_via_transaction" on public.fin_transaction_items
  for select using (
    exists (
      select 1 from public.fin_transactions t
      where t.id = transaction_id
        and (t.user_id = auth.uid() or (t.is_shared = true and t.household_id in (select public.fin_my_household_ids())))
    )
  );

create policy "fin_transaction_items_insert_via_transaction" on public.fin_transaction_items
  for insert with check (
    exists (select 1 from public.fin_transactions t where t.id = transaction_id and t.user_id = auth.uid())
  );

create policy "fin_transaction_items_update_via_transaction" on public.fin_transaction_items
  for update using (
    exists (select 1 from public.fin_transactions t where t.id = transaction_id and t.user_id = auth.uid())
  );

create policy "fin_transaction_items_delete_via_transaction" on public.fin_transaction_items
  for delete using (
    exists (select 1 from public.fin_transactions t where t.id = transaction_id and t.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Categorias padrão do sistema (user_id null, visíveis para todos)
-- ---------------------------------------------------------------------------
insert into public.fin_categories (name, icon, color, kind) values
  ('Moradia', 'home', '#f97316', 'expense'),
  ('Alimentação', 'utensils', '#22c55e', 'expense'),
  ('Transporte', 'car', '#3b82f6', 'expense'),
  ('Saúde', 'heart-pulse', '#ef4444', 'expense'),
  ('Educação', 'book-open', '#8b5cf6', 'expense'),
  ('Lazer', 'party-popper', '#ec4899', 'expense'),
  ('Compras', 'shopping-bag', '#eab308', 'expense'),
  ('Assinaturas', 'repeat', '#06b6d4', 'expense'),
  ('Pets', 'paw-print', '#84cc16', 'expense'),
  ('Outros', 'more-horizontal', '#6b7280', 'expense'),
  ('Salário', 'wallet', '#16a34a', 'income'),
  ('Extra', 'plus-circle', '#0ea5e9', 'income');
