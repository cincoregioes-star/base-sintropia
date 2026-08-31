-- BASE Sintropia BI V0.5 Intelligence
-- Catálogo oficial de KPI + memória de decisões.

create table if not exists public.kpi_definitions (
  id text primary key,
  key text unique not null,
  name text not null,
  definition text not null,
  unit text not null,
  source text not null,
  version text not null default '1.0',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  signal_id text not null,
  title text not null,
  category text not null,
  status text not null default 'em_analise' check (status in ('em_analise','decidida','monitorando','encerrada')),
  impact smallint not null check (impact between 0 and 10),
  urgency smallint not null check (urgency between 0 and 10),
  confidence numeric(5,2) not null check (confidence between 0 and 100),
  evidence jsonb not null default '[]'::jsonb,
  decision_text text,
  expected_result text,
  due_date date,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  version integer not null default 1
);

create unique index if not exists decisions_one_open_signal_per_org
  on public.decisions(organization_id, signal_id)
  where status <> 'encerrada';

alter table public.kpi_definitions enable row level security;
alter table public.decisions enable row level security;

create policy "kpi definitions authenticated read"
  on public.kpi_definitions for select
  to authenticated using (is_active = true);

create policy "decisions organization read"
  on public.decisions for select
  to authenticated
  using (organization_id = public.current_org_id());

create policy "decisions management write"
  on public.decisions for all
  to authenticated
  using (
    organization_id = public.current_org_id()
    and public.current_role() in ('coordenador','gestor','administrador')
  )
  with check (
    organization_id = public.current_org_id()
    and public.current_role() in ('coordenador','gestor','administrador')
  );

insert into public.kpi_definitions(id,key,name,definition,unit,source,version) values
('KPI-001','participantsActive','Usuários ativos','Participantes cujo status não é inativo.','count','participants','1.0'),
('KPI-002','groupsActive','Grupos ativos','Grupos com status ativo.','count','groups','1.0'),
('KPI-003','averageAttendance','Frequência média','Presenças divididas pelo total de registros válidos.','percent','attendance','1.0'),
('KPI-004','workshopsTotal','Oficinas registradas','Total de oficinas no escopo.','count','workshops','1.0'),
('KPI-005','openReferrals','Encaminhamentos em aberto','Encaminhamentos não concluídos.','count','referrals','1.0'),
('KPI-006','overdueReferrals','Encaminhamentos vencidos','Encaminhamentos em aberto com prazo anterior à data atual.','count','referrals','1.0'),
('KPI-007','alertsActive','Alertas operacionais','Sinais ativos derivados pelo Early Warning System.','count','intelligence_rules','1.0'),
('KPI-008','dataQualityScore','Saúde dos dados','Índice composto de qualidade dos cadastros.','score','data_quality','1.0')
on conflict (id) do update set
  name=excluded.name, definition=excluded.definition, unit=excluded.unit, source=excluded.source, version=excluded.version, updated_at=now();
