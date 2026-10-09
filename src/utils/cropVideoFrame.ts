/**
 * Maps the on-screen viewfinder rectangle to pixel coordinates in the
 * video's native (source) resolution, accounting for the `object-cover`
 * scaling/cropping applied when the video is rendered into its container.
 *
 * Without this, capturing `video.videoWidth x video.videoHeight` grabs the
 * ENTIRE camera frame — background clutter, other objects, wall text —
 * which pollutes OCR results with unrelated characters.
 */
function computeSourceCropRect(
  video: HTMLVideoElement,
  container: HTMLElement,
  frame: HTMLElement
): { sx: number; sy: number; sw: number; sh: number } {
  const containerRect = container.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();

  const videoW = video.videoWidth;
  const videoH = video.videoHeight;
  const containerW = containerRect.width;
  const containerH = containerRect.height;

  // object-cover: video is scaled uniformly to fully cover the container,
  // then centered and clipped on whichever axis overflows.
  const scale = Math.max(containerW / videoW, containerH / videoH);
  const displayedW = videoW * scale;
  const displayedH = videoH * scale;
  const offsetX = (containerW - displayedW) / 2; // usually <= 0
  const offsetY = (containerH - displayedH) / 2;

  const frameLeftInContainer = frameRect.left - containerRect.left;
  const frameTopInContainer = frameRect.top - containerRect.top;

  // Small margin so we don't clip characters right at the frame edge.
  const marginX = frameRect.width * 0.06;
  const marginY = frameRect.height * 0.18;

  const sx = (frameLeftInContainer - marginX - offsetX) / scale;
  const sy = (frameTopInContainer - marginY - offsetY) / scale;
  const sw = (frameRect.width + marginX * 2) / scale;
  const sh = (frameRect.height + marginY * 2) / scale;

  const clampedSx = Math.max(0, Math.min(sx, videoW - 1));
  const clampedSy = Math.max(0, Math.min(sy, videoH - 1));
  const clampedSw = Math.max(1, Math.min(sw, videoW - clampedSx));
  const clampedSh = Math.max(1, Math.min(sh, videoH - clampedSy));

  return { sx: clampedSx, sy: clampedSy, sw: clampedSw, sh: clampedSh };
}

/**
 * Otsu's method: finds the grayscale threshold that best separates two
 * populations (plate background vs. character strokes) by maximizing
 * between-class variance. Adapts automatically to the actual image instead
 * of assuming a fixed brightness cutoff — this is what makes the same code
 * path work for both white plates (bright bg) and yellow plates (bg reads
 * darker in grayscale than white, but still separates cleanly from the
 * black characters once the histogram is analyzed rather than guessed).
 */
function otsuThreshold(hist: Uint32Array, totalPixels: number): number {
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];

  let sumB = 0;
  let weightBackground = 0;
  let maxVariance = 0;
  let threshold = 127;

  for (let t = 0; t < 256; t++) {
    weightBackground += hist[t];
    if (weightBackground === 0) continue;

    const weightForeground = totalPixels - weightBackground;
    if (weightForeground === 0) break;

    sumB += t * hist[t];
    const meanBackground = sumB / weightBackground;
    const meanForeground = (sum - sumB) / weightForeground;
    const meanDiff = meanBackground - meanForeground;
    const betweenVariance = weightBackground * weightForeground * meanDiff * meanDiff;

    if (betweenVariance > maxVariance) {
      maxVariance = betweenVariance;
      threshold = t;
    }
  }

  return threshold;
}

/**
 * Grayscale + contrast stretch + Otsu binarization. Produces crisp black
 * text on a white field regardless of the source plate's actual color
 * (white or yellow background, both common on Vietnamese plates) — Tesseract
 * reads a clean binarized image far more reliably than a raw color/glare
 * photo, and Otsu's adaptive threshold means no plate-color-specific tuning
 * is needed.
 */
function binarizeForOcr(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const pixelCount = width * height;

  const gray = new Uint8ClampedArray(pixelCount);
  let min = 255;
  let max = 0;

  for (let i = 0; i < data.length; i += 4) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[i / 4] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }

  // Contrast stretch to the full 0-255 range first — this alone helps a lot
  // on glare-heavy glossy plates, and gives Otsu a cleaner histogram to work
  // with (a compressed dynamic range under- or over-exposed by the camera
  // makes the threshold search less reliable).
  const range = Math.max(1, max - min);
  const hist = new Uint32Array(256);
  for (let i = 0; i < pixelCount; i++) {
    const stretched = Math.round(((gray[i] - min) / range) * 255);
    gray[i] = stretched;
    hist[stretched]++;
  }

  const threshold = otsuThreshold(hist, pixelCount);

  // Plate characters are consistently darker than their background on both
  // white and yellow Vietnamese plates, so "below threshold → black text,
  // above → white background" holds for the cases this app targets.
  for (let i = 0; i < pixelCount; i++) {
    const value = gray[i] <= threshold ? 0 : 255;
    const di = i * 4;
    data[di] = data[di + 1] = data[di + 2] = value;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Captures the viewfinder region of a live video into a preprocessed
 * canvas: cropped to the on-screen frame, upscaled for legibility, and
 * binarized for OCR. Shared by the driver check-in and security exit
 * plate scanners (both run Tesseract locally).
 */
export function captureViewfinderFrame(
  video: HTMLVideoElement,
  container: HTMLElement,
  frame: HTMLElement,
  targetHeight = 220
): HTMLCanvasElement {
  const { sx, sy, sw, sh } = computeSourceCropRect(video, container, frame);
  const upscale = Math.max(1, targetHeight / sh);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw * upscale);
  canvas.height = Math.round(sh * upscale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  binarizeForOcr(canvas);

  return canvas;
}
