import { Car, DoorOpen, Lock, ParkingCircle, Truck, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SelectField, TextField } from '../../components/ui/FormField';
import { MultiSelectChips } from '../../components/ui/MultiSelectChips';
import { WeeklyTrafficChart } from '../../components/WeeklyTrafficChart';
import { EmployeeManager } from '../../components/EmployeeManager';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { useToast } from '../../components/ui/Toast';
import { employeeService } from '../../services/employeeService';
import { vehicleService } from '../../services/vehicleService';
import type {
  BoPhan,
  CongTyChuQuan,
  DashboardStats,
  DayTraffic,
  MucDichVaoKho,
  NhanVienKiemSoat,
  VehicleRecord,
} from '../../types';
import { joinCongTy, parseCongTy } from '../../utils/congTy';
import { BO_PHAN_OPTIONS, CONG_TY_DANH_SACH, CONG_TY_OPTIONS, MUC_DICH_OPTIONS } from '../../utils/constants';
import { hasInvalidPlateChars, normalizePlate, PLATE_INVALID_MESSAGE } from '../../utils/plateOcr';

const EMPTY_STATS: DashboardStats = {
  xeVaoHomNay: 0,
  xeRaHomNay: 0,
  xeDangTrongKho: 0,
  tongLuotXeHomNay: 0,
  tongNguoiTrongKho: 0,
};

/**
 * Thẻ xe + khu vực xác nhận kiểm soát.
 * Bảo vệ đối chiếu/sửa biển số, CCCD, chọn công ty, tick "Đã kiểm tra", chọn người kiểm soát rồi lưu.
 * Sau khi lưu, thẻ bị KHÓA hoàn toàn — không sửa hay bỏ xác nhận được nữa.
 */
