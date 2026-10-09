import QRCode from 'qrcode';
import { SECURITY_QR_PREFIX } from '../utils/qrPrefix';
import type { VehicleRecord } from '../types';

/**
 * Builds the payload embedded in the security QR shown to the driver after
 * check-in. Kept short and pipe-delimited (not JSON) so the QR stays dense
 * enough to scan reliably even on cheap phone cameras.
 *
 * Format: WG1|<ma_giao_dich>|<bien_so_xe>|<thoi_gian_vao ISO>
 */
function buildSecurityQrPayload(record: Pick<VehicleRecord, 'ma_giao_dich' | 'bien_so_xe' | 'thoi_gian_vao'>): string {
  return `${SECURITY_QR_PREFIX}${record.ma_giao_dich}|${record.bien_so_xe}|${record.thoi_gian_vao}`;
}

export const qrCodeService = {
  /** Generates a PNG data URL for the driver's security QR. */
  async generateSecurityQrDataUrl(
    record: Pick<VehicleRecord, 'ma_giao_dich' | 'bien_so_xe' | 'thoi_gian_vao'>
  ): Promise<string> {
    const payload = buildSecurityQrPayload(record);
    return QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 640,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    });
  },
};
