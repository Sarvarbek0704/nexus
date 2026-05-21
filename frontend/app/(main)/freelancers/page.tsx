'use client';

import { useState } from 'react';
import { useGetFreelancersQuery } from '@/store/api/usersApi';
import { useGetCategoriesQuery, useGetSkillsQuery } from '@/store/api/skillsApi';
import { Pagination } from '@/components/ui/Pagination';
import { FreelancerCard } from '@/components/freelancers/FreelancerCard';
import { Search, SlidersHorizontal, X, Loader2, Star } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'rating:DESC', label: 'Highest Rated' },
  { value: 'completedJobs:DESC', label: 'Most Completed' },
  { value: 'hourlyRate:ASC', label: 'Lowest Rate' },
  { value: 'hourlyRate:DESC', label: 'Highest Rate' },
];

const EXPERIENCE_LEVELS = ['entry', 'intermediate', 'expert'];
const AVAILABILITY = ['full_time', 'part_time', 'contract'];

export default function FreelancersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('rating:DESC');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');

  const debouncedSearch = useDebounce(search, 400);
  const debouncedSkillSearch = useDebounce(skillSearch, 300);
  const [sortBy, sortOrder] = sort.split(':');

  const { data, isLoading } = useGetFreelancersQuery({
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
    ...filters,
  });

  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: skillsData } = useGetSkillsQuery({ search: debouncedSkillSearch });

  const freelancers = data?.data?.items ?? [];
  const meta = data?.data?.meta;
  const categories = categoriesData?.data ?? [];
  const skills = skillsData?.data ?? [];

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: prev[key] === value ? '' : value }));
    setPage(1);
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Find Freelancers</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {meta?.totalItems ? `${meta.totalItems.toLocaleString()} freelancers available` : 'Discover talented professionals'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, skills, or expertise..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 focus:ring-1 focus:ring-nexus-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 text-gray-700 dark:text-gray-300"
        >
          {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
            filtersOpen ? 'bg-nexus-600 text-white border-nexus-600' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        {filtersOpen && (
          <aside className="w-60 flex-shrink-0 space-y-5">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Experience Level</h3>
              <div className="space-y-2">
                {EXPERIENCE_LEVELS.map((level) => (
                  <label key={level} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={filters.experienceLevel === level}
                      onChange={() => setFilter('experienceLevel', level)}
                      className="accent-nexus-600"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Availability</h3>
              <div className="space-y-2">
                {AVAILABILITY.map((avail) => (
                  <label key={avail} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={filters.availability === avail}
                      onChange={() => setFilter('availability', avail)}
                      className="accent-nexus-600"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{avail.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Category</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={filters.categoryId === cat.id}
                      onChange={() => setFilter('categoryId', cat.id)}
                      className="accent-nexus-600"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Hourly Rate</h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min $"
                  value={filters.minRate || ''}
                  onChange={(e) => setFilters((p) => ({ ...p, minRate: e.target.value }))}
                  className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                />
                <input
                  type="number"
                  placeholder="Max $"
                  value={filters.maxRate || ''}
                  onChange={(e) => setFilters((p) => ({ ...p, maxRate: e.target.value }))}
                  className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            <button
              onClick={() => { setFilters({}); setPage(1); }}
              className="w-full py-2 text-sm text-red-500 hover:text-red-700 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              Clear Filters
            </button>
          </aside>
        )}

        {/* Results */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
            </div>
          ) : freelancers.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No freelancers found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {freelancers.map((freelancer) => (
                <FreelancerCard key={freelancer.id} freelancer={freelancer} />
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="mt-6">
              <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

