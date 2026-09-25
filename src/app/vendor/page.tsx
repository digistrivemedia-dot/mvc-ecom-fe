"use client";

import Link from "next/link";
import { HiShoppingBag, HiCheckCircle, HiClock, HiCurrencyRupee, HiPlus } from "react-icons/hi";
import { useVendorStats } from "@/hooks/vendor";

export default function VendorDashboard() {
  const { stats, isLoading } = useVendorStats();

  const cards = [
    { label: "Total Products", value: stats.productCount, icon: HiShoppingBag, color: "bg-blue-500" },
    { label: "Live Listings", value: stats.liveCount, icon: HiCheckCircle, color: "bg-green-500" },
    { label: "Pending Approval", value: stats.pendingApprovalCount, icon: HiClock, color: "bg-amber-500" },
    { label: "Units Sold", value: stats.unitsSold, icon: HiShoppingBag, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Vendor Dashboard</h1>
          <p className="text-slate-600 mt-1">Track your listings, sales, and income</p>
        </div>
        <Link
          href="/vendor/products/create"
          className="inline-flex items-center gap-2 px-5 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
        >
          <HiPlus className="w-5 h-5" /> Add Product
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
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
            <HiCurrencyRupee className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Lifetime Income</h2>
        </div>
        <p className="text-4xl font-bold text-slate-900 mt-2">
          {isLoading ? "—" : `₹${stats.lifetimeIncome.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </p>
        <p className="text-slate-500 text-sm mt-2">
          Your cost price paid out for every unit sold, minus any cancelled orders.{" "}
          <Link href="/vendor/income" className="text-blue-600 hover:underline">View full breakdown</Link>
        </p>
      </div>
    </div>
  );
}
