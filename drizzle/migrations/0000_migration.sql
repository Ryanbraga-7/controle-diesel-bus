create table public.abastecimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  data date not null,
  onibus text not null check (char_length(onibus) between 1 and 40),
  litros numeric(12,3) not null check (litros > 0),
  preco_litro numeric(12,3) not null check (preco_litro >= 0),
  odometro bigint check (odometro is null or odometro >= 0),
  observacao text check (observacao is null or char_length(observacao) <= 120),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.abastecimentos to authenticated;
grant all on public.abastecimentos to service_role;
alter table public.abastecimentos enable row level security;
create policy "sel own" on public.abastecimentos for select to authenticated using (auth.uid() = user_id);
create policy "ins own" on public.abastecimentos for insert to authenticated with check (auth.uid() = user_id);
create policy "upd own" on public.abastecimentos for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "del own" on public.abastecimentos for delete to authenticated using (auth.uid() = user_id);
create index abastecimentos_user_data_idx on public.abastecimentos (user_id, data desc);