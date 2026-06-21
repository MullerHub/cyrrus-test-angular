-- Schema SQL de referencia (PostgreSQL)
-- Objetivo: representar o dominio vacinal infantil em 3FN.

create table responsible (
  id uuid primary key,
  full_name varchar(120) not null,
  email varchar(120) unique,
  phone varchar(30),
  created_at timestamptz not null default now()
);

create table child (
  id uuid primary key,
  responsible_id uuid not null references responsible(id) on delete restrict,
  full_name varchar(120) not null,
  birth_date date not null,
  created_at timestamptz not null default now()
);

create table vaccine (
  id uuid primary key,
  name varchar(120) not null unique,
  disease varchar(120) not null,
  notes text,
  active boolean not null default true
);

create table vaccine_dose (
  id uuid primary key,
  vaccine_id uuid not null references vaccine(id) on delete restrict,
  dose_number int not null check (dose_number > 0),
  min_age_months int not null check (min_age_months >= 0),
  recommended_until_months int,
  min_interval_days int,
  unique (vaccine_id, dose_number)
);

create table vaccination_campaign (
  id uuid primary key,
  title varchar(160) not null,
  description text,
  start_date date not null,
  end_date date not null,
  target_min_age_months int,
  target_max_age_months int,
  check (end_date >= start_date)
);

create table campaign_vaccine (
  campaign_id uuid not null references vaccination_campaign(id) on delete cascade,
  vaccine_id uuid not null references vaccine(id) on delete restrict,
  primary key (campaign_id, vaccine_id)
);

create table pre_vaccination_map (
  id uuid primary key,
  child_id uuid not null references child(id) on delete cascade,
  vaccine_dose_id uuid not null references vaccine_dose(id) on delete restrict,
  filled_at timestamptz not null default now(),
  had_fever boolean not null default false,
  has_flu_symptoms boolean not null default false,
  has_allergy_history boolean not null default false,
  is_using_medication boolean not null default false,
  had_recent_hospitalization boolean not null default false,
  observations text,
  recommendation varchar(20) not null check (recommendation in ('CLEAR', 'ATTENTION', 'BLOCKED')),
  recommended_by varchar(120)
);

create table child_vaccine_application (
  id uuid primary key,
  child_id uuid not null references child(id) on delete cascade,
  vaccine_dose_id uuid not null references vaccine_dose(id) on delete restrict,
  scheduled_date date not null,
  applied_date date,
  status varchar(20) not null check (status in ('PENDING', 'APPLIED', 'OVERDUE')),
  batch_number varchar(50),
  health_unit varchar(120),
  pre_vaccination_map_id uuid references pre_vaccination_map(id) on delete set null,
  campaign_id uuid references vaccination_campaign(id) on delete set null,
  check (
    (status = 'APPLIED' and applied_date is not null) or
    (status in ('PENDING', 'OVERDUE') and applied_date is null)
  ),
  unique (child_id, vaccine_dose_id)
);

create index idx_child_responsible_id on child(responsible_id);
create index idx_vaccine_dose_vaccine_id on vaccine_dose(vaccine_id);
create index idx_pre_vaccination_map_child_id on pre_vaccination_map(child_id);
create index idx_pre_vaccination_map_recommendation on pre_vaccination_map(recommendation);
create index idx_child_vaccine_application_child_id on child_vaccine_application(child_id);
create index idx_child_vaccine_application_status on child_vaccine_application(status);
create index idx_vaccination_campaign_period on vaccination_campaign(start_date, end_date);

-- View util para campanhas ativas
create view active_campaigns as
select *
from vaccination_campaign
where current_date between start_date and end_date;

-- View util para pendencias por crianca
create view child_vaccination_pending as
select
  cva.child_id,
  cva.vaccine_dose_id,
  cva.scheduled_date,
  cva.status
from child_vaccine_application cva
where cva.status in ('PENDING', 'OVERDUE');

-- View util para casos que exigem atencao antes da aplicacao
create view pre_vaccination_attention as
select
  pvm.child_id,
  pvm.vaccine_dose_id,
  pvm.filled_at,
  pvm.recommendation,
  pvm.observations
from pre_vaccination_map pvm
where pvm.recommendation in ('ATTENTION', 'BLOCKED');
