"use client";

import { HiClipboardList } from "react-icons/hi";
import { useInvestments } from "@/hooks/investment";

const STATUS_LABEL: Record<string, string> = {
  unmatched: "Awaiting Sale",
  matched: "Matched to Sale",
};

const STATUS_COLOR: Record<string, string> = {
  unmatched: "bg-amber-100 text-amber-800",
  matched: "bg-green-100 text-green-800",
};

export default function InvestorInvestmentsPage() {
  const { investments, isLoading } = useInvestments();

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
        <h1 className="text-3xl font-bold text-slate-900">My Investments</h1>
        <p className="text-slate-600 mt-1">Every unit you've funded and its current status</p>
      </div>

      {investments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 text-center py-20">
          <HiClipboardList className="w-20 h-20 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No investments yet</h3>
          <p className="text-slate-600">Browse investable products to place your first investment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Product</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Invested</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Expected Payout</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((investment: any) => (
                  <tr key={investment._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-slate-900">
                      {typeof investment.product === "object" ? investment.product?.name : "—"}
                    </td>
                    <td className="py-4 px-6 text-slate-900">₹{investment.amountInvested}</td>
                    <td className="py-4 px-6 text-slate-900">₹{investment.expectedPayout}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[investment.status] || "bg-gray-100 text-gray-800"}`}>
                        {STATUS_LABEL[investment.status] || investment.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-sm">
                      {new Date(investment.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
