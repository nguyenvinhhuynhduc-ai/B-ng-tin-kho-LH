import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';

interface UseQrScannerOptions {
  elementId: string;
  onDecoded: (text: string) => void;
  /** Pause further scans after the first successful decode (default: true). */
  stopOnFirstHit?: boolean;
}

interface UseQrScannerResult {
  ready: boolean;
  error: string | null;
}

/**
 * Wraps html5-qrcode's start/stop lifecycle with the fixes needed for
 * reliable mobile scanning:
 *  - waits a frame so the flex-layout container has a real height before
 *    the library measures it (otherwise the preview can render broken)
 *  - surfaces permission/device errors instead of failing silently
 *  - guards against firing onDecoded more than once per mount
 *  - always stops the camera stream on unmount, even if start() is still
 *    in flight (StrictMode double-invoke safe)
 */
export function useQrScanner({ elementId, onDecoded, stopOnFirstHit = true }: UseQrScannerOptions): UseQrScannerResult {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let cancelled = false;
    handledRef.current = false;

    const raf = requestAnimationFrame(() => {
      if (cancelled) return;

      const scanner = new Html5Qrcode(elementId, { verbose: false });
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decodedText) => {
            if (stopOnFirstHit && handledRef.current) return;
            handledRef.current = true;
            onDecoded(decodedText);
          },
          () => {
            // per-frame "not found" callback — fires continuously while
            // aiming, not an actual error, so it's intentionally ignored
          }
        )
        .then(() => {
          if (!cancelled) setReady(true);
        })
        .catch((err) => {
          if (cancelled) return;
          const message = err instanceof Error ? err.message : String(err);
          if (/permission|NotAllowedError/i.test(message)) {
            setError('Bạn chưa cấp quyền camera. Vui lòng cho phép truy cập camera trong cài đặt trình duyệt.');
          } else if (/NotFoundError|device/i.test(message)) {
            setError('Không tìm thấy camera trên thiết bị này.');
          } else {
            setError(`Không thể mở camera: ${message}`);
          }
        });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => scanner.clear());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementId]);

  return { ready, error };
}
