import { CheckCircle2, IdCard, ScanLine, Search } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SelectField, TextField } from '../../components/ui/FormField';
import { useToast } from '../../components/ui/Toast';
import { employeeService } from '../../services/employeeService';
import { vehicleService } from '../../services/vehicleService';
import type { NhanVienKiemSoat, VehicleRecord } from '../../types';
import { hasInvalidPlateChars, normalizePlate, PLATE_INVALID_MESSAGE, PLATE_PLACEHOLDER } from '../../utils/plateOcr';

const ExitQrScanner = lazy(() => import('../../components/ExitQrScanner').then((m) => ({ default: m.ExitQrScanner })));
const PlateScanner = lazy(() => import('../../components/PlateScanner').then((m) => ({ default: m.PlateScanner })));

function ScannerLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-sm text-white/70">
      Đang tải camera...
    </div>
  );
}

type Method = 'qr' | 'plate' | 'manual';

const METHOD_TABS: { key: Method; label: string; icon: typeof IdCard }[] = [
  { key: 'qr', label: 'QR xe vào', icon: IdCard },
  { key: 'plate', label: 'Biển số', icon: ScanLine },
  { key: 'manual', label: 'Nhập tay', icon: Search },
];

export function SecurityExitPage() {
  const { showError, showSuccess } = useToast();
  const [method, setMethod] = useState<Method>('qr');
  const [manualInput, setManualInput] = useState('');
  const [plateError, setPlateError] = useState<string | null>(null);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showPlateScanner, setShowPlateScanner] = useState(false);
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<VehicleRecord | null>(null);
  const [notFoundChecked, setNotFoundChecked] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [employees, setEmployees] = useState<NhanVienKiemSoat[]>([]);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [nhanVienRa, setNhanVienRa] = useState<string>('');

  const loadEmployees = useCallback(async () => {
    try {
      const list = await employeeService.list();
      setEmployees(list);
      setEmployeeError(null);
      // Nhân viên đã chọn trước đó nếu đã bị xóa khỏi danh mục thì bỏ chọn.
      setNhanVienRa((cur) => (cur && !list.some((e) => e.ho_ten === cur) ? '' : cur));
    } catch (err) {
      setEmployeeError(err instanceof Error ? err.message : 'Không thể tải danh mục nhân viên.');
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Mỗi xe phải chọn lại nhân viên kiểm soát — không dùng lại lựa chọn của xe trước.
  useEffect(() => {
    setNhanVienRa('');
  }, [found?.id]);

  async function searchByPlate(plate: string) {
    if (!plate.trim() || searching) return;
    setSearching(true);
    setNotFoundChecked(false);
    setFound(null);
    try {
      const record = await vehicleService.findActiveByPlate(plate);
      setFound(record);
      setNotFoundChecked(true);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Không thể tìm xe.');
    } finally {
      setSearching(false);
    }
  }

  async function searchByTransactionId(maGiaoDich: string) {
    setSearching(true);
    setNotFoundChecked(false);
    setFound(null);
    try {
      const record = await vehicleService.findActiveByTransactionId(maGiaoDich);
      setFound(record);
      setNotFoundChecked(true);
      if (!record) {
        showError('Mã QR hợp lệ nhưng không tìm thấy xe đang trong kho khớp với mã này.');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Không thể tìm xe.');
    } finally {
      setSearching(false);
    }
  }

  async function confirmCheckOut() {
    if (!found || confirming) return;
    if (!nhanVienRa) {
      showError('Vui lòng chọn nhân viên kiểm soát xe ra.');
      return;
    }
    setConfirming(true);
    try {
      await vehicleService.checkOut(found.id, nhanVienRa);
      setDone(true);
      showSuccess('Đã ghi nhận xe ra');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Không thể ghi nhận xe ra.');
    } finally {
      setConfirming(false);
    }
  }

  function resetForm() {
    setManualInput('');
    setFound(null);
    setNotFoundChecked(false);
    setDone(false);
    setNhanVienRa('');
  }

  if (done && found) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 pb-24 pt-16 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
          <CheckCircle2 size={44} />
        </div>
        <h1 className="text-xl font-extrabold text-gray-900">Đã ghi nhận xe ra</h1>
        <p className="mt-2 text-sm text-gray-500">
          Biển số <span className="font-bold text-gray-800">{found.bien_so_xe}</span> đã rời kho.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Nhân viên kiểm soát: <span className="font-bold text-gray-800">{nhanVienRa}</span>
        </p>
        <div className="mt-8 w-full max-w-sm">
          <Button onClick={resetForm}>Xác nhận xe khác</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-28">
      <PageHeader title="Xác nhận xe ra" subtitle="Chọn cách thức xác định xe" />

      <div className="-mt-2 space-y-4 px-4">
        <div className="grid grid-cols-3 gap-2">
          {METHOD_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setMethod(key);
                setFound(null);
                setNotFoundChecked(false);
                setPlateError(null);
              }}
              className={[
                'flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3 text-xs font-bold transition-colors',
                method === key
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-500',
              ].join(' ')}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>

        {method === 'qr' && (
          <Card className="text-center">
            <p className="mb-3 text-sm text-gray-500">
              Quét mã QR trên điện thoại tài xế để tự động tìm xe.
            </p>
            <Button icon={<IdCard size={20} />} onClick={() => setShowQrScanner(true)}>
              Quét QR xe vào
            </Button>
          </Card>
        )}

        {method === 'plate' && (
          <Card className="text-center">
            <p className="mb-3 text-sm text-gray-500">
              Chụp ảnh biển số xe để tự động nhận diện.
            </p>
            <Button icon={<ScanLine size={20} />} onClick={() => setShowPlateScanner(true)}>
              Quét biển số xe
            </Button>
          </Card>
        )}

        {method === 'manual' && (
          <Card>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <TextField
                  label="Biển số xe"
                  placeholder={PLATE_PLACEHOLDER}
                  value={manualInput}
                  onChange={(e) => {
                    setPlateError(hasInvalidPlateChars(e.target.value) ? PLATE_INVALID_MESSAGE : null);
                    setManualInput(normalizePlate(e.target.value));
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && searchByPlate(manualInput)}
                  error={plateError ?? undefined}
                />
              </div>
              <Button
                variant="primary"
                fullWidth={false}
                className="!w-14 !px-0"
                icon={<Search size={20} />}
                onClick={() => searchByPlate(manualInput)}
                disabled={!manualInput.trim() || searching}
                aria-label="Tìm xe"
              >
                <></>
              </Button>
            </div>
          </Card>
        )}

        {searching && <Card className="text-center text-sm text-gray-400">Đang tìm...</Card>}

        {!searching && notFoundChecked && !found && (
          <Card className="text-center text-sm text-gray-500">
            Không tìm thấy xe đang trong kho khớp với thông tin này.
          </Card>
        )}

        {found && (
          <Card>
            <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-gray-400">
              Thông tin xe
            </h2>
            <div className="space-y-2.5 text-sm">
              <Row label="Mã giao dịch" value={found.ma_giao_dich} />
              <Row label="Biển số xe" value={found.bien_so_xe} emphasize />
              <Row label="Tên tài xế" value={found.ho_ten_tai_xe} />
              <Row label="Số CCCD" value={found.so_cccd} />
              <Row label="Số điện thoại" value={found.so_dien_thoai} />
              <Row label="Số lượng người đi cùng" value={String(found.so_luong_nguoi_di_cung)} />
              <Row label="Công ty chủ quản" value={found.cong_ty_chu_quan} />
              {found.cong_ty && <Row label="Công ty" value={found.cong_ty} />}
              {(found.da_kiem_tra || found.nhan_vien_kiem_soat) && (
                <Row
                  label="Kiểm soát"
                  value={`${found.da_kiem_tra ? 'Đã kiểm tra' : 'Chưa kiểm tra'}${found.nhan_vien_kiem_soat ? ` · ${found.nhan_vien_kiem_soat}` : ''}`}
                />
              )}
              <Row label="Mục đích" value={found.muc_dich_vao_kho} />
              <Row label="Thời gian vào" value={new Date(found.thoi_gian_vao).toLocaleString('vi-VN')} />
            </div>

            <div className="mt-5 space-y-2">
              <SelectField
                label="Nhân viên kiểm soát xe ra"
                required
                options={employees.map((e) => e.ho_ten)}
                placeholder="Chọn nhân viên kiểm soát"
                value={nhanVienRa}
                onChange={(e) => setNhanVienRa(e.target.value)}
                error={employeeError ?? undefined}
              />
              {!nhanVienRa && !employeeError && (
                <p className="text-xs text-amber-600">
                  {employees.length === 0
                    ? 'Chưa có nhân viên nào. Thêm ở Dashboard → Quản lý nhân viên.'
                    : 'Bắt buộc chọn nhân viên kiểm soát trước khi xác nhận xe ra.'}
                </p>
              )}
            </div>

            <div className="mt-4">
              <Button onClick={confirmCheckOut} disabled={confirming || !nhanVienRa}>
                {confirming ? 'Đang xử lý...' : 'Xác nhận xe ra'}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {showQrScanner && (
        <Suspense fallback={<ScannerLoading />}>
          <ExitQrScanner
            onDetected={(maGiaoDich) => {
              setShowQrScanner(false);
              searchByTransactionId(maGiaoDich);
            }}
            onClose={() => setShowQrScanner(false)}
          />
        </Suspense>
      )}

      {showPlateScanner && (
        <Suspense fallback={<ScannerLoading />}>
          <PlateScanner
            onDetected={(plate) => {
              setManualInput(plate);
              setShowPlateScanner(false);
              searchByPlate(plate);
            }}
            onClose={() => setShowPlateScanner(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
      <span className="text-gray-500">{label}</span>
      <span className={emphasize ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}>{value}</span>
    </div>
  );
}
