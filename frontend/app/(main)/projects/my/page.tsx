'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGetMyProjectsQuery } from '@/store/api/projectsApi';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Briefcase, Plus, Loader2, Eye, Users } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const STATUS_TABS = ['all', 'open', 'in_progress', 'paused', 'completed', 'cancelled', 'draft'];

export default function MyProjectsPage() {
  const t = useT();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');

  const { data, isLoading } = useGetMyProjectsQuery({
    page,
    limit: 12,
    status: status === 'all' ? undefined : status,
  });

  const projects = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.myProjects.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {meta?.total ? `${meta.total} ${t.myProjects.posted}` : t.myProjects.manageProjects}
          </p>
        </div>
        <Link
          href="/projects/post"
          className="flex items-center gap-2 px-4 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t.myProjects.postNew}
        </Link>
      </div>

      <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize whitespace-nowrap',
              status === s
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            {s === 'all' ? t.myProjects.tabs.all : (t.myProjects.tabs as any)[s] ?? s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.myProjects.noProjects}</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {status === 'all' ? t.myProjects.noProjectsYet : t.myProjects.noProjectsStatus.replace('{status}', status.replace('_', ' '))}
          </p>
          {status === 'all' && (
            <Link
              href="/projects/post"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> {t.myProjects.postFirst}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((project: any) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-card-hover hover:border-nexus-200 dark:hover:border-nexus-800 transition-all flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4 text-nexus-600 dark:text-nexus-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug truncate">
                    {project.title}
                  </h3>
                </div>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize flex-shrink-0', getStatusColor(project.status))}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>

              {project.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {project._count?.bids ?? project.bidsCount ?? 0} {t.myProjects.bids}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {project.viewsCount ?? 0} {t.myProjects.views}
                </span>
                {(project.budgetMin || project.budgetMax) && (
                  <span className="ml-auto font-medium text-gray-700 dark:text-gray-300">
                    {project.budgetMin && project.budgetMax
                      ? `${formatCurrency(project.budgetMin)}–${formatCurrency(project.budgetMax)}`
                      : formatCurrency(project.budgetMin || project.budgetMax)}
                  </span>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 flex items-center justify-between">
                <span>{t.myProjects.posted2} {formatDate(project.createdAt)}</span>
                {project.category?.name && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                    {project.category.name}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
