'use client';

export const dynamic = 'force-dynamic';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGetProjectsQuery } from '@/store/api/projectsApi';
import { useGetCategoriesQuery } from '@/store/api/skillsApi';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectFilters } from '@/components/projects/ProjectFilters';
import { Pagination } from '@/components/ui/Pagination';
import { Loader2, Search, SlidersHorizontal, X, LayoutGrid, List } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export default function ProjectsPage() {
  const t = useT();
  const searchParams = useSearchParams();

  const SORT_OPTIONS = [
    { value: 'createdAt:DESC', label: t.projectsPage.sort.newest },
    { value: 'createdAt:ASC', label: t.projectsPage.sort.oldest },
    { value: 'budget:DESC', label: t.projectsPage.sort.highestBudget },
    { value: 'budget:ASC', label: t.projectsPage.sort.lowestBudget },
    { value: 'deadline:ASC', label: t.projectsPage.sort.deadline },
  ];
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearch(q);
  }, [searchParams]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState('createdAt:DESC');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const debouncedSearch = useDebounce(search, 400);
  const [sortBy, sortOrder] = sort.split(':');

  const { data, isLoading, isFetching } = useGetProjectsQuery({
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
    status: 'open',
    ...filters,
  });

  const projects = data?.data ?? [];
  const meta = data?.meta;

  const handleFilterChange = useCallback((newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex h-full">
      {/* Filter Sidebar */}
      <ProjectFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onChange={handleFilterChange}
        values={filters}
      />

      <div className="flex-1 p-6 space-y-5 overflow-auto">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.projectsPage.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {meta?.total ? `${meta.total.toLocaleString()} ${t.projectsPage.available}` : t.projectsPage.opportunity}
          </p>
        </div>

        {/* Search & Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t.projects.search}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 focus:ring-1 focus:ring-nexus-500 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                filtersOpen
                  ? 'bg-nexus-600 text-white border-nexus-600'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t.projects.filters}
              {activeFilterCount > 0 && (
                <span className="bg-white text-nexus-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="px-3 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 text-gray-700 dark:text-gray-300"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={cn('p-2.5', viewMode === 'grid' ? 'bg-nexus-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn('p-2.5', viewMode === 'list' ? 'bg-nexus-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Strip */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).filter(([, v]) => v).map(([key, value]) => (
              <span key={key} className="flex items-center gap-1.5 px-3 py-1 bg-nexus-50 dark:bg-nexus-950/50 text-nexus-700 dark:text-nexus-300 rounded-full text-xs font-medium">
                {key}: {value}
                <button onClick={() => handleFilterChange({ ...filters, [key]: '' })}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => handleFilterChange({})}
              className="text-xs text-gray-500 hover:text-red-500 underline"
            >
              {t.projectsPage.clearAll}
            </button>
          </div>
        )}

        {/* Results */}
        {isLoading || isFetching ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.projects.noResults}</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{t.projects.noResultsSub}</p>
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'
              : 'space-y-4'
          )}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} viewMode={viewMode} />
            ))}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}

