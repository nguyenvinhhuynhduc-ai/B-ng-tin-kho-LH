import * as XLSX from 'xlsx';
import type { VehicleRecord } from '../types';

function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('vi-VN');
}

function formatDuration(minutes: number | null): string {
  if (minutes == null) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
}

const COLUMN_HEADERS: Record<keyof VehicleRecord, string> = {
  id: 'ID',
  ma_giao_dich: 'Mã giao dịch',
  bien_so_xe: 'Biển số xe',
  ho_ten_tai_xe: 'Họ tên tài xế',
  so_cccd: 'Số CCCD',
  so_dien_thoai: 'Số điện thoại',
  so_luong_nguoi_di_cung: 'Số lượng người đi cùng',
  cong_ty_chu_quan: 'Công ty chủ quản',
  bo_phan: 'Bộ phận',
  bo_phan_khac: 'Bộ phận khác',
  muc_dich_vao_kho: 'Mục đích vào kho',
  noi_dung_khac: 'Nội dung khác',
  thoi_gian_vao: 'Thời gian vào',
  thoi_gian_ra: 'Thời gian ra',
  tong_thoi_gian_luu_kho: 'Tổng thời gian lưu kho',
  trang_thai: 'Trạng thái',
  da_cam_ket: 'Đã cam kết',
  created_at: 'Ngày tạo',
  cong_ty: 'Công ty',
  nhan_vien_kiem_soat: 'Nhân viên kiểm soát',
  da_kiem_tra: 'Đã kiểm tra',
  thoi_gian_kiem_tra: 'Thời gian kiểm tra',
  nhan_vien_kiem_soat_ra: 'Nhân viên kiểm soát xe ra',
};

export const exportService = {
  exportToExcel(records: VehicleRecord[]): void {
    const rows = records.map((r) => ({
      [COLUMN_HEADERS.ma_giao_dich]: r.ma_giao_dich,
      [COLUMN_HEADERS.bien_so_xe]: r.bien_so_xe,
      [COLUMN_HEADERS.ho_ten_tai_xe]: r.ho_ten_tai_xe,
      [COLUMN_HEADERS.so_cccd]: r.so_cccd,
      [COLUMN_HEADERS.so_dien_thoai]: r.so_dien_thoai,
      [COLUMN_HEADERS.so_luong_nguoi_di_cung]: r.so_luong_nguoi_di_cung,
      [COLUMN_HEADERS.cong_ty_chu_quan]: r.cong_ty_chu_quan,
      [COLUMN_HEADERS.cong_ty]: r.cong_ty ?? '',
      [COLUMN_HEADERS.bo_phan]: r.bo_phan ?? '',
      [COLUMN_HEADERS.bo_phan_khac]: r.bo_phan_khac ?? '',
      [COLUMN_HEADERS.muc_dich_vao_kho]: r.muc_dich_vao_kho,
      [COLUMN_HEADERS.noi_dung_khac]: r.noi_dung_khac ?? '',
      [COLUMN_HEADERS.thoi_gian_vao]: formatDateTime(r.thoi_gian_vao),
      [COLUMN_HEADERS.thoi_gian_ra]: formatDateTime(r.thoi_gian_ra),
      [COLUMN_HEADERS.tong_thoi_gian_luu_kho]: formatDuration(r.tong_thoi_gian_luu_kho),
      [COLUMN_HEADERS.trang_thai]: r.trang_thai,
      [COLUMN_HEADERS.da_cam_ket]: r.da_cam_ket ? 'Có' : 'Không',
      [COLUMN_HEADERS.nhan_vien_kiem_soat]: r.nhan_vien_kiem_soat ?? '',
      [COLUMN_HEADERS.da_kiem_tra]: r.da_kiem_tra ? 'Có' : 'Không',
      [COLUMN_HEADERS.nhan_vien_kiem_soat_ra]: r.nhan_vien_kiem_soat_ra ?? '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Reasonable column widths so the export is readable without manual resize.
    worksheet['!cols'] = [
      { wch: 20 }, // mã giao dịch
      { wch: 12 }, // biển số
      { wch: 22 }, // tài xế
      { wch: 14 }, // cccd
      { wch: 14 }, // sđt
      { wch: 10 }, // số người đi cùng
      { wch: 18 }, // công ty chủ quản
      { wch: 34 }, // công ty (có thể nhiều)
      { wch: 14 }, // bộ phận
      { wch: 16 }, // bộ phận khác
      { wch: 16 }, // mục đích
      { wch: 20 }, // nội dung khác
      { wch: 20 }, // thời gian vào
      { wch: 20 }, // thời gian ra
      { wch: 16 }, // tổng thời gian
      { wch: 16 }, // trạng thái
      { wch: 10 }, // cam kết
      { wch: 20 }, // nhân viên kiểm soát
      { wch: 12 }, // đã kiểm tra
      { wch: 24 }, // nhân viên kiểm soát xe ra
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'VehicleRecords');

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const filename = `VehicleRecords_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.xlsx`;

    XLSX.writeFile(workbook, filename);
  },
};
