create table public.onibus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  nome text not null check (char_length(nome) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (user_id, nome)
);
grant select, insert, update, delete on public.onibus to authenticated;
grant all on public.onibus to service_role;
alter table public.onibus enable row level security;
create policy "own onibus" on public.onibus for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.motoristas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  nome text not null check (char_length(nome) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (user_id, nome)
);
grant select, insert, update, delete on public.motoristas to authenticated;
grant all on public.motoristas to service_role;
alter table public.motoristas enable row level security;
create policy "own motoristas" on public.motoristas for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.abastecimentos add column motorista text check (motorista is null or char_length(motorista) <= 60);
alter table public.abastecimentos add column foto_path text;

create policy "cupons sel own" on storage.objects for select to authenticated using (bucket_id = 'cupons' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cupons ins own" on storage.objects for insert to authenticated with check (bucket_id = 'cupons' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cupons del own" on storage.objects for delete to authenticated using (bucket_id = 'cupons' and (storage.foldername(name))[1] = auth.uid()::text);