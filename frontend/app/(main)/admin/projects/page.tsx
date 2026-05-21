"use client";

import Link from "next/link";
import { Briefcase, ArrowLeft } from "lucide-react";

export default function AdminProjectsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Projects
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage all project listings and project-level workflows from the
            admin panel.
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
      </div>

      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-300">
          <Briefcase className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Projects admin is coming soon
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          The project management page is not implemented yet. You can still
          manage users, disputes, and payments from the admin panel.
        </p>
      </div>
    </div>
  );
}
