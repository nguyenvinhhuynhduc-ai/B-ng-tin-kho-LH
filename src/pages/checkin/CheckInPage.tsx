import { ChevronLeft, IdCard, ScanLine } from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { SafetyRulesPoster } from '../../components/SafetyRulesPoster';
import { SecurityQrDisplay } from '../../components/SecurityQrDisplay';

const PlateScanner = lazy(() => import('../../components/PlateScanner').then((m) => ({ default: m.PlateScanner })));
const CccdQrScanner = lazy(() =>
  import('../../components/CccdQrScanner').then((m) => ({ default: m.CccdQrScanner }))
);
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SelectField, TextField } from '../../components/ui/FormField';
import { useToast } from '../../components/ui/Toast';
import { qrCodeService } from '../../services/qrCodeService';
import { vehicleService } from '../../services/vehicleService';
import type { CheckInPayload } from '../../types';
import { BO_PHAN_OPTIONS, CONG_TY_OPTIONS, MUC_DICH_OPTIONS } from '../../utils/constants';
import { hasInvalidPlateChars, normalizePlate, PLATE_INVALID_MESSAGE, PLATE_PLACEHOLDER } from '../../utils/plateOcr';

function ScannerLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-sm text-white/70">
      Đang tải camera...
    </div>
  );
}

const INITIAL_FORM: CheckInPayload = {
  bien_so_xe: '',
  ho_ten_tai_xe: '',
  so_cccd: '',
  so_dien_thoai: '',
  so_luong_nguoi_di_cung: 0,
  cong_ty_chu_quan: 'CB công ty',
  bo_phan: null,
  bo_phan_khac: null,
  muc_dich_vao_kho: 'Giao hàng',
  noi_dung_khac: null,
  da_cam_ket: false,
};

interface SuccessTicket {
  maGiaoDich: string;
  bienSoXe: string;
  qrDataUrl: string;
}

