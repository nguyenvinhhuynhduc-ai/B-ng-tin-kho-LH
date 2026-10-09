import { supabase } from '../lib/supabase';
import type {
  CheckInPayload,
  ControlUpdate,
  DayTraffic,
  DashboardStats,
  VehicleRecord,
  VehicleFilters,
} from '../types';

const TABLE = 'vehicle_records';

/** Bỏ ký tự đặc biệt của bộ lọc PostgREST (`,` `(` `)` `*` `%` `\\`) khỏi chuỗi tìm kiếm. */
function sanitizeSearch(raw: string): string {
  return raw.replace(/[,()*%\\]/g, ' ').trim();
}

/** Tìm theo biển số HOẶC số CCCD. */
function searchFilter(term: string): string {
  return `bien_so_xe.ilike.%${term}%,so_cccd.ilike.%${term}%`;
}

/** GD-YYYYMMDD-HHMMSS */
function generateMaGiaoDich(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `GD-${y}${m}${d}-${hh}${mm}${ss}`;
}

function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export const vehicleService = {
  /** Trang 2: đăng ký xe vào kho. */
  async checkIn(payload: CheckInPayload): Promise<VehicleRecord> {
    const record = {
      ma_giao_dich: generateMaGiaoDich(),
      ...payload,
      thoi_gian_vao: new Date().toISOString(),
      thoi_gian_ra: null,
      tong_thoi_gian_luu_kho: null,
      trang_thai: 'Đang trong kho' as const,
    };

    const { data, error } = await supabase
      .from(TABLE)
      .insert(record)
      .select()
      .single();

    if (error) throw new Error(`Không thể đăng ký xe vào: ${error.message}`);
    return data as VehicleRecord;
  },

  /** Trang 4: tìm xe đang trong kho theo biển số. */
  async findActiveByPlate(bienSoXe: string): Promise<VehicleRecord | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('trang_thai', 'Đang trong kho')
      .ilike('bien_so_xe', bienSoXe.trim())
      .order('thoi_gian_vao', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Không thể tìm xe: ${error.message}`);
    return data as VehicleRecord | null;
  },

  /** Security exit — QR method: tìm xe đang trong kho theo mã giao dịch từ QR. */
  async findActiveByTransactionId(maGiaoDich: string): Promise<VehicleRecord | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('trang_thai', 'Đang trong kho')
      .eq('ma_giao_dich', maGiaoDich.trim())
      .maybeSingle();

    if (error) throw new Error(`Không thể tìm xe: ${error.message}`);
    return data as VehicleRecord | null;
  },

  /** Trang 4: xác nhận xe ra khỏi kho. */
  async checkOut(id: string, nhanVienKiemSoatRa: string): Promise<VehicleRecord> {
    if (!nhanVienKiemSoatRa.trim()) {
      throw new Error('Vui lòng chọn nhân viên kiểm soát xe ra.');
    }

    const { data: existing, error: findError } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      throw new Error('Không tìm thấy bản ghi xe trong kho.');
    }

    const thoiGianRa = new Date();
    const thoiGianVao = new Date(existing.thoi_gian_vao);
    const tongPhut = Math.max(
      0,
      Math.round((thoiGianRa.getTime() - thoiGianVao.getTime()) / 60000)
    );

    const { data, error } = await supabase
      .from(TABLE)
      .update({
        thoi_gian_ra: thoiGianRa.toISOString(),
        trang_thai: 'Đã ra khỏi kho',
        nhan_vien_kiem_soat_ra: nhanVienKiemSoatRa.trim(),
        tong_thoi_gian_luu_kho: tongPhut,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Không thể ghi nhận xe ra: ${error.message}`);
    return data as VehicleRecord;
  },

  /** Dashboard: bảo vệ chọn công ty, tick đã kiểm tra, chọn người kiểm soát. */
  async updateControl(id: string, input: ControlUpdate): Promise<VehicleRecord> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Không thể lưu thông tin kiểm soát: ${error.message}`);
    return data as VehicleRecord;
  },

  /** Trang 1: danh sách xe đang trong kho. */
  async listActive(): Promise<VehicleRecord[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('trang_thai', 'Đang trong kho')
      .order('thoi_gian_vao', { ascending: false });

    if (error) throw new Error(`Không thể tải danh sách xe: ${error.message}`);
    return (data ?? []) as VehicleRecord[];
  },

  /** Trang 1: KPI dashboard. */
  async getDashboardStats(): Promise<DashboardStats> {
    const todayStart = startOfTodayISO();

    const [inToday, outToday, active] = await Promise.all([
      supabase
        .from(TABLE)
        .select('id', { count: 'exact', head: true })
        .gte('thoi_gian_vao', todayStart),
      supabase
        .from(TABLE)
        .select('id', { count: 'exact', head: true })
        .gte('thoi_gian_ra', todayStart),
      supabase
        .from(TABLE)
        .select('so_luong_nguoi_di_cung')
        .eq('trang_thai', 'Đang trong kho'),
    ]);

    if (inToday.error) throw new Error(inToday.error.message);
    if (outToday.error) throw new Error(outToday.error.message);
    if (active.error) throw new Error(active.error.message);

    const xeDangTrongKho = active.data?.length ?? 0;
    const tongNguoiDiCung = (active.data ?? []).reduce(
      (sum, r) => sum + (r.so_luong_nguoi_di_cung ?? 0),
      0
    );

    return {
      xeVaoHomNay: inToday.count ?? 0,
      xeRaHomNay: outToday.count ?? 0,
      xeDangTrongKho,
      tongLuotXeHomNay: (inToday.count ?? 0) + (outToday.count ?? 0),
      // tài xế đang trong kho + số người đi cùng
      tongNguoiTrongKho: xeDangTrongKho + tongNguoiDiCung,
    };
  },

  /** Biểu đồ Dashboard: lượng xe vào/ra mỗi ngày trong `days` ngày gần nhất (gồm hôm nay). */
  async getWeeklyTraffic(days = 7): Promise<DayTraffic[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const slots = Array.from({ length: days }, (_, i) => {
      const start = new Date(today);
      start.setDate(today.getDate() - (days - 1 - i));
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      return { start, end };
    });

    return Promise.all(
      slots.map(async ({ start, end }) => {
        const [vao, ra] = await Promise.all([
          supabase
            .from(TABLE)
            .select('id', { count: 'exact', head: true })
            .gte('thoi_gian_vao', start.toISOString())
            .lt('thoi_gian_vao', end.toISOString()),
          supabase
            .from(TABLE)
            .select('id', { count: 'exact', head: true })
            .gte('thoi_gian_ra', start.toISOString())
            .lt('thoi_gian_ra', end.toISOString()),
        ]);
        if (vao.error) throw new Error(vao.error.message);
        if (ra.error) throw new Error(ra.error.message);

        const mm = String(start.getMonth() + 1).padStart(2, '0');
        const dd = String(start.getDate()).padStart(2, '0');
        return { date: `${start.getFullYear()}-${mm}-${dd}`, vao: vao.count ?? 0, ra: ra.count ?? 0 };
      })
    );
  },

  /** Trang 5: danh sách xe có tìm kiếm / lọc / phân trang. */
  async listRecords(
    filters: VehicleFilters,
    page: number,
    pageSize: number
  ): Promise<{ records: VehicleRecord[]; total: number }> {
    let query = supabase.from(TABLE).select('*', { count: 'exact' });

    const term = sanitizeSearch(filters.search);
    if (term) {
      query = query.or(searchFilter(term));
    }
    if (filters.date) {
      const start = new Date(`${filters.date}T00:00:00`);
      const end = new Date(`${filters.date}T23:59:59.999`);
      query = query.gte('thoi_gian_vao', start.toISOString()).lte('thoi_gian_vao', end.toISOString());
    }
    if (filters.congTy !== 'Tất cả') {
      query = query.eq('cong_ty_chu_quan', filters.congTy);
    }
    if (filters.trangThai !== 'Tất cả') {
      query = query.eq('trang_thai', filters.trangThai);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('thoi_gian_vao', { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Không thể tải danh sách: ${error.message}`);
    return { records: (data ?? []) as VehicleRecord[], total: count ?? 0 };
  },

  /** Xuất Excel: lấy toàn bộ bản ghi khớp bộ lọc (không phân trang). */
  async listAllForExport(filters: VehicleFilters): Promise<VehicleRecord[]> {
    let query = supabase.from(TABLE).select('*');

    const term = sanitizeSearch(filters.search);
    if (term) {
      query = query.or(searchFilter(term));
    }
    if (filters.date) {
      const start = new Date(`${filters.date}T00:00:00`);
      const end = new Date(`${filters.date}T23:59:59.999`);
      query = query.gte('thoi_gian_vao', start.toISOString()).lte('thoi_gian_vao', end.toISOString());
    }
    if (filters.congTy !== 'Tất cả') {
      query = query.eq('cong_ty_chu_quan', filters.congTy);
    }
    if (filters.trangThai !== 'Tất cả') {
      query = query.eq('trang_thai', filters.trangThai);
    }

    const { data, error } = await query.order('thoi_gian_vao', { ascending: false });
    if (error) throw new Error(`Không thể xuất dữ liệu: ${error.message}`);
    return (data ?? []) as VehicleRecord[];
  },
};
