-- Forja · esquema inicial (Postgres / Supabase)
-- Un documento de estado por usuario (JSONB), protegido por Row Level Security.
-- La app carga todo el estado en memoria y calcula el progreso en cliente,
-- por lo que una sola tabla por usuario es suficiente, robusto y rápido.

create table if not exists app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table app_state enable row level security;

drop policy if exists "own_select" on app_state;
drop policy if exists "own_insert" on app_state;
drop policy if exists "own_update" on app_state;
drop policy if exists "own_delete" on app_state;

create policy "own_select" on app_state for select using (auth.uid() = user_id);
create policy "own_insert" on app_state for insert with check (auth.uid() = user_id);
create policy "own_update" on app_state for update using (auth.uid() = user_id);
create policy "own_delete" on app_state for delete using (auth.uid() = user_id);
