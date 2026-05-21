"use client";

import { useState } from "react";
import {
  useGetAllUsersQuery,
  useUpdateUserStatusMutation,
} from "@/store/api/usersApi";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  client: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  freelancer:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  agency_owner:
    "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
};

const STATUS_TABS = ["all", "active", "suspended", "banned"];

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("all");

  const { data, isLoading, refetch } = useGetAllUsersQuery({
    page,
    limit: 20,
    search: search || undefined,
    role: role || undefined,
    status: status === "all" ? undefined : status,
  });

  const [updateStatus] = useUpdateUserStatusMutation();

  const users = data?.data ?? [];
  const meta = data?.meta;

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await updateStatus({ userId, status: newStatus }).unwrap();
      toast.success("User status updated");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update status");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Manage Users
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {meta?.total
            ? `${meta.total.toLocaleString()} total users`
            : "All platform users"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search users by name or email..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500"
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 text-gray-700 dark:text-gray-300"
        >
          <option value="">All Roles</option>
          <option value="client">Client</option>
          <option value="freelancer">Freelancer</option>
          <option value="agency_owner">Agency Owner</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
              status === s
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {[
                    "User",
                    "Role",
                    "Status",
                    "Joined",
                    "Last Active",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt=""
                              className="w-9 h-9 object-cover"
                            />
                          ) : (
                            <span className="text-xs font-semibold text-nexus-600 dark:text-nexus-400">
                              {user.firstName?.[0]}
                              {user.lastName?.[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                            {user.isVerified && (
                              <CheckCircle className="inline w-3.5 h-3.5 text-blue-500 ml-1" />
                            )}
                          </p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                          ROLE_COLORS[user.role] || "bg-gray-100 text-gray-600",
                        )}
                      >
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-medium capitalize w-fit",
                          user.status === "active"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : user.status === "suspended"
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-red-500",
                        )}
                      >
                        {user.status === "active" ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {user.lastActiveAt
                        ? formatRelativeTime(user.lastActiveAt)
                        : "Never"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        {user.status === "active" ? (
                          <button
                            onClick={() =>
                              handleStatusChange(user.id, "suspended")
                            }
                            className="px-2.5 py-1 text-xs font-medium text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleStatusChange(user.id, "active")
                            }
                            className="px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                          >
                            Activate
                          </button>
                        )}
                        {!user.isVerified && (
                          <button className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                            Verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="p-5 border-t border-gray-100 dark:border-gray-800">
            <Pagination
              currentPage={page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
