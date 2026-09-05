# Warehouse Compliance Hub

Hệ thống quản lý tuân thủ cho bộ phận Kho vận — theo dõi kiểm định thiết bị, lịch Audit,
và bảng tin/thông báo nội bộ, với cảnh báo tự động (push notification) theo mốc thời gian
do Admin tự cấu hình.

---

## 1. Kiến trúc hệ thống

```
┌──────────────────────────┐        ┌────────────────────────────┐
│   Next.js 14 (App Router) │ HTTPS  │        Supabase             │
│   React + TypeScript      │◄──────►│  Postgres + Auth + Storage   │
│   Tailwind + Shadcn UI    │        │  Row Level Security          │
│   PWA (installable)       │        │  DB Triggers/Functions/Views │
└─────────────┬─────────────┘        └───────────────┬──────────────┘
              │                                       │
              │ deploy                                │ scheduled read
              ▼                                       ▼
      ┌───────────────┐                     ┌────────────────────────┐
      │    Netlify     │  every 15 min       │ Netlify Scheduled Fn    │
      │  (hosting/CDN) │◄────────────────────┤ notification-dispatcher │
      └───────────────┘                     └────────────┬────────────┘
                                                           │
                                                           ▼
                                              ┌─────────────────────────┐
                                              │   OneSignal (Push API)   │
                                              │  Android / iOS / Web     │
                                              └─────────────────────────┘
```

**Luồng cảnh báo tự động (không hard-code số ngày):**
1. Admin cấu hình các mốc cảnh báo trong bảng `notification_settings` (qua màn Cấu hình).
2. Khi tạo/sửa `inspections`, `audits`, hoặc `announcements`, một DB trigger tính lại
   thời điểm cần bắn thông báo và ghi vào bảng `notifications` (trạng thái `is_sent = false`).
3. Netlify Scheduled Function `notification-dispatcher` chạy mỗi 15 phút, lấy các dòng
   đã đến hạn (`scheduled_for <= now()`), gửi qua OneSignal REST API, rồi đánh dấu đã gửi.

---

## 2. ERD (mô tả quan hệ)

```
users ──< equipments ──< inspections
  │            │
  │            └──< attachments (owner_table='equipments')
  │
  ├──< audits ──< audit_findings ──< attachments (owner_table='audit_findings')
  │       └──────< attachments (owner_table='audits')
  │
  ├──< announcements ──< announcement_reads >── users
  │       └──────< attachments (owner_table='announcements')
  │
  ├──< notification_settings   (module: equipment | audit | announcement)
  ├──< notifications           (module, reference_table, reference_id, recipient_id)
  └──< activity_logs           (actor_id, target_table, target_id)
```

Full DDL: [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)
Default alert thresholds (seed data): [`supabase/migrations/0002_seed_notification_settings.sql`](./supabase/migrations/0002_seed_notification_settings.sql)

**Views** (pre-computed, used directly by the dashboard):
- `v_equipment_status` — remaining days + live status per equipment (no client-side date math)
- `v_inspection_variance` — Actual − Planned date, labeled early/on_time/late
- `v_compliance_kpi` — the KPI-card numbers (total, completed early/on-time/late, pending, overdue, %)
- `v_announcement_ack` — read/unread counts per post

**Functions & triggers**:
- `fn_complete_inspection` — stamps `actual_inspection_date` / `completed_by` / `completed_at`
  the moment Admin ticks "☑ Hoàn thành kiểm định"
- `fn_refresh_inspection_status` — keeps `inspections.status` in sync with dates
- `fn_schedule_equipment_notifications(inspection_id)` — (re)builds the queued
  notifications for one inspection from the current `notification_settings` rows
- Row Level Security: every table readable by any signed-in user; writes restricted
  to `role = 'admin'` via `fn_is_admin()`

---

## 3. Cấu trúc thư mục

```
warehouse-compliance-hub/
├── app/                      # Next.js App Router pages
│   ├── dashboard/
│   ├── equipment/
│   ├── audits/
│   ├── announcements/
│   ├── settings/             # Admin: cấu hình mốc cảnh báo
│   └── login/
├── components/
│   ├── ui/                   # Shadcn UI primitives (button, card, dialog, badge…)
│   ├── dashboard/
│   ├── equipment/
│   ├── audits/
│   ├── announcements/
│   └── layout/                # NavRail, MobileTabBar, Header
├── features/                  # Feature-level hooks + business logic per module
├── services/                  # Supabase query functions (equipmentService.ts, …)
├── lib/                       # supabaseClient/Server, auth.ts, fcm.ts
├── hooks/
├── types/                     # database.ts — TS types mirroring the schema
├── public/                    # manifest.json, sw.js, icons (PWA)
├── supabase/
│   ├── migrations/            # 0001_init.sql, 0002_seed_notification_settings.sql
│   └── functions/             # (optional) Supabase Edge Functions
├── netlify/functions/         # notification-dispatcher.ts (scheduled push sender)
├── netlify.toml
├── .env.example
└── package.json
```

> A visual prototype of every screen (Dashboard, Kiểm định, Audit, Bảng tin, Cấu hình,
> mobile bottom-nav) was delivered alongside this project as an interactive React artifact
> (`warehouse_compliance_hub.jsx`). Use it as the pixel/behavior reference when building
> out `components/*` — same color tokens are already wired into `tailwind.config.ts`.

