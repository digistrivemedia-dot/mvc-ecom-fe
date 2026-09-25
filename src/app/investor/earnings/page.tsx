"use client";

import { HiCash, HiCurrencyRupee } from "react-icons/hi";
import { useInvestorEarnings } from "@/hooks/investment";

const TYPE_LABEL: Record<string, string> = {
  investor_investment: "Capital Invested",
  investor_payout: "Payouts Received",
  investor_reversal: "Reversals (order cancelled)",
};

export default function InvestorEarningsPage() {
  const { totals, data, isLoading } = useInvestorEarnings();

  const netReturn = totals.totalPaidOut - totals.totalInvested;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Earnings</h1>
        <p className="text-slate-600 mt-1">Your capital, payouts, and net return</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <HiCash className="w-5 h-5 text-white" />
            </div>
            <p className="text-slate-600 text-sm">Total Invested</p>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-2">₹{totals.totalInvested.toLocaleString("en-IN")}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <HiCurrencyRupee className="w-5 h-5 text-white" />
            </div>
            <p className="text-slate-600 text-sm">Total Returned</p>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-2">₹{totals.totalPaidOut.toLocaleString("en-IN")}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <p className="text-slate-600 text-sm mb-3">Net Return</p>
          <p className={`text-3xl font-bold mt-2 ${netReturn < 0 ? "text-red-600" : "text-slate-900"}`}>
            {netReturn < 0 ? "-" : ""}₹{Math.abs(netReturn).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Breakdown</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {(data?.transactions ?? []).map((row: any) => (
            <div key={row._id} className="flex items-center justify-between px-6 py-4">
              <span className="text-slate-700">{TYPE_LABEL[row._id] || row._id}</span>
              <span className={`font-semibold ${row.total < 0 ? "text-red-600" : "text-slate-900"}`}>
                {row.total < 0 ? "-" : ""}₹{Math.abs(row.total).toLocaleString("en-IN")}
              </span>
            </div>
          ))}
          {(!data?.transactions || data.transactions.length === 0) && (
            <p className="px-6 py-8 text-center text-slate-500">No activity yet — place your first investment to get started.</p>
          )}
        </div>
      </div>
    </div>
  );
}
