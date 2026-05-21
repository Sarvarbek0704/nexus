import Link from 'next/link';
import { Project } from '@/types';
import { formatCurrency, formatRelativeTime, getStatusColor, formatProjectBudget } from '@/lib/utils';
import { MapPin, Clock, Users, Briefcase, Tag, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  viewMode?: 'grid' | 'list';
}

export function ProjectCard({ project, viewMode = 'grid' }: ProjectCardProps) {
  if (viewMode === 'list') {
    return (
      <Link
        href={`/projects/${project.id}`}
        className="flex gap-5 p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-card-hover hover:border-nexus-200 dark:hover:border-nexus-800 transition-all"
      >
        <div className="w-12 h-12 rounded-xl bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-5 h-5 text-nexus-600 dark:text-nexus-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white hover:text-nexus-600 dark:hover:text-nexus-400 transition-colors line-clamp-1">
                {project.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{project.description}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-gray-900 dark:text-white">{formatProjectBudget(project)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{project.type}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            {project.skills?.slice(0, 4).map((skill) => (
              <span key={skill.id} className="px-2.5 py-0.5 bg-nexus-50 dark:bg-nexus-950/50 text-nexus-700 dark:text-nexus-300 rounded-full text-xs font-medium">
                {skill.name}
              </span>
            ))}
            {(project.skills?.length ?? 0) > 4 && (
              <span className="text-xs text-gray-400">+{(project.skills?.length ?? 0) - 4} more</span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatRelativeTime(project.createdAt)}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {project._count?.bids ?? 0} bids</span>
            {project.experienceRequired && (
              <span className="capitalize">{project.experienceRequired}</span>
            )}
            <span className={cn('px-2 py-0.5 rounded-full capitalize', getStatusColor(project.status))}>{project.status}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex flex-col p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-card-hover hover:border-nexus-200 dark:hover:border-nexus-800 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center">
          <Briefcase className="w-4 h-4 text-nexus-600 dark:text-nexus-400" />
        </div>
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', getStatusColor(project.status))}>
          {project.status}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-nexus-600 dark:group-hover:text-nexus-400 transition-colors line-clamp-2 mb-2">
        {project.title}
      </h3>

      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 flex-1">
        {project.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {project.skills?.slice(0, 3).map((skill) => (
          <span key={skill.id} className="px-2 py-0.5 bg-nexus-50 dark:bg-nexus-950/50 text-nexus-700 dark:text-nexus-300 rounded-full text-xs font-medium">
            {skill.name}
          </span>
        ))}
        {(project.skills?.length ?? 0) > 3 && (
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full text-xs">
            +{(project.skills?.length ?? 0) - 3}
          </span>
        )}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900 dark:text-white text-sm">{formatProjectBudget(project)}</p>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{project.type} · {project.experienceRequired}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 justify-end">
            <Users className="w-3 h-3" /> {project._count?.bids ?? 0} bids
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(project.createdAt)}</p>
        </div>
      </div>
    </Link>
  );
}
