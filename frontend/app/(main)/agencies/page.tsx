'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGetAgenciesQuery } from '@/store/api/agenciesApi';
import { useDebounce } from '@/hooks/useDebounce';
import { formatRelativeTime } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import {
  Building2, Search, Users, Star, MapPin, Globe, Briefcase,
  Shield, Loader2, ChevronRight, SlidersHorizontal, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZE_OPTIONS = ['any', '1-5', '6-15', '16-50', '50+'];
const SORT_OPTIONS = [
  { label: 'Newest', value: 'createdAt:desc' },
  { label: 'Highest Rated', value: 'rating:desc' },
  { label: 'Most Projects', value: 'projects:desc' },
  { label: 'Most Members', value: 'members:desc' },
];

export default function AgenciesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [size, setSize] = useState('any');
  const [sort, setSort] = useState('createdAt:desc');
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(search, 400);
  const [sortBy, sortOrder] = sort.split(':');

  const { data, isLoading } = useGetAgenciesQuery({
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    size: size !== 'any' ? size : undefined,
    sortBy,
    sortOrder,
  });

  const agencies = data?.data ?? [];
  const meta = data?.meta;

  const activeFilters = [
    ...(size !== 'any' ? [{ key: 'size', label: `Size: ${size}` }] : []),
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Agencies</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {meta?.total ?? 0} agencies available for hire
          </p>
        </div>
      </div>

      {/* Search & Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search agencies by name, expertise..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-nexus-500"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border rounded-lg transition-colors',
            showFilters
              ? 'border-nexus-500 text-nexus-600 dark:text-nexus-400 bg-nexus-50 dark:bg-nexus-950/30'
              : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilters.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-nexus-600 text-white text-xs flex items-center justify-center">
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((f) => (
            <span key={f.key} className="flex items-center gap-1.5 px-3 py-1 bg-nexus-50 dark:bg-nexus-950/30 text-nexus-700 dark:text-nexus-300 border border-nexus-200 dark:border-nexus-800 rounded-full text-sm">
              {f.label}
              <button onClick={() => { if (f.key === 'size') setSize('any'); setPage(1); }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          <button onClick={() => { setSize('any'); setPage(1); }} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <aside className="w-56 flex-shrink-0 space-y-5">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Team Size</h4>
              <div className="space-y-2">
                {SIZE_OPTIONS.map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="size"
                      value={s}
                      checked={size === s}
                      onChange={() => { setSize(s); setPage(1); }}
                      className="accent-nexus-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {s === 'any' ? 'Any size' : `${s} members`}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Agency Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
            </div>
          ) : agencies.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No agencies found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {agencies.map((agency) => (
                <AgencyCard key={agency.id} agency={agency} />
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="mt-8">
              <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AgencyCard({ agency }: { agency: any }) {
  return (
    <Link
      href={`/agencies/${agency.id}`}
      className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:border-nexus-300 dark:hover:border-nexus-700 hover:shadow-md transition-all block"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {agency.logo ? (
            <img src={agency.logo} alt={agency.name} className="w-14 h-14 object-cover rounded-xl" />
          ) : (
            <Building2 className="w-7 h-7 text-nexus-600 dark:text-nexus-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-nexus-600 dark:group-hover:text-nexus-400 truncate transition-colors">
              {agency.name}
            </h3>
            {agency.isVerified && (
              <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            )}
          </div>
          {agency.tagline && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{agency.tagline}</p>
          )}
        </div>
      </div>

      {agency.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
          {agency.description}
        </p>
      )}

      {/* Skills */}
      {agency.skills && agency.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {agency.skills.slice(0, 4).map((skill: any) => (
            <span key={skill.id} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">
              {skill.name}
            </span>
          ))}
          {agency.skills.length > 4 && (
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded text-xs">
              +{agency.skills.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          {agency.rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">{agency.rating?.toFixed(1)}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {agency._count?.members ?? 0}
          </span>
          {agency.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {agency.location}
            </span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-nexus-500 transition-colors" />
      </div>
    </Link>
  );
}
