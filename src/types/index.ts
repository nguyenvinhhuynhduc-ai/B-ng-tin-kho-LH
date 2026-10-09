// ============================================================
// WAREHOUSE GUARDIAN — Core domain types
// ============================================================

export type TrangThai = 'Đang trong kho' | 'Đã ra khỏi kho';

export type CongTyChuQuan =
  | 'CB công ty'
  | 'Toàn Dân'
  | 'Nhà thầu'
  | 'Khách'
  | 'ĐV do người mua thuê'
  | 'Xe Container';

/** Danh sách "Công ty" (dropdown cố định). */
export type CongTy = 'Smarting' | 'Asia Shine' | 'Sapharchem' | 'Novalab';

export type BoPhan =
  | 'Kho vận'
  | 'Kế hoạch'
  | 'Mua hàng'
  | 'Bán hàng'
  | 'Chất lượng'
  | 'An toàn'
  | 'Nhân sự'
  | 'IT'
  | 'Tài chính'
  | 'Khác';

export type MucDichVaoKho =
  | 'Giao hàng'
  | 'Lấy hàng'
  | 'Tham quan kho'
  | 'Thanh tra'
  | 'Khác';

/** Maps 1:1 to the `vehicle_records` table in Supabase. */
export interface VehicleRecord {
  id: string;
  ma_giao_dich: string;
  bien_so_xe: string;
  ho_ten_tai_xe: string;
  so_cccd: string;
  so_dien_thoai: string;
  so_luong_nguoi_di_cung: number;
  cong_ty_chu_quan: CongTyChuQuan;
  bo_phan: BoPhan | null;
  bo_phan_khac: string | null;
  muc_dich_vao_kho: MucDichVaoKho;
  noi_dung_khac: string | null;
  thoi_gian_vao: string; // ISO timestamp
  thoi_gian_ra: string | null; // ISO timestamp
  tong_thoi_gian_luu_kho: number | null; // minutes
  trang_thai: TrangThai;
  da_cam_ket: boolean;
  created_at: string;
  /** Cột mới — bản ghi cũ sẽ là null/undefined. */
  /** Có thể nhiều công ty, lưu dạng chuỗi nối bằng ", " (xem utils/congTy.ts). */
  cong_ty?: string | null;
  nhan_vien_kiem_soat?: string | null;
  da_kiem_tra?: boolean | null;
  thoi_gian_kiem_tra?: string | null;
  /** Nhân viên kiểm soát lúc xe ra (chọn ở màn hình Xác nhận xe ra). */
  nhan_vien_kiem_soat_ra?: string | null;
}

/** Bảo vệ cập nhật kiểm soát cho xe đang trong kho (Dashboard). */
export interface ControlUpdate {
  bien_so_xe: string;
  so_cccd: string;
  cong_ty_chu_quan: CongTyChuQuan;
  bo_phan: BoPhan | null;
  bo_phan_khac: string | null;
  muc_dich_vao_kho: MucDichVaoKho;
  noi_dung_khac: string | null;
  cong_ty: string | null;
  da_kiem_tra: boolean;
  nhan_vien_kiem_soat: string | null;
  thoi_gian_kiem_tra: string | null;
}

/** Payload used when registering a new vehicle entry (Trang 2). */
export interface CheckInPayload {
  bien_so_xe: string;
  ho_ten_tai_xe: string;
  so_cccd: string;
  so_dien_thoai: string;
  so_luong_nguoi_di_cung: number;
  cong_ty_chu_quan: CongTyChuQuan;
  bo_phan: BoPhan | null;
  bo_phan_khac: string | null;
  muc_dich_vao_kho: MucDichVaoKho;
  noi_dung_khac: string | null;
  da_cam_ket: boolean;
}

/** Danh mục nhân viên kiểm soát (bảng `nhan_vien_kiem_soat`). */
export interface NhanVienKiemSoat {
  id: string;
  ho_ten: string;
  created_at: string;
}

/** Lượng xe vào/ra của một ngày (theo giờ địa phương của thiết bị). */
export interface DayTraffic {
  /** YYYY-MM-DD */
  date: string;
  vao: number;
  ra: number;
}

export interface DashboardStats {
  xeVaoHomNay: number;
  xeRaHomNay: number;
  xeDangTrongKho: number;
  tongLuotXeHomNay: number;
  tongNguoiTrongKho: number;
}

export interface VehicleFilters {
  search: string;
  date: string | null; // yyyy-mm-dd
  congTy: CongTyChuQuan | 'Tất cả';
  trangThai: TrangThai | 'Tất cả';
}

export interface CccdQrData {
  hoTen?: string;
  soCccd?: string;
  ngaySinh?: string;
}
