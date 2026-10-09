import type { BoPhan, CongTy, CongTyChuQuan, MucDichVaoKho } from '../types';

export const CONG_TY_OPTIONS: CongTyChuQuan[] = [
  'CB công ty',
  'Toàn Dân',
  'Nhà thầu',
  'Khách',
  'ĐV do người mua thuê',
  'Xe Container',
];

export const CONG_TY_DANH_SACH: CongTy[] = [
  'Smarting',
  'Asia Shine',
  'Sapharchem',
  'Novalab',
];

export const BO_PHAN_OPTIONS: BoPhan[] = [
  'Kho vận',
  'Kế hoạch',
  'Mua hàng',
  'Bán hàng',
  'Chất lượng',
  'An toàn',
  'Nhân sự',
  'IT',
  'Tài chính',
  'Khác',
];

export const MUC_DICH_OPTIONS: MucDichVaoKho[] = [
  'Giao hàng',
  'Lấy hàng',
  'Tham quan kho',
  'Thanh tra',
  'Khác',
];

export const NOI_QUY_ITEMS: string[] = [
  'Xuất trình CCCD khi vào kho.',
  'Tốc độ tối đa 10 km/h.',
  'Thắt dây an toàn.',
  'Cấm hút thuốc và mọi nguồn gây cháy nổ.',
  'Đỗ xe đúng vị trí.',
  'Tuân thủ quy tắc an toàn khi lên xuống xe.',
  'Không tự ý vào khu vực xe nâng hoạt động.',
  'Tuân thủ hướng dẫn của nhân viên kho.',
  'Bắt buộc mặc áo phản quang.',
];
