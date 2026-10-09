-- ============================================================
-- Migration (bổ sung): nhân viên kiểm soát lúc XE RA — bắt buộc & khóa
-- 1) Thêm cột nhan_vien_kiem_soat_ra (NULL cho bản ghi cũ).
-- 2) Khi chuyển trạng thái sang 'Đã ra khỏi kho' PHẢI có nhân viên kiểm soát xe ra
--    (chặn cả app/PWA bản cũ chưa cập nhật).
-- 3) Đã ghi nhân viên kiểm soát xe ra thì KHÔNG được sửa/xóa nữa.
-- Idempotent — chạy lại nhiều lần an toàn. Không đổi dữ liệu cũ.
-- ============================================================
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
