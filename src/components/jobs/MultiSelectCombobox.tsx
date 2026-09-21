import { useState, useRef, useEffect } from 'react';
import { X, Check, Search, Plus, AlertTriangle, Loader2 } from 'lucide-react';
import type { ManageableCategory, JobOptionItem } from '../../types/jobsAdmin';
import { jobsAdminApi } from '../../services/jobsAdminApi';

export interface OptionRecord {
  name: string;
  code?: string;
  isActive?: boolean;
}

interface MultiSelectComboboxProps {
  id?: string;
  values: string[];
  onChange: (newValues: string[]) => void;
  availableOptions?: (JobOptionItem | OptionRecord | string)[];
  category?: ManageableCategory;
  categoryLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  allowFreeTextWithoutCategory?: boolean;
  onOptionCreated?: () => void;
  className?: string;
}

export default function MultiSelectCombobox({
  id,
  values = [],
  onChange,
  availableOptions = [],
  category,
  categoryLabel,
  placeholder = 'Select options...',
  disabled = false,
  allowFreeTextWithoutCategory = false,
  onOptionCreated,
  className = '',
}: MultiSelectComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize available options into OptionRecord objects safely
  const normalizedOptions: OptionRecord[] = (availableOptions || [])
    .map((opt) => {
      if (!opt) return { name: '', isActive: true };
      if (typeof opt === 'string') {
        return { name: opt.trim(), isActive: true };
      }
      const nameStr = String(opt.name || opt.code || '').trim();
      return {
        name: nameStr,
        code: opt.code,
        isActive: opt.isActive ?? true,
      };
    })
    .filter((opt) => Boolean(opt.name));

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
        setCreateError(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on query
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.name.toLowerCase().includes((query || '').toLowerCase())
  );

  const isSelected = (name: string) =>
    (values || []).some(
      (v) => String(v).trim().toLowerCase() === String(name).trim().toLowerCase()
    );

  const toggleOption = (name: string) => {
    if (isSelected(name)) {
      onChange((values || []).filter((v) => String(v).trim().toLowerCase() !== String(name).trim().toLowerCase()));
    } else {
      onChange([...(values || []), name]);
    }
  };

  const removeValue = (name: string) => {
    onChange((values || []).filter((v) => String(v).trim().toLowerCase() !== String(name).trim().toLowerCase()));
  };

  // Determine if a selected value is inactive or missing in the DB
  const isValueInactive = (val: string): boolean => {
    if (!val) return false;
    const strVal = String(val).trim().toLowerCase();
    const found = normalizedOptions.find(
      (o) => o.name.toLowerCase() === strVal
    );
    if (found && found.isActive === false) return true;
    return false;
  };

  const handleCreateOption = async () => {
    const trimmed = query.trim();
    if (!trimmed || !category) return;

    try {
      setIsCreating(true);
      setCreateError(null);

      const res = await jobsAdminApi.createCategoryOption(category, trimmed);
      if (res.success && res.data) {
        const createdName = res.data.name || trimmed;
        if (!values.includes(createdName)) {
          onChange([...values, createdName]);
        }
        setQuery('');
        if (onOptionCreated) {
          onOptionCreated();
        }
      } else {
        setCreateError(res.message || 'Failed to create option in database');
      }
    } catch {
      setCreateError('Network error creating option');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddFreeText = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (!values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setQuery('');
  };

  const exactMatchExists = normalizedOptions.some(
    (o) => o.name.toLowerCase() === query.trim().toLowerCase()
  );

  return (
    <div ref={containerRef} className={`relative ${className}`} id={id}>
      {/* Selected Chips & Search Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(true)}
        className={`min-h-[46px] w-full bg-gray-50/50 p-2 rounded-xl border border-gray-200 flex flex-wrap items-center gap-1.5 cursor-text focus-within:ring-2 focus-within:ring-black focus-within:bg-white focus-within:border-transparent transition-all ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        {values.map((val) => {
          const inactive = isValueInactive(val);
          return (
            <span
              key={val}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                inactive
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-gray-100 text-gray-800 border border-gray-200'
              }`}
            >
              {inactive && <AlertTriangle className="w-3 h-3 text-amber-600" />}
              <span>{val}{inactive ? ' (inactive)' : ''}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  removeValue(val);
                }}
                className="hover:text-red-500 rounded-full focus:outline-none"
                aria-label={`Remove ${val}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}

        <input
          type="text"
          disabled={disabled}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (allowFreeTextWithoutCategory && query.trim()) {
                handleAddFreeText();
              } else if (category && query.trim() && !exactMatchExists) {
                handleCreateOption();
              } else if (filteredOptions.length > 0) {
                toggleOption(filteredOptions[0].name);
                setQuery('');
              }
            } else if (e.key === 'Backspace' && !query && values.length > 0) {
              removeValue(values[values.length - 1]);
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          placeholder={values.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none px-2 py-1"
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in duration-150">
          {createError && (
            <div className="px-4 py-2 mx-2 mb-2 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          {/* Quick Search Header if large list */}
          {normalizedOptions.length > 10 && (
            <div className="px-3 pb-2 mb-1 border-b border-gray-100 flex items-center gap-2 text-xs text-gray-400">
              <Search className="w-3.5 h-3.5" />
              <span>Type to search or filter list</span>
            </div>
          )}

          {/* Existing matching options */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const checked = isSelected(opt.name);
              const isInactive = opt.isActive === false;
              return (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => toggleOption(opt.name)}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                    checked ? 'font-semibold text-gray-900 bg-gray-50/60' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={isInactive ? 'line-through text-gray-400' : ''}>
                      {opt.name}
                    </span>
                    {isInactive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  {checked && <Check className="w-4 h-4 text-black" />}
                </button>
              );
            })
          ) : query.trim() ? (
            <div className="px-4 py-3 text-xs text-gray-500">
              No existing active options match "{query}".
            </div>
          ) : (
            <div className="px-4 py-3 text-xs text-gray-400 text-center">
              No options available
            </div>
          )}

          {/* Add Option Flow: When user types an unlisted query */}
          {query.trim() && !exactMatchExists && (
            <div className="pt-2 mt-1 border-t border-gray-100 px-3">
              {category ? (
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={handleCreateOption}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>
                    Create active option "{query.trim()}" in{' '}
                    {categoryLabel || category}
                  </span>
                </button>
              ) : allowFreeTextWithoutCategory ? (
                <button
                  type="button"
                  onClick={handleAddFreeText}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add "{query.trim()}"</span>
                </button>
              ) : (
                <p className="text-[11px] text-gray-400 py-1 px-2">
                  Values must be created in Manage Options before selecting.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
