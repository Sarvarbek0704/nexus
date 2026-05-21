'use client';

import { useState, useEffect } from 'react';
import { useGetCategoriesQuery } from '@/store/api/skillsApi';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectFiltersProps {
  open: boolean;
  onClose: () => void;
  onChange: (filters: Record<string, string>) => void;
  values: Record<string, string>;
}

const PROJECT_TYPES = ['fixed', 'hourly'];
const EXPERIENCE_LEVELS = ['entry', 'intermediate', 'expert'];
const BUDGET_RANGES = [
  { label: 'Under $500', value: '0:500' },
  { label: '$500 - $2,000', value: '500:2000' },
  { label: '$2,000 - $10,000', value: '2000:10000' },
  { label: '$10,000+', value: '10000:' },
];
const DURATION_OPTIONS = [
  { label: '< 1 week', value: 'less_than_1_week' },
  { label: '1-4 weeks', value: '1_to_4_weeks' },
  { label: '1-3 months', value: '1_to_3_months' },
  { label: '3-6 months', value: '3_to_6_months' },
  { label: '6+ months', value: 'more_than_6_months' },
];

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3 text-sm font-medium text-gray-900 dark:text-white"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

export function ProjectFilters({ open, onClose, onChange, values }: ProjectFiltersProps) {
  const { data: categoriesData } = useGetCategoriesQuery();
  const categories = categoriesData?.data ?? [];
  const [local, setLocal] = useState(values);

  useEffect(() => { setLocal(values); }, [values]);

  const set = (key: string, value: string) => {
    const updated = { ...local, [key]: value };
    setLocal(updated);
    onChange(updated);
  };

  const toggle = (key: string, value: string) => {
    set(key, local[key] === value ? '' : value);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-10 lg:hidden" onClick={onClose} />
      <aside className={cn(
        'w-72 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
        'lg:static lg:block',
        'fixed inset-y-0 left-0 z-20 overflow-y-auto lg:overflow-visible',
        'shadow-xl lg:shadow-none'
      )}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 lg:hidden">
          <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-4 space-y-0">
          {/* Category */}
          <FilterSection title="Category">
            <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="categoryId"
                    checked={local.categoryId === cat.id}
                    onChange={() => toggle('categoryId', cat.id)}
                    className="accent-nexus-600"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {cat.name}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">{cat._count?.projects ?? 0}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Project Type */}
          <FilterSection title="Project Type">
            <div className="flex gap-2 flex-wrap">
              {PROJECT_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggle('type', type)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize',
                    local.type === type
                      ? 'bg-nexus-600 text-white border-nexus-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-nexus-400'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Experience Level */}
          <FilterSection title="Experience Required">
            <div className="space-y-1.5">
              {EXPERIENCE_LEVELS.map((level) => (
                <label key={level} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="experienceRequired"
                    checked={local.experienceRequired === level}
                    onChange={() => toggle('experienceRequired', level)}
                    className="accent-nexus-600"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{level}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Budget Range */}
          <FilterSection title="Budget Range">
            <div className="space-y-1.5">
              {BUDGET_RANGES.map((range) => (
                <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="budgetRange"
                    checked={local.budgetRange === range.value}
                    onChange={() => toggle('budgetRange', range.value)}
                    className="accent-nexus-600"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{range.label}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Duration */}
          <FilterSection title="Project Duration" defaultOpen={false}>
            <div className="space-y-1.5">
              {DURATION_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="duration"
                    checked={local.duration === opt.value}
                    onChange={() => toggle('duration', opt.value)}
                    className="accent-nexus-600"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{opt.label}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Clear */}
          <div className="pt-4">
            <button
              onClick={() => { setLocal({}); onChange({}); }}
              className="w-full py-2 text-sm text-red-500 hover:text-red-700 font-medium border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

