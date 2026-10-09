import { LogIn, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-green-700 px-6 pb-10 pt-[calc(env(safe-area-inset-top)+2.5rem)] text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Ghi nhận ra vào kho</h1>
        <p className="mt-1.5 text-sm font-medium text-green-50">Chọn ứng dụng bạn muốn sử dụng</p>
      </header>

      <main className="-mt-6 flex flex-1 flex-col gap-4 px-5 pb-10">
        <Link
          to="/checkin"
          className="flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm active:scale-[0.98]"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">
            <LogIn size={28} />
          </div>
          <div>
            <div className="text-lg font-extrabold text-gray-900">Tài xế / Khách</div>
            <div className="text-sm text-gray-500">Đăng ký xe vào kho</div>
          </div>
        </Link>

        <Link
          to="/security"
          className="flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm active:scale-[0.98]"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">
            <ShieldCheck size={28} />
          </div>
          <div>
            <div className="text-lg font-extrabold text-gray-900">Bảo vệ / Nhân viên kho</div>
            <div className="text-sm text-gray-500">Dashboard, xác nhận xe ra, danh sách</div>
          </div>
        </Link>
      </main>
    </div>
  );
}
