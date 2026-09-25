"use client";

import Link from "next/link";
import { HiCash, HiCurrencyRupee, HiClock, HiCheckCircle, HiTrendingUp } from "react-icons/hi";
import { useInvestments, useInvestorEarnings } from "@/hooks/investment";

export default function InvestorDashboard() {
  const { investments, isLoading: investmentsLoading } = useInvestments();
  const { totals, isLoading: earningsLoading } = useInvestorEarnings();

  const unmatchedCount = investments.filter((inv: any) => inv.status === "unmatched").length;
  const matchedCount = investments.filter((inv: any) => inv.status === "matched").length;
  const isLoading = investmentsLoading || earningsLoading;

  const cards = [
    { label: "Total Invested", value: `₹${totals.totalInvested.toLocaleString("en-IN")}`, icon: HiCash, color: "bg-emerald-500" },
    { label: "Total Returned", value: `₹${totals.totalPaidOut.toLocaleString("en-IN")}`, icon: HiCurrencyRupee, color: "bg-blue-500" },
    { label: "Awaiting Sale", value: unmatchedCount, icon: HiClock, color: "bg-amber-500" },
    { label: "Matched to Sale", value: matchedCount, icon: HiCheckCircle, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Investor Dashboard</h1>
          <p className="text-slate-600 mt-1">Track your investments and returns</p>
        </div>
        <Link
          href="/investor/products"
          className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
        >
          <HiTrendingUp className="w-5 h-5" /> Browse Products
        </Link>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-slate-600 text-sm">{card.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {isLoading ? "—" : card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
        <p className="text-slate-600 text-sm">
          Investing funds one physical unit of a product's stock. When that unit sells to a customer, you get your fixed payout back.
          If your unit hasn't sold yet, it stays "Awaiting Sale" — no risk of losing your place in line.{" "}
          <Link href="/investor/investments" className="text-emerald-600 hover:underline">View your investments</Link>
        </p>
      </div>
    </div>
  );
}
