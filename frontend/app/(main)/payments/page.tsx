"use client";

import { useState } from "react";
import {
  useGetTransactionHistoryQuery,
  useDepositMutation,
  useWithdrawMutation,
} from "@/store/api/paymentsApi";
import { useGetMyStatsQuery } from "@/store/api/statsApi";
import { useAppSelector } from "@/store";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Plus,
  Minus,
  Loader2,
  CreditCard,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAYMENT_TYPE_ICONS: Record<string, any> = {
  milestone_payment: ArrowDownLeft,
  escrow_deposit: Lock,
  escrow_release: ArrowUpRight,
  refund: ArrowDownLeft,
  bonus: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  platform_fee: Minus,
  deposit: Plus,
};

const TYPE_TABS = [
  "all",
  "milestone_payment",
  "escrow_deposit",
  "escrow_release",
  "withdrawal",
  "refund",
];

export default function PaymentsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [page, setPage] = useState(1);
  const [activeType, setActiveType] = useState("all");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const { data, isLoading } = useGetTransactionHistoryQuery({
    page,
    limit: 15,
    type: activeType === "all" ? undefined : activeType,
  });

  const { data: statsData } = useGetMyStatsQuery();
  const [deposit, { isLoading: depositing }] = useDepositMutation();
  const [withdraw, { isLoading: withdrawing }] = useWithdrawMutation();

  const payments = data?.data ?? [];
  const meta = data?.meta;
  const stats = statsData?.data;

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await deposit({ amount, method: "wallet" }).unwrap();
      toast.success(`$${amount.toFixed(2)} added to wallet!`);
      setDepositAmount("");
      setShowDeposit(false);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await withdraw({ amount, method: "bank_transfer" }).unwrap();
      toast.success(`$${amount.toFixed(2)} withdrawal initiated!`);
      setWithdrawAmount("");
      setShowWithdraw(false);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Withdrawal failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Payments & Wallet
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your wallet balance, escrow, and transaction history.
        </p>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-nexus-600 to-nexus-700 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-nexus-100 text-sm">Available Balance</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(Number(user?.walletBalance ?? 0))}
              </p>
            </div>
            <div className="p-2.5 bg-white/20 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowDeposit(true);
                setShowWithdraw(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Deposit
            </button>
            <button
              onClick={() => {
                setShowWithdraw(true);
                setShowDeposit(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              <Minus className="w-4 h-4" /> Withdraw
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                In Escrow
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {formatCurrency(Number(user?.escrowBalance ?? 0))}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Funds locked in active contracts
              </p>
            </div>
            <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Lock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.role === "client" ? "Total Spent" : "Total Earned"}
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(
                  user?.role === "client"
                    ? (stats?.totalSpent ?? 0)
                    : (stats?.totalEarned ?? 0),
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> All time total
              </p>
            </div>
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Deposit/Withdraw Forms */}
      {(showDeposit || showWithdraw) && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {showDeposit ? "💳 Add Funds to Wallet" : "🏦 Withdraw Funds"}
          </h3>
          <div className="flex items-center gap-3 max-w-md">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={showDeposit ? depositAmount : withdrawAmount}
                onChange={(e) =>
                  showDeposit
                    ? setDepositAmount(e.target.value)
                    : setWithdrawAmount(e.target.value)
                }
                placeholder="0.00"
                className="w-full pl-7 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
              />
            </div>
            <button
              onClick={showDeposit ? handleDeposit : handleWithdraw}
              disabled={depositing || withdrawing}
              className="flex items-center gap-2 px-5 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {(depositing || withdrawing) && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {showDeposit ? "Add Funds" : "Withdraw"}
            </button>
            <button
              onClick={() => {
                setShowDeposit(false);
                setShowWithdraw(false);
              }}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
          {showDeposit && (
            <div className="flex gap-2 mt-3">
              {[50, 100, 250, 500, 1000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setDepositAmount(String(amount))}
                  className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg hover:border-nexus-400 transition-colors text-gray-600 dark:text-gray-400"
                >
                  ${amount}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Transaction History
          </h3>
        </div>

        {/* Type Filter */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
          <div className="flex gap-1 w-fit">
            {TYPE_TABS.map((type) => (
              <button
                key={type}
                onClick={() => {
                  setActiveType(type);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                  activeType === type
                    ? "bg-nexus-600 text-white"
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800",
                )}
              >
                {type === "all" ? "All" : type.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-nexus-500" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No transactions yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {payments.map((payment) => {
              const Icon = PAYMENT_TYPE_ICONS[payment.type] || DollarSign;
              const isCredit = [
                "milestone_payment",
                "escrow_release",
                "refund",
                "bonus",
                "deposit",
              ].includes(payment.type);

              return (
                <div
                  key={payment.id}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      isCredit
                        ? "bg-emerald-100 dark:bg-emerald-900/30"
                        : "bg-red-100 dark:bg-red-900/30",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        isCredit
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500",
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {payment.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {payment.description || payment.transactionId}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p
                      className={cn(
                        "font-semibold text-sm",
                        isCredit
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500",
                      )}
                    >
                      {isCredit ? "+" : "-"}
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(payment.createdAt)}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium capitalize ml-2",
                      getStatusColor(payment.status),
                    )}
                  >
                    {payment.status}
                  </span>
                </div>
              );
            })}
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
