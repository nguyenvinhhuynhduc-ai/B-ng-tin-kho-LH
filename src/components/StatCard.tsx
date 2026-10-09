import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: 'orange' | 'green' | 'blue' | 'purple';
}

const TONE_CLASSES: Record<NonNullable<StatCardProps['tone']>, string> = {
  orange: 'bg-orange-50 text-orange-500',
  green: 'bg-green-50 text-green-600',
  blue: 'bg-sky-50 text-sky-500',
  purple: 'bg-violet-50 text-violet-500',
};

export function StatCard({ label, value, icon: Icon, tone = 'orange' }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${TONE_CLASSES[tone]}`}>
        <Icon size={22} strokeWidth={2.25} />
      </div>
      <div className="text-3xl font-extrabold tracking-tight text-gray-900">{value}</div>
      <div className="mt-0.5 text-sm font-medium text-gray-500">{label}</div>
    </div>
  );
}
