import { Camera, Loader2, X, Zap } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createWorker, PSM, type Worker } from 'tesseract.js';
import { captureViewfinderFrame } from '../utils/cropVideoFrame';
import { isPlausiblePlate, normalizePlate } from '../utils/plateOcr';

interface PlateScannerProps {
  onDetected: (plate: string) => void;
  onClose: () => void;
}

export function PlateScanner({ onDetected, onClose }: PlateScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReadHint, setLastReadHint] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [engineReady, setEngineReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      // Camera and OCR engine load in parallel — the ~2-4MB language data
      // download shouldn't block the viewfinder from showing up.
      const cameraPromise = (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
          if (!cancelled) setCameraReady(true);
        } catch (err) {
          if (cancelled) return;
          const message = err instanceof Error ? err.message : String(err);
          if (/permission|NotAllowedError/i.test(message)) {
            setError('Bạn chưa cấp quyền camera. Vui lòng cho phép truy cập camera trong cài đặt trình duyệt.');
          } else if (/NotFoundError|device/i.test(message)) {
            setError('Không tìm thấy camera trên thiết bị này.');
          } else {
            setError(`Không thể mở camera: ${message}`);
          }
        }
      })();

      const enginePromise = (async () => {
        try {
          const worker = await createWorker('eng');
          await worker.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIKLMNPSTUVXYZ0123456789.-',
            // Single uniform block instead of full-page layout analysis —
            // plates are one or two short lines, not a document. This
            // removes most "reads unrelated background text" noise.
            tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          });
          if (cancelled) {
            worker.terminate();
            return;
          }
          workerRef.current = worker;
          setEngineReady(true);
        } catch (err) {
          if (cancelled) return;
          const message = err instanceof Error ? err.message : String(err);
          setError(`Không thể tải công cụ nhận diện chữ (kiểm tra kết nối mạng): ${message}`);
        }
      })();

      await Promise.all([cameraPromise, enginePromise]);
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      workerRef.current?.terminate();
    };
  }, []);

  const captureAndRecognize = useCallback(async () => {
    if (isCapturing) return;
    if (!videoRef.current || !workerRef.current || !containerRef.current || !frameRef.current) return;

    const video = videoRef.current;

    if (video.readyState < video.HAVE_CURRENT_DATA || video.videoWidth === 0) {
      setError('Camera chưa sẵn sàng, vui lòng đợi một chút rồi thử lại.');
      return;
    }

    setIsCapturing(true);
    setError(null);
    setLastReadHint(null);

    try {
      const canvas = captureViewfinderFrame(video, containerRef.current, frameRef.current);

      const {
        data: { text },
      } = await workerRef.current.recognize(canvas);

      // Immediately drop the frame — only text is kept, per spec ("không lưu ảnh").
      canvas.width = 0;
      canvas.height = 0;

      const plate = normalizePlate(text);
      if (!isPlausiblePlate(plate)) {
        setLastReadHint(text.trim() ? text.trim().slice(0, 30) : null);
        setError('Không nhận diện được biển số rõ ràng. Thử chụp lại gần hơn, đủ sáng, hoặc nhập tay.');
        setIsCapturing(false);
        return;
      }

      onDetected(plate);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Có lỗi khi xử lý ảnh: ${message}`);
      setIsCapturing(false);
    }
  }, [isCapturing, onDetected]);

  const ready = cameraReady && engineReady;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-bold text-white">Quét biển số xe</h2>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
          aria-label="Đóng"
        >
          <X size={22} />
        </button>
      </div>

      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />

        {/* Viewfinder frame — this exact rectangle is what gets cropped for OCR */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8">
          <div
            ref={frameRef}
            className="aspect-[3/1.2] w-full max-w-md rounded-2xl border-4 border-orange-500/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
          />
        </div>

        {!ready && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 text-white">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm">
              {!cameraReady ? 'Đang khởi động camera...' : 'Đang tải công cụ nhận diện chữ...'}
            </p>
          </div>
        )}

        {error && (
          <div className="absolute inset-x-4 top-4 rounded-2xl bg-red-500 px-4 py-3 text-sm font-medium text-white">
            {error}
            {lastReadHint && (
              <div className="mt-1 text-xs text-red-50/80">Đã đọc được: "{lastReadHint}"</div>
            )}
          </div>
        )}
      </div>

      <div className="bg-black px-4 pb-8 pt-4">
        <p className="mb-3 text-center text-sm text-white/70">
          Căn biển số vào khung, giữ điện thoại ổn định rồi chụp
        </p>
        <button
          onClick={captureAndRecognize}
          disabled={!ready || isCapturing}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/40 disabled:bg-gray-600"
        >
          {isCapturing ? <Loader2 className="animate-spin" size={26} /> : <Camera size={26} />}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-white/50">
          <Zap size={12} /> Ảnh không được lưu lại — chỉ trích xuất văn bản
        </p>
      </div>
    </div>
  );
}
