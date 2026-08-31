-- BASE Sintropia BI V0.6 — explicabilidade, Rule Registry, ausências consecutivas e Decision Journal

alter table public.kpi_definitions add column if not exists formula text;

update public.kpi_definitions set version='1.1', formula=case id
  when 'KPI-001' then 'COUNT(participants WHERE status != inativo)'
  when 'KPI-002' then 'COUNT(groups WHERE status = ativo)'
  when 'KPI-003' then 'presenças / (presenças + faltas + justificadas) × 100'
  when 'KPI-004' then 'COUNT(workshops)'
  when 'KPI-005' then 'COUNT(referrals WHERE status != concluido)'
  when 'KPI-006' then 'COUNT(referrals WHERE status != concluido AND due_date < hoje)'
  when 'KPI-007' then 'COUNT(EarlyWarning.signals WHERE regra_ativa = true)'
  when 'KPI-008' then 'completude×0,65 + unicidade×0,20 + cobertura_territorial×0,15'
  else formula end;

alter table public.decisions add column if not exists rule_id text;
alter table public.decisions add column if not exists rule_version integer;
alter table public.decisions add column if not exists rationale text;
alter table public.decisions add column if not exists action_plan text;
alter table public.decisions add column if not exists owner_text text;
alter table public.decisions add column if not exists outcome text;
alter table public.decisions add column if not exists result_summary text;
alter table public.decisions add column if not exists closed_at timestamptz;

alter table public.decisions drop constraint if exists decisions_status_check;
alter table public.decisions add constraint decisions_status_check check (status in ('em_analise','planejada','em_execucao','monitorando','encerrada','decidida'));

create table if not exists public.alert_rules (
  id text not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rule_key text not null,
  name text not null,
  category text not null,
  description text,
  enabled boolean not null default true,
  threshold numeric,
  secondary_threshold numeric,
  count_justified boolean not null default false,
  severity text not null default 'attention',
  impact smallint not null default 5 check (impact between 0 and 10),
  urgency smallint not null default 5 check (urgency between 0 and 10),
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  primary key (organization_id, id),
  unique (organization_id, rule_key)
);

create table if not exists public.decision_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  decision_id uuid not null references public.decisions(id) on delete cascade,
  event_type text not null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

alter table public.alert_rules enable row level security;
alter table public.decision_events enable row level security;
revoke all on table public.alert_rules, public.decision_events from anon;
grant select, insert, update on table public.alert_rules to authenticated;
grant select, insert on table public.decision_events to authenticated;

create policy "alert rules organization read" on public.alert_rules for select to authenticated using (organization_id = public.current_org_id());
create policy "alert rules management write" on public.alert_rules for all to authenticated using (organization_id = public.current_org_id() and public.current_role() in ('coordenador','gestor','administrador')) with check (organization_id = public.current_org_id() and public.current_role() in ('coordenador','gestor','administrador'));
create policy "decision events organization read" on public.decision_events for select to authenticated using (organization_id = public.current_org_id());
create policy "decision events management insert" on public.decision_events for insert to authenticated with check (organization_id = public.current_org_id() and public.current_role() in ('coordenador','gestor','administrador') and exists (select 1 from public.decisions d where d.id = decision_id and d.organization_id = public.current_org_id()));

create index if not exists decision_events_decision_created_idx on public.decision_events(decision_id, created_at desc);
create index if not exists alert_rules_org_enabled_idx on public.alert_rules(organization_id, enabled);
