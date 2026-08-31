-- BASE Sintropia BI v0.4 — oficinas operacionais, participantes, encaminhamentos e RLS específico

create table if not exists public.workshop_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  unit_id uuid not null references public.units(id) on delete restrict,
  group_id uuid references public.groups(id) on delete set null,
  workshop_id uuid references public.workshops(id) on delete set null,
  public_code text not null,
  title_snapshot text not null,
  category_snapshot text,
  session_date date not null,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  objective_snapshot text,
  methodology_snapshot text,
  execution_status text not null default 'planejada' check (execution_status in ('planejada','em_andamento','concluida','cancelada')),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  version integer not null default 1,
  unique (organization_id, public_code)
);

create table if not exists public.workshop_participants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  workshop_session_id uuid not null references public.workshop_sessions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete restrict,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  unique (workshop_session_id, participant_id)
);

alter table public.referrals add column if not exists public_code text;
alter table public.referrals add column if not exists referral_type text;
alter table public.referrals add column if not exists notes text;
create unique index if not exists referrals_org_public_code_unique on public.referrals(organization_id, public_code) where public_code is not null;

alter table public.workshop_sessions enable row level security;
alter table public.workshop_participants enable row level security;

revoke all on table public.workshop_sessions, public.workshop_participants from anon;
grant select, insert, update on table public.workshop_sessions, public.workshop_participants to authenticated;

drop policy if exists workshops_read on public.workshops;
drop policy if exists workshops_write on public.workshops;
drop policy if exists referrals_read on public.referrals;
drop policy if exists referrals_write on public.referrals;

create policy workshops_read_scoped on public.workshops for select to authenticated using (
  public.is_admin()
  or (organization_id = public.current_org_id() and public.current_role() in ('gestor','auditor'))
  or organization_id = public.current_org_id()
);

create policy workshops_write_scoped on public.workshops for all to authenticated using (
  public.is_admin() or (organization_id = public.current_org_id() and public.current_role() in ('orientador','coordenador'))
) with check (
  organization_id = public.current_org_id() and public.current_role() in ('orientador','coordenador','administrador')
);

create policy workshop_sessions_read_scoped on public.workshop_sessions for select to authenticated using (
  public.is_admin()
  or (organization_id = public.current_org_id() and public.current_role() in ('gestor','auditor'))
  or (group_id is not null and public.can_access_group(group_id))
  or (group_id is null and unit_id = public.current_unit_id() and public.current_role() in ('tecnico','coordenador'))
);

create policy workshop_sessions_write_scoped on public.workshop_sessions for all to authenticated using (
  public.is_admin()
  or (organization_id = public.current_org_id() and (
    (group_id is not null and public.can_access_group(group_id))
    or (unit_id = public.current_unit_id() and public.current_role() = 'coordenador')
  ))
) with check (
  organization_id = public.current_org_id()
  and (public.is_admin() or (group_id is not null and public.can_access_group(group_id)) or (unit_id = public.current_unit_id() and public.current_role() = 'coordenador'))
);

create policy workshop_participants_read_scoped on public.workshop_participants for select to authenticated using (
  exists (select 1 from public.workshop_sessions s where s.id = workshop_session_id and (
    public.is_admin() or public.can_access_group(s.group_id) or (s.organization_id = public.current_org_id() and public.current_role() in ('gestor','auditor'))
  ))
);

create policy workshop_participants_write_scoped on public.workshop_participants for all to authenticated using (
  exists (select 1 from public.workshop_sessions s where s.id = workshop_session_id and (public.is_admin() or public.can_access_group(s.group_id)))
) with check (
  organization_id = public.current_org_id()
  and exists (select 1 from public.workshop_sessions s where s.id = workshop_session_id and (public.is_admin() or public.can_access_group(s.group_id)))
);

create policy referrals_read_scoped on public.referrals for select to authenticated using (
  public.is_admin()
  or public.can_access_participant(participant_id)
  or (organization_id = public.current_org_id() and unit_id = public.current_unit_id() and public.current_role() in ('tecnico','coordenador'))
  or (organization_id = public.current_org_id() and public.current_role() in ('gestor','auditor') and false)
);

create policy referrals_write_scoped on public.referrals for all to authenticated using (
  public.is_admin()
  or public.can_access_participant(participant_id)
  or (organization_id = public.current_org_id() and unit_id = public.current_unit_id() and public.current_role() in ('tecnico','coordenador'))
) with check (
  organization_id = public.current_org_id()
  and (public.is_admin() or public.can_access_participant(participant_id) or (unit_id = public.current_unit_id() and public.current_role() in ('tecnico','coordenador')))
);

create trigger trg_workshop_sessions_touch before update on public.workshop_sessions for each row execute function public.touch_updated_at();
