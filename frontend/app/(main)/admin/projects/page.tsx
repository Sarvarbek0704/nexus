"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetAdminProjectsQuery } from "@/store/api/projectsApi";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Briefcase, Search, Loader2, ExternalLink } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const STATUS_TABS = ["all", "open", "in_progress", "completed", "cancelled", "closed"];

export default function AdminProjectsPage() {
  const t = useT();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data, isLoading } = useGetAdminProjectsQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });

  const projects = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.adminExtended.projects.title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {meta?.total
              ? `${meta.total.toLocaleString()} ${t.adminExtended.projects.subtitle}`
              : t.adminExtended.projects.subtitleAll}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t.adminExtended.projects.search}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize whitespace-nowrap",
              status === s
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>{t.adminExtended.projects.noProjects}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {[
                    t.adminExtended.projects.headers.project,
                    t.adminExtended.projects.headers.status,
                    t.adminExtended.projects.headers.type,
                    t.adminExtended.projects.headers.budget,
                    t.adminExtended.projects.headers.posted,
                    '',
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {projects.map((project: any) => (
                  <tr
                    key={project.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-5 py-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {project.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {project.category?.name ?? project.type}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                          getStatusColor(project.status),
                        )}
                      >
                        {project.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {project.type}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {project.budgetMin && project.budgetMax
                        ? `${formatCurrency(project.budgetMin)} – ${formatCurrency(project.budgetMax)}`
                        : project.budgetMin
                          ? `${t.adminExtended.projects.from} ${formatCurrency(project.budgetMin)}`
                          : project.hourlyRateMin
                            ? `${formatCurrency(project.hourlyRateMin)}/hr`
                            : "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(project.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/projects/${project.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-nexus-600 dark:text-nexus-400 border border-nexus-200 dark:border-nexus-800 rounded-lg hover:bg-nexus-50 dark:hover:bg-nexus-950/30 transition-colors"
                      >
                        {t.adminExtended.projects.view} <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && (meta.totalPages ?? 1) > 1 && (
          <div className="p-5 border-t border-gray-100 dark:border-gray-800">
            <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
