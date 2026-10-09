import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-green-700 px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm font-medium text-green-50">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
