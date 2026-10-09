import { ClipboardList, LayoutGrid, LogOut, ShieldCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/security', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/security/xe-ra', label: 'Xe ra', icon: LogOut, end: false },
  { to: '/security/danh-sach', label: 'Danh sách', icon: ClipboardList, end: false },
  { to: '/security/noi-quy', label: 'Nội quy', icon: ShieldCheck, end: false },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition-colors',
                  isActive ? 'text-green-700' : 'text-gray-400',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'flex h-9 w-9 items-center justify-center rounded-2xl transition-colors',
                      isActive ? 'bg-green-50' : '',
                    ].join(' ')}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