function VehicleControlCard({
  record,
  employees,
  onSaved,
}: {
  record: VehicleRecord;
  employees: NhanVienKiemSoat[];
  onSaved: (updated: VehicleRecord) => void;
}) {
  const { showError, showSuccess } = useToast();
  const [bienSo, setBienSo] = useState<string>(record.bien_so_xe);
  const [plateError, setPlateError] = useState<string | null>(null);
  const [soCccd, setSoCccd] = useState<string>(record.so_cccd ?? '');
  const [congTyList, setCongTyList] = useState<string[]>(() => parseCongTy(record.cong_ty));
  const [congTyChuQuan, setCongTyChuQuan] = useState<string>(record.cong_ty_chu_quan);
  const [boPhan, setBoPhan] = useState<string>(record.bo_phan ?? '');
  const [boPhanKhac, setBoPhanKhac] = useState<string>(record.bo_phan_khac ?? '');
  const [mucDich, setMucDich] = useState<string>(record.muc_dich_vao_kho);
  const [noiDungKhac, setNoiDungKhac] = useState<string>(record.noi_dung_khac ?? '');
  const [daKiemTra, setDaKiemTra] = useState<boolean>(!!record.da_kiem_tra);
  const [nhanVien, setNhanVien] = useState<string>(record.nhan_vien_kiem_soat ?? '');
  const [saving, setSaving] = useState(false);

  const locked = !!record.da_kiem_tra;
  const missingEmployee = daKiemTra && !nhanVien;
  // Lưu = xác nhận đã kiểm tra, nên bắt buộc tick + chọn nhân viên + có biển số.
  // Cùng quy tắc với form đăng ký xe vào.
  const isCbCongTy = congTyChuQuan === 'CB công ty';
  const detailsValid =
    congTyChuQuan.length > 0 &&
    (!isCbCongTy || !!boPhan) &&
    (!isCbCongTy || boPhan !== 'Khác' || !!boPhanKhac.trim()) &&
    mucDich.length > 0 &&
    (mucDich !== 'Khác' || !!noiDungKhac.trim());
  const canSave = !locked && daKiemTra && !!nhanVien && !!bienSo && detailsValid && !saving;

  // Công ty đã lưu mà không còn trong danh sách cố định vẫn được giữ lại để hiển thị/bỏ chọn.
  const congTyOptions = [...CONG_TY_DANH_SACH, ...congTyList.filter((v) => !CONG_TY_DANH_SACH.includes(v as never))];

  const names = employees.map((e) => e.ho_ten);
  // Giữ hiển thị nếu nhân viên đã lưu trước đó đã bị xóa khỏi danh mục.
  const employeeOptions = nhanVien && !names.includes(nhanVien) ? [nhanVien, ...names] : names;

  async function handleSave() {
    if (!canSave) return;
    if (!window.confirm('Xác nhận thông tin đã đúng?\nSau khi lưu sẽ không thể sửa lại.')) return;
    setSaving(true);
    try {
      const updated = await vehicleService.updateControl(record.id, {
        bien_so_xe: bienSo,
        so_cccd: soCccd.trim(),
        cong_ty_chu_quan: congTyChuQuan as CongTyChuQuan,
        bo_phan: isCbCongTy ? (boPhan as BoPhan) : null,
        bo_phan_khac: isCbCongTy && boPhan === 'Khác' ? boPhanKhac.trim() : null,
        muc_dich_vao_kho: mucDich as MucDichVaoKho,
        noi_dung_khac: mucDich === 'Khác' ? noiDungKhac.trim() : null,
        cong_ty: joinCongTy(congTyList, congTyOptions),
        da_kiem_tra: true,
        nhan_vien_kiem_soat: nhanVien,
        thoi_gian_kiem_tra: new Date().toISOString(),
      });
      onSaved(updated);
      showSuccess('Đã lưu thông tin kiểm soát');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Không thể lưu thông tin kiểm soát.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="!p-4">
      <div className="flex items-center justify-between">
        <span className="rounded-xl bg-gray-900 px-2.5 py-1 text-sm font-bold tracking-wide text-white">
          {record.bien_so_xe}
        </span>
        <span className="text-xs font-medium text-gray-400">
          {new Date(record.thoi_gian_vao).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      <div className="mt-2 text-sm font-semibold text-gray-800">{record.ho_ten_tai_xe}</div>
      <div className="text-xs text-gray-500">{record.cong_ty_chu_quan}</div>

      <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
        <TextField
          label="Biển số xe"
          required
          disabled={locked}
          value={bienSo}
          onChange={(e) => {
            setPlateError(hasInvalidPlateChars(e.target.value) ? PLATE_INVALID_MESSAGE : null);
            setBienSo(normalizePlate(e.target.value));
          }}
          error={plateError ?? (!bienSo ? 'Biển số xe không được để trống.' : undefined)}
        />
        <TextField
          label="Số CCCD"
          inputMode="numeric"
          placeholder="012345678901"
          disabled={locked}
          value={soCccd}
          onChange={(e) => setSoCccd(e.target.value)}
        />
        <SelectField
          label="Công ty chủ quản"
          required
          options={CONG_TY_OPTIONS}
          disabled={locked}
          value={congTyChuQuan}
          onChange={(e) => {
            setCongTyChuQuan(e.target.value);
            setBoPhan('');
            setBoPhanKhac('');
          }}
        />
        {isCbCongTy && (
          <SelectField
            label="Bộ phận"
            required
            options={BO_PHAN_OPTIONS}
            placeholder="Chọn bộ phận"
            disabled={locked}
            value={boPhan}
            onChange={(e) => {
              setBoPhan(e.target.value);
              setBoPhanKhac('');
            }}
          />
        )}
        {isCbCongTy && boPhan === 'Khác' && (
          <TextField
            label="Tên bộ phận khác"
            required
            placeholder="Nhập tên bộ phận"
            disabled={locked}
            value={boPhanKhac}
            onChange={(e) => setBoPhanKhac(e.target.value)}
          />
        )}
        <MultiSelectChips
          label="Công ty"
          hint="Có thể chọn nhiều công ty"
          options={congTyOptions}
          value={congTyList}
          onChange={setCongTyList}
          disabled={locked}
        />
        <SelectField
          label="Mục đích vào kho"
          required
          options={MUC_DICH_OPTIONS}
          disabled={locked}
          value={mucDich}
          onChange={(e) => {
            setMucDich(e.target.value);
            setNoiDungKhac('');
          }}
        />
        {mucDich === 'Khác' && (
          <TextField
            label="Nội dung khác"
            required
            placeholder="Mô tả mục đích"
            disabled={locked}
            value={noiDungKhac}
            onChange={(e) => setNoiDungKhac(e.target.value)}
          />
        )}

        <label
          className={[
            'flex items-center gap-3 rounded-2xl border-2 border-gray-200 bg-gray-50 p-3',
            locked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer',
          ].join(' ')}
        >
          <input
            type="checkbox"
            className="h-6 w-6 shrink-0 accent-green-600"
            checked={daKiemTra}
            disabled={locked}
            onChange={(e) => setDaKiemTra(e.target.checked)}
          />
          <span className="flex-1 text-sm font-semibold text-gray-800">Đã kiểm tra</span>
          {locked && (
            <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
              <Lock size={14} />
              {record.thoi_gian_kiem_tra
                ? new Date(record.thoi_gian_kiem_tra).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Đã khóa'}
            </span>
          )}
        </label>

        <SelectField
          label="Nhân viên kiểm soát"
          required={daKiemTra}
          options={employeeOptions}
          placeholder="Chọn nhân viên kiểm soát"
          disabled={locked}
          value={nhanVien}
          onChange={(e) => setNhanVien(e.target.value)}
          error={missingEmployee ? 'Vui lòng chọn nhân viên kiểm soát.' : undefined}
        />

        <Button size="md" onClick={handleSave} disabled={!canSave}>
          {saving ? 'Đang lưu...' : locked ? 'Đã lưu' : 'Lưu kiểm soát'}
        </Button>
        {!locked && !daKiemTra && (
          <p className="text-center text-xs text-gray-400">
            Tick "Đã kiểm tra" và chọn nhân viên để lưu.
          </p>
        )}
      </div>
    </Card>
  );
}

export function SecurityDashboardPage() {
  const { showError } = useToast();
  const [employees, setEmployees] = useState<NhanVienKiemSoat[]>([]);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [showEmployeeManager, setShowEmployeeManager] = useState(false);
  const [weekly, setWeekly] = useState<DayTraffic[] | null>(null);
  const [weeklyError, setWeeklyError] = useState(false);

  const loadWeekly = useCallback(async () => {
    try {
      setWeekly(await vehicleService.getWeeklyTraffic(7));
      setWeeklyError(false);
    } catch {
      setWeeklyError(true);
    }
  }, []);

  // Biểu đồ nhiều truy vấn hơn nên làm mới thưa hơn các thẻ thống kê (10 phút/lần).
  useEffect(() => {
    loadWeekly();
    const interval = setInterval(loadWeekly, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadWeekly]);

  const loadEmployees = useCallback(async () => {
    try {
      setEmployees(await employeeService.list());
      setEmployeeError(null);
    } catch (err) {
      setEmployeeError(err instanceof Error ? err.message : 'Không thể tải danh mục nhân viên.');
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [active, setActive] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([
        vehicleService.getDashboardStats(),
        vehicleService.listActive(),
      ]);
      setStats(s);
      setActive(a);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Không thể tải dữ liệu dashboard.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // light auto-refresh
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="min-h-full pb-28">
      <PageHeader title="Ghi nhận ra vào kho" subtitle="Tổng quan hoạt động kho hôm nay" />

      <div className="-mt-2 space-y-4 px-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Xe vào hôm nay" value={stats.xeVaoHomNay} icon={Car} tone="orange" />
          <StatCard label="Xe ra hôm nay" value={stats.xeRaHomNay} icon={DoorOpen} tone="green" />
          <StatCard label="Xe đang trong kho" value={stats.xeDangTrongKho} icon={ParkingCircle} tone="green" />
          <StatCard label="Tổng lượt xe hôm nay" value={stats.tongLuotXeHomNay} icon={Truck} tone="orange" />
        </div>

        <Card className="flex items-center gap-4 !p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">
            <Users size={24} />
          </div>
          <div>
            <div className="text-3xl font-extrabold tracking-tight text-gray-900">
              {stats.tongNguoiTrongKho}
            </div>
            <div className="text-sm font-medium text-gray-500">
              Tổng số người hiện đang trong kho (tài xế + người đi cùng)
            </div>
          </div>
        </Card>

        <Card className="!p-5">
          <h2 className="mb-1 text-base font-bold text-gray-800">Lượng xe ra vào 7 ngày qua</h2>
          {weekly ? (
            <WeeklyTrafficChart
              data={weekly.map((d, i) =>
                // Điểm của hôm nay lấy trực tiếp từ các thẻ thống kê để luôn khớp.
                i === weekly.length - 1 && !loading
                  ? { ...d, vao: stats.xeVaoHomNay, ra: stats.xeRaHomNay }
                  : d
              )}
            />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              {weeklyError ? 'Không tải được biểu đồ.' : 'Đang tải biểu đồ...'}
            </p>
          )}
        </Card>

        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-gray-800">Xe đang trong kho</h2>
            <button
              type="button"
              onClick={() => setShowEmployeeManager(true)}
              className="text-sm font-semibold text-orange-500 active:text-orange-600"
            >
              Quản lý nhân viên
            </button>
          </div>
          {employeeError && <p className="mb-2 px-1 text-xs font-medium text-red-500">{employeeError}</p>}

          {loading && <Card className="text-center text-sm text-gray-400">Đang tải...</Card>}

          {!loading && active.length === 0 && (
            <Card className="text-center text-sm text-gray-400">Hiện không có xe nào trong kho.</Card>
          )}

          <div className="space-y-3">
            {active.map((r) => (
              <VehicleControlCard
                key={r.id}
                record={r}
                employees={employees}
                onSaved={(updated) =>
                  setActive((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
                }
              />
            ))}
          </div>
        </div>
      </div>

      {showEmployeeManager && (
        <EmployeeManager
          employees={employees}
          onChanged={loadEmployees}
          onClose={() => setShowEmployeeManager(false)}
        />
      )}
    </div>
  );
}
