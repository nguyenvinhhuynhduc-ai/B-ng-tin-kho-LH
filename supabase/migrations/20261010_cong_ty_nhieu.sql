-- ============================================================
-- Migration (bổ sung):
--  1) Công ty cho phép chọn NHIỀU (cột cong_ty giữ kiểu text, nối bằng ", ").
--  2) Đổi tên "Hóa Dược Sài Gòn" -> "Sapharchem" trong dữ liệu cũ.
--  3) Mở rộng khóa sau khi "Đã kiểm tra": ngoài biển số/CCCD/công ty/nhân viên,
--     khóa thêm công ty chủ quản, bộ phận, mục đích vào kho (bảo vệ chỉ được sửa
--     các trường này TRƯỚC khi lưu).
-- Idempotent — chạy lại nhiều lần an toàn. Chạy SAU 20261009_nvks_xe_ra.sql.
-- ============================================================

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


-- Đổi tên công ty trong dữ liệu cũ: tắt khóa tạm thời để cập nhật cả xe đã kiểm tra,
-- rồi bật lại ngay ở lệnh cuối của đoạn này.
alter table public.vehicle_records disable trigger trg_prevent_uncheck_kiem_tra;

update public.vehicle_records
   set cong_ty = replace(cong_ty, 'Hóa Dược Sài Gòn', 'Sapharchem')
 where cong_ty like '%Hóa Dược Sài Gòn%';

alter table public.vehicle_records enable trigger trg_prevent_uncheck_kiem_tra;

notify pgrst, 'reload schema';
