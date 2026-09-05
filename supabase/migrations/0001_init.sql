-- ============================================================
-- WAREHOUSE COMPLIANCE HUB — Supabase / PostgreSQL schema
-- ============================================================
-- Run in Supabase SQL editor, or via `supabase db push`.
-- Order: extensions -> types -> tables -> indexes -> views
--        -> functions -> triggers -> RLS policies
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- ENUM TYPES
-- ------------------------------------------------------------
create type user_role as enum ('admin', 'user');

create type equipment_status as enum ('pending', 'due_soon', 'completed', 'overdue', 'cancelled');

create type audit_status as enum ('planned', 'in_progress', 'closed', 'overdue', 'cancelled');
create type audit_priority as enum ('low', 'medium', 'high', 'critical');
create type finding_severity as enum ('minor', 'major', 'critical');
create type finding_status as enum ('open', 'in_progress', 'closed');

create type announcement_category as enum
  ('announcement', 'meeting', 'training', 'audit', 'inspection', 'safety', 'policy', 'event');
create type announcement_status as enum ('draft', 'published', 'archived');

create type notification_module as enum ('equipment', 'audit', 'announcement');
create type notification_channel as enum ('push', 'in_app');

-- ------------------------------------------------------------
-- TABLE: users  (mirrors auth.users, adds app-level profile/role)
-- ------------------------------------------------------------
create table users (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null,
  email         text not null unique,
  phone         text,
  role          user_role not null default 'user',
  fcm_token     text,                         -- Firebase Cloud Messaging device token
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABLE: equipments
-- ------------------------------------------------------------
create table equipments (
  id                uuid primary key default uuid_generate_v4(),
  equipment_code    text not null unique,
  equipment_name    text not null,
  category          text not null,             -- Xe nâng / Bình chữa cháy / Cân điện tử / Chống sét / Hệ thống PCCC / Cửa cuốn / Thiết bị kho
  warehouse         text not null,
  location          text,
  manufacturer      text,
  vendor            text,
  notes             text,
  is_active         boolean not null default true,
  created_by        uuid references users (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_equipments_category  on equipments (category);
create index idx_equipments_warehouse on equipments (warehouse);

-- ------------------------------------------------------------
-- TABLE: inspections  (one row per inspection cycle for a piece of equipment)
-- ------------------------------------------------------------
create table inspections (
  id                      uuid primary key default uuid_generate_v4(),
  equipment_id            uuid not null references equipments (id) on delete cascade,
  planned_inspection_date date not null,
  expiry_date             date not null,
  inspection_vendor       text,
  inspector               text,

  is_completed            boolean not null default false,
  actual_inspection_date  date,
  completed_by            uuid references users (id),
  completed_at            timestamptz,

  status                  equipment_status not null default 'pending',

  created_by              uuid references users (id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint chk_expiry_after_planned check (expiry_date >= planned_inspection_date)
);

create index idx_inspections_equipment on inspections (equipment_id);
create index idx_inspections_expiry    on inspections (expiry_date);
create index idx_inspections_status    on inspections (status);

-- ------------------------------------------------------------
-- TABLE: notification_settings
-- Admin-configurable, per-module warning thresholds (no hard-coding).
-- ------------------------------------------------------------
create table notification_settings (
  id            uuid primary key default uuid_generate_v4(),
  module        notification_module not null,   -- equipment | audit | announcement
  label         text not null,                  -- e.g. '30 ngày', '1 giờ'
  offset_value  integer not null,               -- numeric magnitude
  offset_unit   text not null default 'day',    -- day | hour | minute
  is_active     boolean not null default true,
  created_by    uuid references users (id),
  created_at    timestamptz not null default now(),

  unique (module, offset_value, offset_unit)
);

-- ------------------------------------------------------------
-- TABLE: audits
-- ------------------------------------------------------------
create table audits (
  id            uuid primary key default uuid_generate_v4(),
  audit_code    text not null unique,
  title         text not null,
  audit_type    text not null,        -- Internal / Customer / ISO / Safety / Warehouse Audit
  audit_date    date not null,
  department    text,
  location      text,
  owner_id      uuid references users (id),
  priority      audit_priority not null default 'medium',
  status        audit_status not null default 'planned',
  description   text,

  created_by    uuid references users (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_audits_status on audits (status);
create index idx_audits_date   on audits (audit_date);

-- ------------------------------------------------------------
-- TABLE: audit_findings
-- ------------------------------------------------------------
create table audit_findings (
  id                  uuid primary key default uuid_generate_v4(),
  audit_id            uuid not null references audits (id) on delete cascade,
  finding_number      text not null,
  category            text,
  severity            finding_severity not null default 'minor',
  description         text not null,
  corrective_action   text,
  action_owner_id     uuid references users (id),
  target_date         date,
  status              finding_status not null default 'open',

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (audit_id, finding_number)
);

create index idx_findings_audit on audit_findings (audit_id);

-- ------------------------------------------------------------
-- TABLE: announcements
-- ------------------------------------------------------------
create table announcements (
  id                    uuid primary key default uuid_generate_v4(),
  title                 text not null,
  content               text not null,
  category              announcement_category not null default 'announcement',
  publish_date          timestamptz not null default now(),
  event_date            timestamptz,
  location              text,
  priority              audit_priority not null default 'medium',
  pinned                boolean not null default false,
  status                announcement_status not null default 'published',
  require_ack           boolean not null default false,   -- "Yêu cầu xác nhận đã đọc"

  created_by            uuid references users (id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_announcements_status  on announcements (status);
create index idx_announcements_pinned  on announcements (pinned);

-- ------------------------------------------------------------
-- TABLE: announcement_reads  ("Tôi đã đọc")
-- ------------------------------------------------------------
create table announcement_reads (
  id                uuid primary key default uuid_generate_v4(),
  announcement_id   uuid not null references announcements (id) on delete cascade,
  user_id           uuid not null references users (id) on delete cascade,
  read_at           timestamptz not null default now(),

  unique (announcement_id, user_id)
);

-- ------------------------------------------------------------
-- TABLE: attachments  (shared by equipments / audits / findings / announcements)
-- ------------------------------------------------------------
create table attachments (
  id            uuid primary key default uuid_generate_v4(),
  owner_table   text not null,   -- 'equipments' | 'audits' | 'audit_findings' | 'announcements'
  owner_id      uuid not null,
  file_name     text not null,
  storage_path  text not null,   -- Supabase Storage object path
  mime_type     text,
  file_size     integer,
  uploaded_by   uuid references users (id),
  created_at    timestamptz not null default now()
);

create index idx_attachments_owner on attachments (owner_table, owner_id);

-- ------------------------------------------------------------
-- TABLE: notifications  (generated/queued push + in-app notifications)
-- ------------------------------------------------------------
create table notifications (
  id                uuid primary key default uuid_generate_v4(),
  module            notification_module not null,
  reference_table   text not null,      -- 'inspections' | 'audits' | 'announcements'
  reference_id      uuid not null,
  recipient_id      uuid references users (id),   -- null = broadcast to all users
  channel           notification_channel not null default 'push',
  title             text not null,
  body              text not null,
  scheduled_for     timestamptz not null,
  sent_at           timestamptz,
  is_sent           boolean not null default false,
  created_at        timestamptz not null default now()
);

create index idx_notifications_scheduled on notifications (scheduled_for) where is_sent = false;
create index idx_notifications_recipient on notifications (recipient_id);

-- ------------------------------------------------------------
-- TABLE: activity_logs  (audit trail — who changed what)
-- ------------------------------------------------------------
create table activity_logs (
  id            uuid primary key default uuid_generate_v4(),
  actor_id      uuid references users (id),
  action        text not null,      -- 'create' | 'update' | 'delete' | 'complete_inspection' | ...
  target_table  text not null,
  target_id     uuid,
  details       jsonb,
  created_at    timestamptz not null default now()
);

create index idx_activity_logs_target on activity_logs (target_table, target_id);

-- ============================================================
-- VIEWS
-- ============================================================

-- Equipment + latest inspection, with computed remaining days & live status
create or replace view v_equipment_status as
select
  e.id                        as equipment_id,
  e.equipment_code,
  e.equipment_name,
  e.category,
  e.warehouse,
  i.id                        as inspection_id,
  i.planned_inspection_date,
  i.expiry_date,
  i.is_completed,
  i.actual_inspection_date,
  (i.expiry_date - current_date)::int as remaining_days,
  case
    when i.is_completed = false and i.expiry_date < current_date then 'overdue'
    when i.is_completed = false and (i.expiry_date - current_date) <= 30 then 'due_soon'
    when i.is_completed = true then 'completed'
    else 'pending'
  end as live_status
from equipments e
left join lateral (
  select * from inspections ins
  where ins.equipment_id = e.id
  order by ins.expiry_date desc
  limit 1
) i on true
where e.is_active = true;

-- Inspection variance (Actual - Planned) with human label
create or replace view v_inspection_variance as
select
  id as inspection_id,
  equipment_id,
  planned_inspection_date,
  actual_inspection_date,
  (actual_inspection_date - planned_inspection_date) as variance_days,
  case
    when actual_inspection_date is null then null
    when actual_inspection_date < planned_inspection_date then 'early'
    when actual_inspection_date = planned_inspection_date then 'on_time'
    else 'late'
  end as variance_label
from inspections
where actual_inspection_date is not null;

-- Compliance KPI summary (used by the Dashboard + Equipment KPI cards)
create or replace view v_compliance_kpi as
select
  count(*) filter (where true)                                   as total_equipment,
  count(*) filter (where live_status = 'completed'
                    and equipment_id in (
                      select equipment_id from v_inspection_variance where variance_label = 'early'))
                                                                  as completed_early,
  count(*) filter (where live_status = 'completed'
                    and equipment_id in (
                      select equipment_id from v_inspection_variance where variance_label = 'on_time'))
                                                                  as completed_on_time,
  count(*) filter (where live_status = 'completed'
                    and equipment_id in (
                      select equipment_id from v_inspection_variance where variance_label = 'late'))
                                                                  as completed_late,
  count(*) filter (where live_status = 'pending')                as pending,
  count(*) filter (where live_status = 'overdue')                as overdue,
  round(
    100.0 * count(*) filter (where live_status in ('completed', 'due_soon'))
    / nullif(count(*), 0), 1
  ) as compliance_rate
from v_equipment_status;

-- Announcement read/unread rollup
create or replace view v_announcement_ack as
select
  a.id as announcement_id,
  a.title,
  a.require_ack,
  count(r.id) as read_count,
  (select count(*) from users u where u.is_active) - count(r.id) as unread_count
from announcements a
left join announcement_reads r on r.announcement_id = a.id
group by a.id, a.title, a.require_ack;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Generic updated_at trigger function
create or replace function fn_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Recompute inspection.status whenever relevant columns change
create or replace function fn_refresh_inspection_status()
returns trigger as $$
begin
  if new.is_completed then
    new.status := 'completed';
  elsif new.expiry_date < current_date then
    new.status := 'overdue';
  elsif (new.expiry_date - current_date) <= 30 then
    new.status := 'due_soon';
  else
    new.status := 'pending';
  end if;
  return new;
end;
$$ language plpgsql;

-- When admin ticks "Hoàn thành kiểm định": stamp actual date / completed_by / completed_at
create or replace function fn_complete_inspection()
returns trigger as $$
begin
  if new.is_completed = true and old.is_completed = false then
    new.actual_inspection_date := coalesce(new.actual_inspection_date, current_date);
    new.completed_at := now();
    -- completed_by is expected to be set by the calling application (auth.uid()),
    -- but default to the current session user if not provided.
    new.completed_by := coalesce(new.completed_by, auth.uid());
  end if;
  return new;
end;
$$ language plpgsql;

-- Auto-generate scheduled notifications for an inspection based on
-- admin-configured notification_settings (module = 'equipment').
create or replace function fn_schedule_equipment_notifications(p_inspection_id uuid)
returns void as $$
declare
  v_inspection    inspections%rowtype;
  v_equipment     equipments%rowtype;
  v_setting       notification_settings%rowtype;
  v_scheduled_for timestamptz;
begin
  select * into v_inspection from inspections where id = p_inspection_id;
  select * into v_equipment  from equipments  where id = v_inspection.equipment_id;

  delete from notifications
   where module = 'equipment' and reference_table = 'inspections' and reference_id = p_inspection_id
     and is_sent = false;

  for v_setting in
    select * from notification_settings where module = 'equipment' and is_active = true
  loop
    v_scheduled_for := v_inspection.expiry_date::timestamptz -
      (v_setting.offset_value || ' ' || v_setting.offset_unit)::interval;

    -- Only queue notifications whose fire time is still in the future.
    if v_scheduled_for > now() then
      insert into notifications (module, reference_table, reference_id, channel, title, body, scheduled_for)
      values (
        'equipment', 'inspections', p_inspection_id, 'push',
        v_equipment.equipment_name || ' còn ' || v_setting.offset_value || ' ' ||
          case v_setting.offset_unit when 'day' then 'ngày' when 'hour' then 'giờ' else 'phút' end ||
          ' tới hạn kiểm định',
        'Mã thiết bị: ' || v_equipment.equipment_code,
        v_scheduled_for
      );
    end if;
  end loop;
end;
$$ language plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

create trigger trg_users_updated_at        before update on users        for each row execute function fn_set_updated_at();
create trigger trg_equipments_updated_at   before update on equipments   for each row execute function fn_set_updated_at();
create trigger trg_inspections_updated_at  before update on inspections  for each row execute function fn_set_updated_at();
create trigger trg_audits_updated_at       before update on audits       for each row execute function fn_set_updated_at();
create trigger trg_findings_updated_at     before update on audit_findings for each row execute function fn_set_updated_at();
create trigger trg_announcements_updated  before update on announcements for each row execute function fn_set_updated_at();

create trigger trg_inspection_complete
  before update on inspections
  for each row execute function fn_complete_inspection();

create trigger trg_inspection_status
  before insert or update on inspections
  for each row execute function fn_refresh_inspection_status();

-- Re-schedule equipment notifications after insert/update of an inspection
create or replace function fn_after_inspection_upsert()
returns trigger as $$
begin
  perform fn_schedule_equipment_notifications(new.id);
  return new;
end;
$$ language plpgsql;

create trigger trg_inspection_after_upsert
  after insert or update of planned_inspection_date, expiry_date on inspections
  for each row execute function fn_after_inspection_upsert();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table users                 enable row level security;
alter table equipments             enable row level security;
alter table inspections            enable row level security;
alter table audits                 enable row level security;
alter table audit_findings         enable row level security;
alter table announcements          enable row level security;
alter table announcement_reads     enable row level security;
alter table attachments            enable row level security;
alter table notifications          enable row level security;
alter table notification_settings  enable row level security;
alter table activity_logs          enable row level security;

-- Everyone authenticated can read; only admins can write.
-- Helper: is current user an admin?
create or replace function fn_is_admin()
returns boolean as $$
  select exists (
    select 1 from users where id = auth.uid() and role = 'admin'
  );
$$ language sql stable;

create policy p_users_select        on users               for select using (auth.uid() is not null);
create policy p_equipments_select   on equipments           for select using (auth.uid() is not null);
create policy p_equipments_write    on equipments           for all    using (fn_is_admin()) with check (fn_is_admin());
create policy p_inspections_select  on inspections          for select using (auth.uid() is not null);
create policy p_inspections_write   on inspections          for all    using (fn_is_admin()) with check (fn_is_admin());
create policy p_audits_select       on audits               for select using (auth.uid() is not null);
create policy p_audits_write        on audits               for all    using (fn_is_admin()) with check (fn_is_admin());
create policy p_findings_select     on audit_findings       for select using (auth.uid() is not null);
create policy p_findings_write      on audit_findings       for all    using (fn_is_admin()) with check (fn_is_admin());
create policy p_announcements_sel   on announcements        for select using (auth.uid() is not null);
create policy p_announcements_write on announcements        for all    using (fn_is_admin()) with check (fn_is_admin());
create policy p_reads_select        on announcement_reads   for select using (auth.uid() is not null);
create policy p_reads_insert        on announcement_reads   for insert with check (user_id = auth.uid());
create policy p_attachments_select  on attachments          for select using (auth.uid() is not null);
create policy p_attachments_write   on attachments          for all    using (fn_is_admin()) with check (fn_is_admin());
create policy p_notifications_sel   on notifications        for select using (recipient_id = auth.uid() or recipient_id is null);
create policy p_notif_settings_sel  on notification_settings for select using (auth.uid() is not null);
create policy p_notif_settings_wr   on notification_settings for all    using (fn_is_admin()) with check (fn_is_admin());
create policy p_activity_logs_sel   on activity_logs        for select using (fn_is_admin());
