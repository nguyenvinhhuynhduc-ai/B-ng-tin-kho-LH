-- ============================================================
-- Migration (bổ sung): đã kiểm tra thì KHÓA thông tin kiểm soát
-- Sau khi da_kiem_tra = true, không được sửa/bỏ các cột kiểm soát.
-- Các cột phục vụ xe ra (thoi_gian_ra, trang_thai, tong_thoi_gian_luu_kho)
-- KHÔNG bị khóa nên luồng xác nhận xe ra vẫn hoạt động bình thường.
-- Idempotent — chạy lại (kể cả khi đã chạy bản trước) đều an toàn.
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

notify pgrst, 'reload schema';
