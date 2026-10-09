import { ShieldAlert } from 'lucide-react';
import { NOI_QUY_ITEMS } from '../utils/constants';

export function SafetyRulesPoster() {
  return (
    <div className="overflow-hidden rounded-3xl border-2 border-orange-500 bg-white shadow-sm">
      <div className="flex items-center gap-3 bg-orange-500 px-5 py-4">
        <ShieldAlert size={28} className="text-white" />
        <h2 className="text-lg font-extrabold uppercase tracking-wide text-white">
          Nội quy an toàn kho
        </h2>
      </div>
      <ol className="divide-y divide-gray-100">
        {NOI_QUY_ITEMS.map((rule, i) => (
          <li key={i} className="flex items-start gap-3 px-5 py-4">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-extrabold text-orange-500">
              {i + 1}
            </span>
            <span className="pt-0.5 text-base font-medium leading-snug text-gray-800">{rule}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
