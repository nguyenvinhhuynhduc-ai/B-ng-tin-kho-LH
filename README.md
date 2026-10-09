# Ghi nhận ra vào kho (Warehouse Guardian)

Hai ứng dụng độc lập, dùng chung một bảng Supabase (`vehicle_records`), cùng một URL triển khai:

- **`/checkin`** — App tài xế/khách: đăng ký xe vào kho, không cần đăng nhập, kết thúc bằng một **mã QR bảo mật** để xuất trình khi ra.
- **`/security`** — App bảo vệ: Dashboard, xác nhận xe ra (quét QR / quét biển số / nhập tay), danh sách, nội quy.
- **`/`** — Trang chọn app.

## Công nghệ

- **Frontend:** React 19, TypeScript, React Router, Tailwind CSS v4
- **Backend:** Supabase (Postgres + REST)
- **OCR biển số (cả 2 app):** Tesseract.js — chạy hoàn toàn trên trình duyệt, offline, không lưu ảnh, không phát sinh chi phí. Ảnh được crop đúng vùng khung ngắm rồi nhị phân hoá (Otsu's method) trước khi nhận diện, giúp đọc tốt cả biển trắng lẫn biển vàng.
- **QR CCCD & QR bảo mật:** html5-qrcode (quét) + qrcode (sinh mã)
- **Xuất Excel:** SheetJS
- **PWA:** vite-plugin-pwa, có shortcut riêng cho từng app

## Bắt đầu

### 1. Supabase

1. Tạo project tại [supabase.com](https://supabase.com).
2. Chạy [`supabase/schema.sql`](./supabase/schema.sql) trong SQL Editor (bảng `vehicle_records` — không có bảng mới nào khác).
3. Lấy `Project URL` và `anon public` key ở Project Settings → API.

### 2. Biến môi trường

```bash
cp .env.example .env
```

Điền vào `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Chạy local

```bash
npm install
npm run dev
```

Camera/OCR/QR cần HTTPS hoặc `localhost`.

### 4. Deploy lên Netlify

```bash
npm run build
```

Kéo-thả thư mục `dist/` lên Netlify, hoặc kết nối repo Git để Netlify tự build. Nhớ khai báo `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` trong **Site settings → Environment variables** nếu build qua Git (biến `VITE_*` phải có mặt lúc build để được nhúng vào bundle).

## Cấu trúc dự án

```
src/
  pages/checkin/       App tài xế: CheckInPage (2 bước: thông tin → nội quy) → hiện QR bảo mật
  pages/security/       App bảo vệ: Dashboard, SecurityExitPage (3 phương thức), Danh sách, Nội quy
  pages/LandingPage.tsx Trang chọn app ở "/"
  components/            PlateScanner (Tesseract, dùng chung cho cả 2 app),
                          CccdQrScanner, ExitQrScanner (dùng chung hook useQrScanner), SecurityQrDisplay
  hooks/useQrScanner.ts  Logic quét QR dùng chung, xử lý lifecycle camera + lỗi
  services/              vehicleService (Supabase), qrCodeService (sinh QR), exportService (Excel)
  utils/                 cropVideoFrame (crop khung ngắm + nhị phân hoá Otsu cho OCR),
                          plateOcr (chuẩn hoá biển số: chỉ A-Z/0-9, validate)
supabase/schema.sql       Schema + RLS (không đổi so với trước)
```

## Luồng QR bảo mật

1. Tài xế đăng ký xe vào ở `/checkin` → hệ thống lưu bản ghi vào `vehicle_records`, sinh mã `GD-YYYYMMDD-HHMMSS`.
2. App hiển thị mã QR toàn màn hình chứa: `WG1|<mã giao dịch>|<biển số>|<giờ vào ISO>`. Tài xế có thể "Lưu ảnh QR" hoặc chụp màn hình.
3. Khi xe ra, bảo vệ ở `/security/xe-ra` chọn "QR xe vào" → quét mã này → hệ thống tự tra cứu đúng bản ghi qua mã giao dịch, hiển thị đầy đủ thông tin để xác nhận.
4. Nếu tài xế không có QR (mất/hỏng máy), bảo vệ vẫn dùng được "Biển số" hoặc "Nhập tay" như trước.

## Quy tắc nhập biển số xe

Ô nhập biển số (cả 2 app, cả nhập tay lẫn kết quả từ OCR) chỉ chấp nhận chữ **A-Z** và số **0-9** — mọi khoảng trắng, dấu chấm, gạch ngang và ký tự đặc biệt khác bị loại bỏ tự động, kèm thông báo lỗi khi người dùng gõ ký tự không hợp lệ.

## Cài đặt PWA riêng cho từng thiết bị

- Thiết bị đặt cố định ở cổng cho tài xế: mở `https://<domain>/checkin` → "Thêm vào Màn hình chính".
- Máy/điện thoại của bảo vệ: mở `https://<domain>/security` → "Thêm vào Màn hình chính".

Mỗi shortcut mở thẳng đúng luồng, không cần đi qua trang chọn app.

## Ghi chú thiết kế

- Giao diện, màu cam (#F97316), typography, layout, style Dashboard/Card/Navigation **giữ nguyên hoàn toàn** so với bản trước.
- OCR biển số & QR CCCD đều xử lý ảnh ngay trên thiết bị, không lưu ảnh, không gọi dịch vụ ngoài trả phí.
- Không có xác thực/đăng nhập — bảng `vehicle_records` dùng RLS cho phép `anon` key đọc/ghi ở cả 2 app. Triển khai sau URL nội bộ hoặc thắt chặt RLS nếu cần kiểm soát truy cập chặt hơn.
