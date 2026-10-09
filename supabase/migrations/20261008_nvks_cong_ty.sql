-- ============================================================
-- Migration: Nhân viên kiểm soát + Công ty
-- CHỈ THÊM MỚI (idempotent) — không sửa/xóa dữ liệu hay cột hiện có.
-- Chạy trong Supabase SQL Editor trước khi deploy bản app mới.
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
