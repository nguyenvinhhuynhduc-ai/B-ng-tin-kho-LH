-- ============================================================
-- Migration (bổ sung): đánh dấu "Đã kiểm tra" do bảo vệ xác nhận
-- CHỈ THÊM MỚI (idempotent). Chạy SAU 20261008_nvks_cong_ty.sql
-- (file đó cũng an toàn khi chạy lại nếu bạn chưa chạy).
-- ============================================================
alter table public.vehicle_records
  add column if not exists da_kiem_tra boolean not null default false,
  add column if not exists thoi_gian_kiem_tra timestamptz;
