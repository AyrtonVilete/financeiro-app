-- Suporte a compras parceladas: cada parcela vira uma linha própria em
-- fin_transactions (datada no mês correspondente), agrupada por
-- installment_group_id para exibir "2/3" etc. e permitir consultas futuras.
alter table public.fin_transactions
  add column installment_group_id uuid,
  add column installment_number smallint,
  add column installment_total smallint;

create index fin_transactions_installment_group_idx
  on public.fin_transactions (installment_group_id)
  where installment_group_id is not null;
