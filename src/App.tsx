import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { ToastProvider } from './components/ui/Toast';
import { CheckInPage } from './pages/checkin/CheckInPage';
import { LandingPage } from './pages/LandingPage';
import { RecordsListPage } from './pages/security/RecordsListPage';
import { RulesPage } from './pages/security/RulesPage';
import { SecurityDashboardPage } from './pages/security/SecurityDashboardPage';
import { SecurityExitPage } from './pages/security/SecurityExitPage';

/** Driver check-in app — single-purpose kiosk flow, no bottom nav. */
function DriverLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-lg">
        <Outlet />
      </main>
    </div>
  );
}

/** Security app — dashboard + tabs, same shell as before. */
function SecurityLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-lg">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<DriverLayout />}>
          <Route path="/checkin" element={<CheckInPage />} />
        </Route>

        <Route path="/security" element={<SecurityLayout />}>
          <Route index element={<SecurityDashboardPage />} />
          <Route path="xe-ra" element={<SecurityExitPage />} />
          <Route path="danh-sach" element={<RecordsListPage />} />
          <Route path="noi-quy" element={<RulesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
