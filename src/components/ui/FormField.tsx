import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

const baseFieldClasses =
  'w-full h-14 rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 text-lg text-gray-900 ' +
  'placeholder:text-gray-400 focus:border-green-600 focus:bg-white focus:outline-none ' +
  'transition-colors disabled:bg-gray-100 disabled:text-gray-400';

interface FieldWrapperProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function FieldWrapper({ label, required, hint, error, children }: FieldWrapperProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-orange-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-500">{error}</span>}
    </label>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
}

export function TextField({ label, required, hint, error, className = '', ...rest }: TextFieldProps) {
  return (
    <FieldWrapper label={label} required={required} hint={hint} error={error}>
      <input className={`${baseFieldClasses} ${className}`} {...rest} />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  options: string[];
  placeholder?: string;
}

export function SelectField({
  label,
  required,
  hint,
  error,
  options,
  placeholder = 'Chọn...',
  className = '',
  ...rest
}: SelectFieldProps) {
  return (
    <FieldWrapper label={label} required={required} hint={hint} error={error}>
      <select className={`${baseFieldClasses} appearance-none ${className}`} {...rest}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}
