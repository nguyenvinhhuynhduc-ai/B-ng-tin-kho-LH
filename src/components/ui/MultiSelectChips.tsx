import { Check } from 'lucide-react';

interface Props {
  label: string;
  hint?: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

/** Chọn nhiều giá trị bằng các nút lớn (dễ bấm một tay trên điện thoại). */
export function MultiSelectChips({ label, hint, options, value, onChange, disabled }: Props) {
  function toggle(option: string) {
    if (disabled) return;
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((option) => {
          const selected = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              role="checkbox"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => toggle(option)}
              className={[
                'flex min-h-12 items-center gap-1.5 rounded-2xl border-2 px-4 text-base font-semibold transition-colors',
                selected
                  ? 'border-green-700 bg-green-700 text-white'
                  : 'border-gray-200 bg-gray-50 text-gray-700 active:bg-gray-100',
                disabled ? 'cursor-not-allowed opacity-60' : '',
              ].join(' ')}
            >
              {selected && <Check size={18} />}
              {option}
            </button>
          );
        })}
      </div>
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </div>
  );
}
