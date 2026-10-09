-- ============================================================
-- WAREHOUSE GUARDIAN — Supabase schema
-- Run this in the Supabase SQL editor for a new project.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.vehicle_records (
  id                       uuid primary key default gen_random_uuid(),
  ma_giao_dich             text not null unique,
  bien_so_xe               text not null,
  ho_ten_tai_xe            text not null,
  so_cccd                  text not null,
  so_dien_thoai            text not null,
  so_luong_nguoi_di_cung   integer not null default 0 check (so_luong_nguoi_di_cung between 0 and 50),
  cong_ty_chu_quan         text not null,
  bo_phan                  text,
  bo_phan_khac             text,
  muc_dich_vao_kho         text not null,
  noi_dung_khac            text,
  thoi_gian_vao            timestamptz not null default now(),
  thoi_gian_ra             timestamptz,
  tong_thoi_gian_luu_kho   integer, -- minutes
  trang_thai               text not null default 'Đang trong kho' check (trang_thai in ('Đang trong kho', 'Đã ra khỏi kho')),
  da_cam_ket               boolean not null default false,
  created_at               timestamptz not null default now()
);

create index if not exists idx_vehicle_records_bien_so on public.vehicle_records (bien_so_xe);
create index if not exists idx_vehicle_records_trang_thai on public.vehicle_records (trang_thai);
create index if not exists idx_vehicle_records_thoi_gian_vao on public.vehicle_records (thoi_gian_vao desc);

-- ------------------------------------------------------------
-- Row Level Security
-- The app has no login, so the anon key needs read/write access.
-- This is appropriate for a trusted, single-purpose kiosk app
-- deployed behind a private/internal URL. Tighten as needed.
-- ------------------------------------------------------------
alter table public.vehicle_records enable row level security;

create policy "Anon can read vehicle records"
  on public.vehicle_records for select
  to anon
  using (true);

create policy "Anon can insert vehicle records"
  on public.vehicle_records for insert
  to anon
  with check (true);

create policy "Anon can update vehicle records"
  on public.vehicle_records for update
  to anon
  using (true)
  with check (true);

-- ------------------------------------------------------------
-- Realtime (optional): lets the Dashboard update live across devices.
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.vehicle_records;

-- ============================================================
-- Bổ sung (2026-10-08): Nhân viên kiểm soát + Công ty
-- ============================================================
-- 1) Cột mới trên vehicle_records (cho phép NULL → tương thích bản ghi cũ)
alter table public.vehicle_records
  add column if not exists cong_ty text,
  add column if not exists nhan_vien_kiem_soat text;

-- 2) Danh mục nhân viên kiểm soát
create table if not exists public.nhan_vien_kiem_soat (
  id         uuid primary key default gen_random_uuid(),
  ho_ten     text not null check (length(btrim(ho_ten)) > 0),
  created_at timestamptz not null default now()
);

create unique index if not exists uq_nhan_vien_kiem_soat_ho_ten
  on public.nhan_vien_kiem_soat (lower(btrim(ho_ten)));

alter table public.nhan_vien_kiem_soat enable row level security;

drop policy if exists "Anon can read nhan vien kiem soat" on public.nhan_vien_kiem_soat;
drop policy if exists "Anon can insert nhan vien kiem soat" on public.nhan_vien_kiem_soat;
drop policy if exists "Anon can update nhan vien kiem soat" on public.nhan_vien_kiem_soat;
drop policy if exists "Anon can delete nhan vien kiem soat" on public.nhan_vien_kiem_soat;

create policy "Anon can read nhan vien kiem soat"
  on public.nhan_vien_kiem_soat for select to anon using (true);
create policy "Anon can insert nhan vien kiem soat"
  on public.nhan_vien_kiem_soat for insert to anon with check (true);
create policy "Anon can update nhan vien kiem soat"
  on public.nhan_vien_kiem_soat for update to anon using (true) with check (true);
create policy "Anon can delete nhan vien kiem soat"
  on public.nhan_vien_kiem_soat for delete to anon using (true);

-- Bổ sung: đánh dấu đã kiểm tra (bảo vệ xác nhận ở Dashboard)
alter table public.vehicle_records
  add column if not exists da_kiem_tra boolean not null default false,
  add column if not exists thoi_gian_kiem_tra timestamptz;

-- Bổ sung: khóa thông tin kiểm soát sau khi đã kiểm tra
create or replace function public.prevent_uncheck_kiem_tra()
returns trigger
language plpgsql
as $$
begin
  if old.da_kiem_tra is true and (
       new.da_kiem_tra          is distinct from old.da_kiem_tra
    or new.bien_so_xe           is distinct from old.bien_so_xe
    or new.so_cccd              is distinct from old.so_cccd
    or new.cong_ty              is distinct from old.cong_ty
    or new.nhan_vien_kiem_soat  is distinct from old.nhan_vien_kiem_soat
    or new.thoi_gian_kiem_tra   is distinct from old.thoi_gian_kiem_tra
    or new.cong_ty_chu_quan     is distinct from old.cong_ty_chu_quan
    or new.bo_phan              is distinct from old.bo_phan
    or new.bo_phan_khac         is distinct from old.bo_phan_khac
    or new.muc_dich_vao_kho     is distinct from old.muc_dich_vao_kho
    or new.noi_dung_khac        is distinct from old.noi_dung_khac
  ) then
    raise exception 'Xe đã được xác nhận kiểm tra, không thể sửa đổi.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_uncheck_kiem_tra on public.vehicle_records;
create trigger trg_prevent_uncheck_kiem_tra
  before update on public.vehicle_records
  for each row execute function public.prevent_uncheck_kiem_tra();

notify pgrst, 'reload schema';

-- Bổ sung: nhân viên kiểm soát lúc xe ra (bắt buộc & khóa)
alter table public.vehicle_records
  add column if not exists nhan_vien_kiem_soat_ra text;

create or replace function public.enforce_nvks_xe_ra()
returns trigger
language plpgsql
as $$
begin
  if new.trang_thai = 'Đã ra khỏi kho'
     and old.trang_thai is distinct from new.trang_thai
     and (new.nhan_vien_kiem_soat_ra is null or btrim(new.nhan_vien_kiem_soat_ra) = '') then
    raise exception 'Phải chọn nhân viên kiểm soát xe ra trước khi xác nhận xe ra.';
  end if;

  if old.nhan_vien_kiem_soat_ra is not null
     and new.nhan_vien_kiem_soat_ra is distinct from old.nhan_vien_kiem_soat_ra then
    raise exception 'Đã xác nhận xe ra, không thể thay đổi nhân viên kiểm soát xe ra.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_nvks_xe_ra on public.vehicle_records;
create trigger trg_enforce_nvks_xe_ra
  before update on public.vehicle_records
  for each row execute function public.enforce_nvks_xe_ra();

notify pgrst, 'reload schema';
