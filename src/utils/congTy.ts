/** "Công ty" cho phép chọn nhiều: lưu trong cột text, nối bằng ", " (tên công ty không chứa dấu phẩy). */
const SEPARATOR = ', ';

export function parseCongTy(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Nối theo đúng thứ tự của `order` (các giá trị lạ nằm cuối) để Excel/Danh sách hiển thị nhất quán. */
export function joinCongTy(selected: string[], order: readonly string[]): string | null {
  if (selected.length === 0) return null;
  const rank = (v: string) => {
    const i = order.indexOf(v);
    return i === -1 ? order.length : i;
  };
  return [...selected].sort((a, b) => rank(a) - rank(b)).join(SEPARATOR);
}
