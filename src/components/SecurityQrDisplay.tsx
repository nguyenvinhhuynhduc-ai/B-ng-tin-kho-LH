import { CheckCircle2, Download, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';

interface SecurityQrDisplayProps {
  qrDataUrl: string;
  maGiaoDich: string;
  bienSoXe: string;
  onRegisterAnother: () => void;
}

export function SecurityQrDisplay({ qrDataUrl, maGiaoDich, bienSoXe, onRegisterAnother }: SecurityQrDisplayProps) {
  function handleSaveImage() {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-${maGiaoDich}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex min-h-full flex-col items-center px-6 pb-10 pt-10 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
        <CheckCircle2 size={36} />
      </div>
      <h1 className="text-xl font-extrabold text-gray-900">Đăng ký thành công</h1>
      <p className="mt-1.5 text-sm text-gray-500">
        Xuất trình mã QR này cho bảo vệ khi xe ra khỏi kho
      </p>

      <div className="mt-6 rounded-3xl border-2 border-orange-500 bg-white p-4 shadow-sm">
        <img src={qrDataUrl} alt="Mã QR xe vào kho" className="h-64 w-64" />
      </div>

      <div className="mt-4 space-y-1 text-sm">
        <div className="font-bold text-gray-900">{bienSoXe}</div>
        <div className="text-gray-500">{maGiaoDich}</div>
      </div>

      <div className="mt-8 w-full max-w-sm space-y-3">
        <Button variant="secondary" icon={<Download size={20} />} onClick={handleSaveImage}>
          Lưu ảnh QR
        </Button>
        <Button icon={<RotateCcw size={20} />} onClick={onRegisterAnother}>
          Đăng ký xe mới
        </Button>
      </div>
    </div>
  );
}
