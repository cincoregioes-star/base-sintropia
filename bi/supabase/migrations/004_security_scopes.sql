-- BASE Sintropia BI v0.3 — escopos de segurança endurecidos
-- Objetivo: interface e banco obedecem ao menor privilégio.

alter table public.participants add column if not exists unit_id uuid references public.units(id) on delete set null;
alter table public.families add column if not exists unit_id uuid references public.units(id) on delete set null;

create table if not exists public.professional_groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  status public.record_status not null default 'ativo',
  created_at timestamptz not null default now(),
  unique (professional_id, group_id)
);

alter table public.professional_groups enable row level security;

revoke all on table public.families, public.participants, public.participant_addresses,
  public.groups, public.group_members, public.professional_groups,
  public.attendance_sessions, public.attendance_records, public.workshops,
  public.referrals, public.alerts, public.audit_logs from anon;

grant select, insert, update on table public.families, public.participants,
  public.participant_addresses, public.group_members, public.attendance_sessions,
  public.attendance_records, public.referrals to authenticated;

grant select on table public.groups, public.workshops, public.alerts to authenticated;
grant select, insert, update on table public.groups, public.workshops to authenticated;
grant select on table public.professional_groups to authenticated;
grant select on table public.audit_logs to authenticated;

create or replace function public.can_access_group(p_group_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    public.is_admin()
    or public.current_role() in ('gestor','auditor')
    or exists (
      select 1 from public.groups g
      where g.id = p_group_id
        and g.organization_id = public.current_org_id()
        and public.current_role() in ('tecnico','coordenador')
        and g.unit_id = public.current_unit_id()
    )
    or exists (
      select 1 from public.professional_groups pg
      where pg.professional_id = auth.uid()
        and pg.group_id = p_group_id
        and pg.status = 'ativo'
    ), false
  );
$$;

create or replace function public.can_access_participant(p_participant_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    public.is_admin()
    or exists (
      select 1 from public.participants p
      where p.id = p_participant_id
        and p.organization_id = public.current_org_id()
        and (
          (public.current_role() in ('tecnico','coordenador') and p.unit_id = public.current_unit_id())
          or (
            public.current_role() = 'orientador'
            and exists (
              select 1
              from public.group_members gm
              join public.professional_groups pg on pg.group_id = gm.group_id
              where gm.participant_id = p.id
                and gm.left_at is null and gm.status = 'ativo'
                and pg.professional_id = auth.uid() and pg.status = 'ativo'
            )
          )
        )
    ), false
  );
$$;

drop policy if exists participants_read on public.participants;
drop policy if exists participants_insert on public.participants;
drop policy if exists participants_update on public.participants;
drop policy if exists families_read on public.families;
drop policy if exists families_write on public.families;
drop policy if exists groups_read on public.groups;
drop policy if exists groups_write on public.groups;
drop policy if exists memberships_read on public.group_members;
drop policy if exists memberships_write on public.group_members;
drop policy if exists attendance_sessions_read on public.attendance_sessions;
drop policy if exists attendance_sessions_write on public.attendance_sessions;
drop policy if exists attendance_records_read on public.attendance_records;
drop policy if exists attendance_records_write on public.attendance_records;

create policy participants_read_scoped on public.participants for select to authenticated using (
  public.can_access_participant(id)
  or (public.current_role() in ('gestor','auditor') and false)
);

create policy participants_insert_scoped on public.participants for insert to authenticated with check (
  organization_id = public.current_org_id()
  and public.current_role() in ('orientador','tecnico','coordenador','administrador')
  and (public.is_admin() or unit_id = public.current_unit_id())
);

create policy participants_update_scoped on public.participants for update to authenticated using (
  public.can_access_participant(id)
) with check (
  organization_id = public.current_org_id()
  and (public.is_admin() or unit_id = public.current_unit_id())
);

create policy families_read_scoped on public.families for select to authenticated using (
  public.is_admin()
  or (public.current_role() in ('tecnico','coordenador') and organization_id = public.current_org_id() and unit_id = public.current_unit_id())
  or exists (
    select 1 from public.participants p
    where p.family_id = families.id and public.can_access_participant(p.id)
  )
);

create policy families_insert_scoped on public.families for insert to authenticated with check (
  organization_id = public.current_org_id()
  and public.current_role() in ('orientador','tecnico','coordenador','administrador')
  and (public.is_admin() or unit_id = public.current_unit_id())
);

create policy families_update_scoped on public.families for update to authenticated using (
  public.is_admin()
  or (organization_id = public.current_org_id() and unit_id = public.current_unit_id() and public.current_role() in ('tecnico','coordenador'))
  or exists (select 1 from public.participants p where p.family_id = families.id and public.can_access_participant(p.id))
) with check (organization_id = public.current_org_id());

create policy groups_read_scoped on public.groups for select to authenticated using (
  public.is_admin()
  or (organization_id = public.current_org_id() and public.current_role() in ('gestor','auditor'))
  or (organization_id = public.current_org_id() and unit_id = public.current_unit_id() and public.current_role() in ('tecnico','coordenador'))
  or public.can_access_group(id)
);

create policy groups_write_scoped on public.groups for all to authenticated using (
  public.is_admin()
  or (organization_id = public.current_org_id() and unit_id = public.current_unit_id() and public.current_role() = 'coordenador')
) with check (
  organization_id = public.current_org_id()
  and (public.is_admin() or (unit_id = public.current_unit_id() and public.current_role() = 'coordenador'))
);

create policy professional_groups_read on public.professional_groups for select to authenticated using (
  public.is_admin()
  or professional_id = auth.uid()
  or (organization_id = public.current_org_id() and public.current_role() in ('coordenador','gestor','auditor'))
);

create policy memberships_read_scoped on public.group_members for select to authenticated using (public.can_access_group(group_id));
create policy memberships_write_scoped on public.group_members for all to authenticated using (
  public.can_access_group(group_id) and public.current_role() in ('orientador','tecnico','coordenador','administrador')
) with check (
  organization_id = public.current_org_id() and public.can_access_group(group_id)
);

create policy attendance_sessions_read_scoped on public.attendance_sessions for select to authenticated using (public.can_access_group(group_id));
create policy attendance_sessions_write_scoped on public.attendance_sessions for all to authenticated using (
  public.can_access_group(group_id) and public.current_role() in ('orientador','tecnico','coordenador','administrador')
) with check (
  organization_id = public.current_org_id() and public.can_access_group(group_id)
);

create policy attendance_records_read_scoped on public.attendance_records for select to authenticated using (
  exists (select 1 from public.attendance_sessions s where s.id = attendance_session_id and public.can_access_group(s.group_id))
);
create policy attendance_records_write_scoped on public.attendance_records for all to authenticated using (
  exists (select 1 from public.attendance_sessions s where s.id = attendance_session_id and public.can_access_group(s.group_id))
) with check (
  organization_id = public.current_org_id()
  and exists (select 1 from public.attendance_sessions s where s.id = attendance_session_id and public.can_access_group(s.group_id))
);