---

## 4. Hướng dẫn thực hiện từng bước

### Bước 1 — Tạo dự án Supabase
1. Vào [supabase.com](https://supabase.com) → **New project**.
2. Vào **SQL Editor** → chạy lần lượt hai file trong `supabase/migrations/`
   (`0001_init.sql` rồi `0002_seed_notification_settings.sql`).
3. Vào **Authentication → Providers** → bật **Email**.
4. Vào **Authentication → Users** → tạo tài khoản Admin đầu tiên, sau đó chạy:
   ```sql
   update users set role = 'admin' where email = 'admin@yourcompany.com';
   ```
   (Nếu chưa có dòng trong `users`, thêm thủ công `id` = uid trong `auth.users`.)
5. Vào **Storage** → tạo bucket `attachments` (public hoặc private tuỳ nhu cầu).
6. Lấy **Project URL** và **anon key** ở **Project Settings → API**.

### Bước 2 — Thiết lập OneSignal (push notification)
1. Tạo tài khoản miễn phí tại [onesignal.com](https://onesignal.com).
2. **New App/Website** → chọn nền tảng **Web Push** → Integration **Typical Site** →
   điền Site URL (URL Netlify của bạn) → **Save**.
3. **Settings → Keys & IDs** → copy **OneSignal App ID** vào `NEXT_PUBLIC_ONESIGNAL_APP_ID`,
   copy **REST API Key** vào `ONESIGNAL_REST_API_KEY`.
4. Không cần service account, không cần base64, không cần project Google riêng.
5. Với Android/iOS native: thêm platform tương ứng trong cùng app OneSignal khi đóng gói
   PWA thành app (Capacitor/Trusted Web Activity) — OneSignal tự quản lý FCM/APNs nội bộ,
   bạn không cần tự tạo project Firebase hay Apple Push certificate riêng.

### Bước 3 — Cài đặt dự án local
```bash
git clone <repo-url> warehouse-compliance-hub
cd warehouse-compliance-hub
npm install
cp .env.example .env.local   # điền các giá trị Supabase + OneSignal
npm run dev                  # http://localhost:3000
```

### Bước 4 — Kết nối UI với dữ liệu thật
1. Dựng lại các màn hình trong `components/*` dựa trên prototype `warehouse_compliance_hub.jsx`.
2. Dùng các hàm sẵn có trong `services/*.ts` để đọc/ghi dữ liệu
   (`listEquipmentStatus`, `completeInspection`, `listAudits`, `listAnnouncements`, `markAsRead`…).
3. Trang **Cấu hình** (`app/settings`) gọi `services/notificationSettingsService.ts`
   để Admin thêm/sửa/xoá/bật-tắt từng mốc cảnh báo — không hard-code số ngày ở bất kỳ đâu.

### Bước 5 — Kiểm thử luồng cảnh báo
1. Tạo một `inspection` với `expiry_date` gần (vd. 2 ngày nữa).
2. Kiểm tra bảng `notifications` đã có dòng mới với `scheduled_for` tương ứng từng mốc
   trong `notification_settings`.
3. Chạy thử function dispatcher cục bộ:
   ```bash
   netlify dev
   netlify functions:invoke notification-dispatcher
   ```
4. Xác nhận thiết bị test nhận được push (cần đã gọi `registerPushToken` từ `lib/fcm.ts`
   để lưu `fcm_token` cho user đó).

### Bước 6 — Deploy lên Netlify
1. Push code lên GitHub.
2. Vào [Netlify](https://app.netlify.com) → **Add new site → Import from Git**.
3. Build command: `npm run build`, Publish directory: `.next`
   (đã cấu hình sẵn trong `netlify.toml` cùng plugin `@netlify/plugin-nextjs`).
4. Vào **Site settings → Environment variables** → nhập toàn bộ biến trong `.env.example`.
5. Deploy. Function `notification-dispatcher` sẽ tự chạy theo lịch mỗi 15 phút
   (khai báo trong `netlify.toml` và trong chính file function).
6. Kiểm tra PWA: mở site trên điện thoại → trình duyệt sẽ gợi ý "Thêm vào màn hình chính".

### Bước 7 — Vận hành
- Admin dùng màn **Cấu hình** để thêm/sửa các mốc cảnh báo bất cứ lúc nào — có hiệu lực
  ngay cho các bản ghi kiểm định/Audit/thông báo mới hoặc được cập nhật.
- `activity_logs` ghi lại toàn bộ thao tác tạo/sửa/xoá để phục vụ truy vết sau này
  (nên thêm insert vào bảng này trong tầng `services/*` khi thao tác thành công).

---

## 5. Ghi chú triển khai

- **RLS đã bật cho toàn bộ bảng** — User chỉ đọc được, Admin mới ghi được (`fn_is_admin()`).
- Toàn bộ số liệu "Remaining Days", "Inspection Variance", "Compliance Rate" được tính
  ở tầng **database** (views), không tính lại ở client — tránh sai lệch giữa các màn hình.
- Ngưỡng cảnh báo là **dữ liệu**, không phải **code** — thêm/sửa/xoá qua bảng
  `notification_settings`, áp dụng cho cả 3 module (Kiểm định / Audit / Bảng tin).
