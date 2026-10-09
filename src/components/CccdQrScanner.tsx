import { Loader2, ScanLine, X } from 'lucide-react';
import { useState } from 'react';
import { useQrScanner } from '../hooks/useQrScanner';
import type { CccdQrData } from '../types';

interface CccdQrScannerProps {
  onDetected: (data: CccdQrData) => void;
  onClose: () => void;
}

const SCANNER_ELEMENT_ID = 'cccd-qr-reader';

/**
 * Vietnamese CCCD / Thẻ Căn Cước back-of-card QR payload is pipe-delimited:
 * soCCCD|soCMNDCu|hoTen|ngaySinh(ddMMyyyy)|gioiTinh|diaChi|ngayCap
 *
 * The 2024 "Thẻ Căn Cước" format uses the same pipe-delimited layout, so
 * no special-casing is needed. Lenient on purpose: always returns whatever
 * it can find rather than an empty object, so the caller can show the user
 * *something* instead of silently doing nothing.
 */
function parseCccdPayload(raw: string): CccdQrData & { raw: string } {
  const trimmed = raw.trim();
  const parts = trimmed.split('|');

  if (parts.length >= 4) {
    const [soCccd, , hoTen, ngaySinhRaw] = parts;
    let ngaySinh: string | undefined;
    if (ngaySinhRaw && /^\d{8}$/.test(ngaySinhRaw)) {
      const dd = ngaySinhRaw.slice(0, 2);
      const mm = ngaySinhRaw.slice(2, 4);
      const yyyy = ngaySinhRaw.slice(4, 8);
      ngaySinh = `${dd}/${mm}/${yyyy}`;
    }
    return {
      soCccd: soCccd?.trim() || undefined,
      hoTen: hoTen?.trim() || undefined,
      ngaySinh,
      raw: trimmed,
    };
  }

  // Fallback: not the expected pipe-delimited shape. Try to at least
  // pull out a 12-digit CCCD number if one is present in the text.
  const cccdMatch = trimmed.match(/\b\d{12}\b/);
  return {
    soCccd: cccdMatch?.[0],
    raw: trimmed,
  };
}

export function CccdQrScanner({ onDetected, onClose }: CccdQrScannerProps) {
  const [unparsedNotice, setUnparsedNotice] = useState<string | null>(null);

  const { ready, error } = useQrScanner({
    elementId: SCANNER_ELEMENT_ID,
    onDecoded: (decodedText) => {
      const data = parseCccdPayload(decodedText);
      if (data.hoTen || data.soCccd) {
        setUnparsedNotice(null);
        onDetected(data);
      } else {
        setUnparsedNotice(
          `Đã quét được mã QR nhưng không đúng định dạng CCCD. Nội dung: "${data.raw.slice(0, 40)}${data.raw.length > 40 ? '…' : ''}"`
        );
      }
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-bold text-white">Quét QR CCCD / Căn cước</h2>
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

        {unparsedNotice && (
          <div className="absolute inset-x-4 top-4 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-medium text-white">
            {unparsedNotice}
          </div>
        )}
      </div>

      <div className="bg-black px-4 pb-8 pt-4">
        <p className="flex items-center justify-center gap-1.5 text-center text-sm text-white/70">
          <ScanLine size={16} /> Đưa mã QR mặt sau CCCD / Căn cước vào khung hình
        </p>
      </div>
    </div>
  );
}
