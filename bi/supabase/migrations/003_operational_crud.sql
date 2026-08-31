-- BASE Sintropia BI v0.3 — núcleo operacional CRUD
-- Complementa a fundação v0.2 sem quebrar o schema anterior.

alter table public.families
  add column if not exists reference_name text,
  add column if not exists phone text;

alter table public.participants
  add column if not exists followup_status text not null default 'regular';

alter table public.participants
  drop constraint if exists participants_followup_status_check;

alter table public.participants
  add constraint participants_followup_status_check
  check (followup_status in ('regular','atencao','prioridade','afastado'));

create index if not exists families_org_reference_idx
  on public.families(organization_id, lower(reference_name));

create index if not exists memberships_participant_active_idx
  on public.group_members(participant_id)
  where left_at is null and status = 'ativo';

create unique index if not exists group_member_participant_group_active_unique
  on public.group_members(participant_id, group_id)
  where left_at is null and status = 'ativo';

create or replace function public.find_possible_participant_duplicates(
  p_organization_id uuid,
  p_full_name text,
  p_birth_date date default null,
  p_cpf text default null,
  p_nis text default null
)
returns table (
  participant_id uuid,
  public_code text,
  full_name text,
  birth_date date,
  match_reason text,
  confidence integer
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.public_code,
    p.full_name,
    p.birth_date,
    case
      when nullif(regexp_replace(coalesce(p_cpf,''), '\\D','','g'),'') is not null
       and regexp_replace(coalesce(p.cpf,''), '\\D','','g') = regexp_replace(p_cpf, '\\D','','g') then 'CPF idêntico'
      when nullif(regexp_replace(coalesce(p_nis,''), '\\D','','g'),'') is not null
       and regexp_replace(coalesce(p.nis,''), '\\D','','g') = regexp_replace(p_nis, '\\D','','g') then 'NIS idêntico'
      when lower(trim(p.full_name)) = lower(trim(p_full_name)) and p.birth_date = p_birth_date then 'Nome e nascimento idênticos'
      when lower(trim(p.full_name)) = lower(trim(p_full_name)) then 'Nome idêntico'
      else 'Possível semelhança'
    end as match_reason,
    case
      when nullif(regexp_replace(coalesce(p_cpf,''), '\\D','','g'),'') is not null
       and regexp_replace(coalesce(p.cpf,''), '\\D','','g') = regexp_replace(p_cpf, '\\D','','g') then 100
      when nullif(regexp_replace(coalesce(p_nis,''), '\\D','','g'),'') is not null
       and regexp_replace(coalesce(p.nis,''), '\\D','','g') = regexp_replace(p_nis, '\\D','','g') then 100
      when lower(trim(p.full_name)) = lower(trim(p_full_name)) and p.birth_date = p_birth_date then 95
      when lower(trim(p.full_name)) = lower(trim(p_full_name)) then 70
      else 0
    end as confidence
  from public.participants p
  where p.organization_id = p_organization_id
    and (
      (nullif(regexp_replace(coalesce(p_cpf,''), '\\D','','g'),'') is not null and regexp_replace(coalesce(p.cpf,''), '\\D','','g') = regexp_replace(p_cpf, '\\D','','g'))
      or (nullif(regexp_replace(coalesce(p_nis,''), '\\D','','g'),'') is not null and regexp_replace(coalesce(p.nis,''), '\\D','','g') = regexp_replace(p_nis, '\\D','','g'))
      or lower(trim(p.full_name)) = lower(trim(p_full_name))
    )
  order by confidence desc, p.full_name;
$$;

create or replace view public.v_participant_current_group
with (security_invoker = true) as
select
  p.organization_id,
  p.id as participant_id,
  p.public_code,
  p.full_name,
  p.family_id,
  p.community_id,
  gm.group_id,
  g.name as group_name,
  g.unit_id,
  p.status as lifecycle_status,
  p.followup_status
from public.participants p
left join public.group_members gm
  on gm.participant_id = p.id
 and gm.left_at is null
 and gm.status = 'ativo'
left join public.groups g on g.id = gm.group_id;