export function CheckInPage() {
  const { showError } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<CheckInPayload>(INITIAL_FORM);
  const [showPlateScanner, setShowPlateScanner] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<SuccessTicket | null>(null);
  const [plateError, setPlateError] = useState<string | null>(null);

  function handlePlateInput(raw: string) {
    if (hasInvalidPlateChars(raw)) {
      setPlateError(PLATE_INVALID_MESSAGE);
    } else {
      setPlateError(null);
    }
    update('bien_so_xe', normalizePlate(raw));
  }

  const update = <K extends keyof CheckInPayload>(key: K, value: CheckInPayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const step1Valid = useMemo(() => {
    return (
      form.bien_so_xe.trim().length > 0 &&
      form.ho_ten_tai_xe.trim().length > 0 &&
      form.cong_ty_chu_quan.length > 0 &&
      (form.cong_ty_chu_quan !== 'CB công ty' || !!form.bo_phan) &&
      (form.bo_phan !== 'Khác' || !!form.bo_phan_khac?.trim()) &&
      form.muc_dich_vao_kho.length > 0 &&
      (form.muc_dich_vao_kho !== 'Khác' || !!form.noi_dung_khac?.trim())
    );
  }, [form]);

  const canSubmit = step1Valid && form.da_cam_ket;

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const record = await vehicleService.checkIn(form);
      const qrDataUrl = await qrCodeService.generateSecurityQrDataUrl(record);
      setTicket({ maGiaoDich: record.ma_giao_dich, bienSoXe: record.bien_so_xe, qrDataUrl });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Đăng ký xe vào thất bại.');
    } finally {
      setSubmitting(false);
    }
  }

  function resetForNext() {
    setForm(INITIAL_FORM);
    setStep(1);
    setTicket(null);
  }

  if (ticket) {
    return (
      <SecurityQrDisplay
        qrDataUrl={ticket.qrDataUrl}
        maGiaoDich={ticket.maGiaoDich}
        bienSoXe={ticket.bienSoXe}
        onRegisterAnother={resetForNext}
      />
    );
  }

  return (
    <div className="min-h-full pb-10">
      <PageHeader
        title="Đăng ký xe vào kho"
        subtitle={step === 1 ? 'Bước 1/2 · Thông tin xe & tài xế' : 'Bước 2/2 · Nội quy an toàn'}
      />

      <div className="-mt-2 space-y-4 px-4">
        {step === 1 && (
          <>
            <Card>
              <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-gray-400">
                Thông tin xe
              </h2>
              <Button variant="secondary" icon={<ScanLine size={20} />} onClick={() => setShowPlateScanner(true)}>
                Quét biển số xe
              </Button>
              <div className="mt-3">
                <TextField
                  label="Biển số xe"
                  required
                  placeholder={PLATE_PLACEHOLDER}
                  value={form.bien_so_xe}
                  onChange={(e) => handlePlateInput(e.target.value)}
                  error={plateError ?? undefined}
                />
              </div>
            </Card>

            <Card>
              <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-gray-400">
                Thông tin tài xế
              </h2>
              <Button variant="secondary" icon={<IdCard size={20} />} onClick={() => setShowQrScanner(true)}>
                Quét QR CCCD / Căn cước
              </Button>
              <div className="mt-3 space-y-3">
                <TextField
                  label="Họ và tên tài xế"
                  required
                  placeholder="Nguyễn Văn A"
                  value={form.ho_ten_tai_xe}
                  onChange={(e) => update('ho_ten_tai_xe', e.target.value)}
                />
                <TextField
                  label="Số CCCD"
                  placeholder="012345678901"
                  inputMode="numeric"
                  value={form.so_cccd}
                  onChange={(e) => update('so_cccd', e.target.value)}
                />
                <TextField
                  label="Số điện thoại"
                  placeholder="09xxxxxxxx"
                  inputMode="tel"
                  value={form.so_dien_thoai}
                  onChange={(e) => update('so_dien_thoai', e.target.value)}
                />
              </div>
            </Card>

            <Card>
              <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-gray-400">
                Thông tin người đi cùng
              </h2>
              <TextField
                label="Số lượng người đi cùng"
                type="number"
                inputMode="numeric"
                min={0}
                max={50}
                value={form.so_luong_nguoi_di_cung}
                onChange={(e) => {
                  const n = Math.max(0, Math.min(50, Number(e.target.value) || 0));
                  update('so_luong_nguoi_di_cung', n);
                }}
                hint="Số lượng người đi cùng (không bao gồm tài xế)"
              />
            </Card>

            <Card>
              <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-gray-400">
                Công ty chủ quản
              </h2>
              <div className="space-y-3">
                <SelectField
                  label="Công ty chủ quản"
                  required
                  options={CONG_TY_OPTIONS}
                  value={form.cong_ty_chu_quan}
                  onChange={(e) => {
                    update('cong_ty_chu_quan', e.target.value as CheckInPayload['cong_ty_chu_quan']);
                    update('bo_phan', null);
                    update('bo_phan_khac', null);
                  }}
                />
                {form.cong_ty_chu_quan === 'CB công ty' && (
                  <SelectField
                    label="Bộ phận"
                    required
                    options={BO_PHAN_OPTIONS}
                    value={form.bo_phan ?? ''}
                    onChange={(e) => update('bo_phan', e.target.value as CheckInPayload['bo_phan'])}
                  />
                )}
                {form.cong_ty_chu_quan === 'CB công ty' && form.bo_phan === 'Khác' && (
                  <TextField
                    label="Tên bộ phận khác"
                    required
                    placeholder="Nhập tên bộ phận"
                    value={form.bo_phan_khac ?? ''}
                    onChange={(e) => update('bo_phan_khac', e.target.value)}
                  />
                )}
              </div>
            </Card>

            <Card>
              <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-gray-400">
                Mục đích vào kho
              </h2>
              <div className="space-y-3">
                <SelectField
                  label="Mục đích vào kho"
                  required
                  options={MUC_DICH_OPTIONS}
                  value={form.muc_dich_vao_kho}
                  onChange={(e) => {
                    update('muc_dich_vao_kho', e.target.value as CheckInPayload['muc_dich_vao_kho']);
                    update('noi_dung_khac', null);
                  }}
                />
                {form.muc_dich_vao_kho === 'Khác' && (
                  <TextField
                    label="Nội dung khác"
                    required
                    placeholder="Mô tả mục đích"
                    value={form.noi_dung_khac ?? ''}
                    onChange={(e) => update('noi_dung_khac', e.target.value)}
                  />
                )}
              </div>
            </Card>

            <Button disabled={!step1Valid} onClick={() => setStep(2)}>
              Tiếp tục
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm font-semibold text-gray-500"
            >
              <ChevronLeft size={18} /> Quay lại
            </button>

            <SafetyRulesPoster />

            <Card>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-6 w-6 shrink-0 accent-green-600"
                  checked={form.da_cam_ket}
                  onChange={(e) => update('da_cam_ket', e.target.checked)}
                />
                <span className="text-sm font-semibold text-gray-800">
                  Tôi đã đọc và cam kết tuân thủ những quy định được nêu trên
                </span>
              </label>
            </Card>

            <Button disabled={!canSubmit || submitting} onClick={handleSubmit}>
              {submitting ? 'Đang xử lý...' : 'Đăng ký xe vào'}
            </Button>
          </>
        )}
      </div>

      {showPlateScanner && (
        <Suspense fallback={<ScannerLoading />}>
          <PlateScanner
            onDetected={(plate) => {
              update('bien_so_xe', plate);
              setShowPlateScanner(false);
            }}
            onClose={() => setShowPlateScanner(false)}
          />
        </Suspense>
      )}

      {showQrScanner && (
        <Suspense fallback={<ScannerLoading />}>
          <CccdQrScanner
            onDetected={(data) => {
              if (data.hoTen) update('ho_ten_tai_xe', data.hoTen);
              if (data.soCccd) update('so_cccd', data.soCccd);
              setShowQrScanner(false);
            }}
            onClose={() => setShowQrScanner(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
