"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useGetAllDisputesQuery,
  useResolveDisputeMutation,
} from "@/store/api/disputesApi";
import { formatRelativeTime, formatCurrency } from "@/lib/utils";
import { Pagination } from "@/components/ui/Pagination";
import {
  AlertTriangle,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Search,
  X,
  ChevronRight,
  DollarSign,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_TABS = ["all", "open", "under_review", "resolved", "closed"];

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  open: {
    color:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    icon: AlertTriangle,
  },
  under_review: {
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    icon: Shield,
  },
  resolved: {
    color:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    icon: CheckCircle,
  },
  closed: {
    color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    icon: XCircle,
  },
};

export default function AdminDisputesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");

  const { data, isLoading } = useGetAllDisputesQuery({
    page,
    limit: 15,
    status: status !== "all" ? status : undefined,
    search: search || undefined,
  });
  const [resolveDispute, { isLoading: resolving }] =
    useResolveDisputeMutation();

  const disputes = data?.data ?? [];
  const meta = data?.meta;

  const handleResolve = async (id: string, outcome: string) => {
    if (!resolution.trim()) {
      toast.error("Resolution note required");
      return;
    }
    try {
      await resolveDispute({ id, outcome, resolution }).unwrap();
      toast.success("Dispute resolved");
      setResolvingId(null);
      setResolution("");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to resolve dispute");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dispute Management
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Review and resolve disputes between users
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search disputes..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-900"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setStatus(tab);
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
              status === tab
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Disputes Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            No disputes found
          </h3>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute: any) => {
            const cfg = STATUS_CONFIG[dispute.status] ?? STATUS_CONFIG.open;
            const Icon = cfg.icon;
            const isExpanded = resolvingId === dispute.id;

            return (
              <div
                key={dispute.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn("p-2 rounded-lg flex-shrink-0", cfg.color)}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs text-gray-400">
                              #{dispute.disputeNumber}
                            </span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                                cfg.color,
                              )}
                            >
                              {dispute.status.replace("_", " ")}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {dispute.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {dispute.complainant?.firstName}{" "}
                            {dispute.complainant?.lastName} vs{" "}
                            {dispute.respondent?.firstName}{" "}
                            {dispute.respondent?.lastName}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {dispute.claimedAmount && (
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(dispute.claimedAmount)}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatRelativeTime(dispute.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        <Link
                          href={`/disputes/${dispute.id}`}
                          className="flex items-center gap-1 text-xs text-nexus-600 dark:text-nexus-400 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Details
                        </Link>
                        {dispute.messages?.length > 0 && (
                          <span className="text-xs text-gray-400">
                            {dispute.messages.length} messages
                          </span>
                        )}
                        {(dispute.status === "open" ||
                          dispute.status === "under_review") && (
                          <button
                            onClick={() =>
                              setResolvingId(isExpanded ? null : dispute.id)
                            }
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline ml-auto"
                          >
                            {isExpanded ? "Cancel" : "Resolve Dispute"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resolve Panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-800 p-5 bg-gray-50 dark:bg-gray-800/50">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Resolve This Dispute
                    </h4>
                    <textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      rows={3}
                      placeholder="Describe the resolution and outcome..."
                      className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 resize-none mb-3"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          handleResolve(dispute.id, "favor_complainant")
                        }
                        disabled={resolving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {resolving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Favor Complainant
                      </button>
                      <button
                        onClick={() =>
                          handleResolve(dispute.id, "favor_respondent")
                        }
                        disabled={resolving}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Favor Respondent
                      </button>
                      <button
                        onClick={() => handleResolve(dispute.id, "split")}
                        disabled={resolving}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Split / Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
  );
}
