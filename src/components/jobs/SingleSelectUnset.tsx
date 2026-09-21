import React from 'react';
import type { JobOptionItem } from '../../types/jobsAdmin';

export interface SingleSelectOption {
  label: string;
  value: string | boolean;
}

interface SingleSelectUnsetProps {
  id?: string;
  value: boolean | string | null;
  onChange: (val: boolean | string | null) => void;
  options?: (SingleSelectOption | JobOptionItem | string)[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function SingleSelectUnset({
  id,
  value,
  onChange,
  options,
  placeholder = 'Any / Unset',
  disabled = false,
  className = '',
}: SingleSelectUnsetProps) {
  // Build normalized list of selectable items
  let renderedOptions: SingleSelectOption[] = [];

  if (options && options.length > 0) {
    renderedOptions = options.map((opt) => {
      if (typeof opt === 'string') {
        const lower = opt.toLowerCase();
        if (lower === 'true') return { label: 'True / Yes', value: true };
        if (lower === 'false') return { label: 'False / No', value: false };
        return { label: opt, value: opt };
      }
      if ('name' in opt) {
        return { label: opt.name, value: opt.name };
      }
      return opt;
    });
  } else {
    // Standard boolean choices if no dynamic options passed
    renderedOptions = [
      { label: 'Yes / True', value: true },
      { label: 'No / False', value: false },
    ];
  }

  // Convert current value to string representation for <select>
  const toSelectValue = (v: boolean | string | null): string => {
    if (v === null || v === undefined) return '__unset__';
    if (typeof v === 'boolean') return v ? '__bool_true__' : '__bool_false__';
    return `__str__${v}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value;
    if (raw === '__unset__') {
      onChange(null);
    } else if (raw === '__bool_true__') {
      onChange(true);
    } else if (raw === '__bool_false__') {
      onChange(false);
    } else if (raw.startsWith('__str__')) {
      onChange(raw.replace('__str__', ''));
    } else {
      onChange(raw);
    }
  };

  return (
    <select
      id={id}
      disabled={disabled}
      value={toSelectValue(value)}
      onChange={handleChange}
      className={`w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm font-medium text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <option value="__unset__">{placeholder}</option>
      {renderedOptions.map((opt, idx) => {
        const selectVal =
          typeof opt.value === 'boolean'
            ? opt.value
              ? '__bool_true__'
              : '__bool_false__'
            : `__str__${opt.value}`;
        return (
          <option key={`${opt.label}-${idx}`} value={selectVal}>
            {opt.label}
          </option>
        );
      })}
    </select>
  );
}
