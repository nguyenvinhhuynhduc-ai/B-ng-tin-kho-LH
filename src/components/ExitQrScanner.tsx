import { Loader2, ScanLine, X } from 'lucide-react';
import { useState } from 'react';
import { useQrScanner } from '../hooks/useQrScanner';
import { SECURITY_QR_PREFIX } from '../utils/qrPrefix';

interface ExitQrScannerProps {
  onDetected: (maGiaoDich: string) => void;
  onClose: () => void;
}

const SCANNER_ELEMENT_ID = 'exit-qr-reader';

/** Extracts the transaction id from a "WG1|<maGiaoDich>|<bienSo>|<isoTime>" payload. */
function parseSecurityQr(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith(SECURITY_QR_PREFIX)) return null;
  const parts = trimmed.slice(SECURITY_QR_PREFIX.length).split('|');
  const maGiaoDich = parts[0]?.trim();
  return maGiaoDich && maGiaoDich.length > 0 ? maGiaoDich : null;
}

export function ExitQrScanner({ onDetected, onClose }: ExitQrScannerProps) {
  const [unrecognizedNotice, setUnrecognizedNotice] = useState<string | null>(null);

  const { ready, error } = useQrScanner({
    elementId: SCANNER_ELEMENT_ID,
    onDecoded: (decodedText) => {
      const maGiaoDich = parseSecurityQr(decodedText);
      if (maGiaoDich) {
        setUnrecognizedNotice(null);
        onDetected(maGiaoDich);
      } else {
        setUnrecognizedNotice('Mã QR này không phải mã xe vào kho hợp lệ. Vui lòng quét lại hoặc dùng cách khác.');
      }
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-bold text-white">Quét QR xe vào</h2>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
          aria-label="Đóng"
        >
          <X size={22} />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden" style={{ minHeight: 320 }}>
        <div
          id={SCANNER_ELEMENT_ID}
          className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
        />

        {!ready && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 text-white">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm">Đang khởi động camera...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-x-4 top-4 rounded-2xl bg-red-500 px-4 py-3 text-sm font-medium text-white">
            {error}
          </div>
        )}

        {unrecognizedNotice && (
          <div className="absolute inset-x-4 top-4 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-medium text-white">
            {unrecognizedNotice}
          </div>
        )}
      </div>

      <div className="bg-black px-4 pb-8 pt-4">
        <p className="flex items-center justify-center gap-1.5 text-center text-sm text-white/70">
          <ScanLine size={16} /> Đưa mã QR trên điện thoại tài xế vào khung hình
        </p>
      </div>
    </div>
  );
}
