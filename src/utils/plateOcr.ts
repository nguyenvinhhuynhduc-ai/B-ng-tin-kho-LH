/**
 * Normalizes any plate input (typed or OCR'd) into the enforced shape:
 * uppercase A-Z and 0-9 only. Every other character — spaces, dots,
 * dashes, underscores, or any other symbol — is stripped entirely.
 */
export function normalizePlate(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** True if the string contains anything other than A-Z / 0-9. */
export function hasInvalidPlateChars(raw: string): boolean {
  return /[^A-Za-z0-9]/.test(raw);
}

export const PLATE_INVALID_MESSAGE =
  'Biển số xe chỉ được chứa chữ và số, không bao gồm khoảng trắng hoặc ký tự đặc biệt.';

export const PLATE_PLACEHOLDER =
  'Nhập biển số xe (chỉ gồm chữ và số, không có khoảng trắng hoặc ký tự đặc biệt)';

/**
 * Rough validator for Vietnamese plate shapes across common categories
 * (cars, trucks, motorbikes, containers/trailers) once normalized to
 * bare alphanumeric — e.g. "51F12345", "29A99999", "59X123456".
 *
 * This intentionally stays permissive: it's a sanity filter to catch
 * "OCR read pure noise" cases, not a strict format enforcer. Manual
 * correction is always available in the UI regardless of the result.
 */
export function isPlausiblePlate(normalized: string): boolean {
  if (normalized.length < 5 || normalized.length > 11) return false;
  const digitCount = (normalized.match(/[0-9]/g) ?? []).length;
  return digitCount >= 5;
}
