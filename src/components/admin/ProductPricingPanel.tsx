"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FiCheckCircle, FiPauseCircle, FiXCircle, FiRefreshCw, FiAlertTriangle } from "react-icons/fi";
import { useProductPricingMutation } from "@/hooks/product/mutations/useProductPricingMutation";

interface ProductPricingPanelProps {
  product: any;
  onUpdated?: (product: any) => void;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  live: "Live",
  rejected: "Rejected",
  paused: "Paused",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending_approval: "bg-amber-100 text-amber-800",
  live: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  paused: "bg-slate-200 text-slate-700",
};

// Superadmin-only. Sets the customer/investor pricing and controls whether
// the listing is visible on the storefront/investor page. Deliberately
// self-contained (own fetches, own state) — does not touch the surrounding
// edit form's state so it can be dropped into any product detail/edit page.
export function ProductPricingPanel({ product, onUpdated }: ProductPricingPanelProps) {
  const { pricing, listingStatus } = useProductPricingMutation();

  const [price, setPrice] = useState(product.price?.toString() ?? "");
  const [investorPrice, setInvestorPrice] = useState(product.investorPrice?.toString() ?? "");
  const [investorPayout, setInvestorPayout] = useState(product.investorPayout?.toString() ?? "");
  const [investableUnits, setInvestableUnits] = useState(product.investableUnits?.toString() ?? "");
  const [customerMarkupPct, setCustomerMarkupPct] = useState("");
  const [investorMarkupPct, setInvestorMarkupPct] = useState("");

  const vendorPrice = product.vendorPrice ?? 0;

  // This panel has its OWN save button, separate from the page's main
  // "Update Product" submit — that button never sees these fields (they're
  // not part of that form). Surface a hard-to-miss warning if the admin has
  // typed a change here but hasn't clicked "Save Pricing" yet, so it can't
  // be silently lost by clicking the other button instead.
  const isDirty =
    price !== (product.price?.toString() ?? "") ||
    investorPrice !== (product.investorPrice?.toString() ?? "") ||
    investorPayout !== (product.investorPayout?.toString() ?? "") ||
    investableUnits !== (product.investableUnits?.toString() ?? "");

  // Quick-fill helpers: typing a % here auto-computes the price field below
  // from the vendor's cost (vendorPrice * (1 + pct/100)). The price fields
  // stay directly editable too — this is just a shortcut, not a hard link.
  const handleCustomerMarkupChange = (value: string) => {
    setCustomerMarkupPct(value);
    const pct = Number(value);
    if (value !== "" && !Number.isNaN(pct) && vendorPrice > 0) {
      setPrice((vendorPrice * (1 + pct / 100)).toFixed(2));
    }
  };

  const handleInvestorMarkupChange = (value: string) => {
    setInvestorMarkupPct(value);
    const pct = Number(value);
    if (value !== "" && !Number.isNaN(pct) && vendorPrice > 0) {
      setInvestorPrice((vendorPrice * (1 + pct / 100)).toFixed(2));
    }
  };

  // Superadmin's margin per unit, live as they type — see
  // MARKETPLACE_CONVERSION_PLAN.md for the formula.
  const marginPreview = useMemo(() => {
    const customerPriceNum = Number(price) || 0;
    const investorPriceNum = Number(investorPrice) || 0;
    const investorPayoutNum = Number(investorPayout) || 0;

    const withInvestor = customerPriceNum + investorPriceNum - vendorPrice - investorPayoutNum;
    const withoutInvestor = customerPriceNum - vendorPrice;

    return { withInvestor, withoutInvestor };
  }, [price, investorPrice, investorPayout, vendorPrice]);

  const handleSavePricing = async () => {
    if (!price || Number(price) <= 0) {
      toast.error("Customer price is required");
      return;
    }

    try {
      const updated = await pricing.mutateAsync({
        productId: product._id,
        data: {
          price: Number(price),
          investorPrice: investorPrice ? Number(investorPrice) : null,
          investorPayout: investorPayout ? Number(investorPayout) : null,
          investableUnits: investableUnits ? Number(investableUnits) : null,
        },
      });
      toast.success("Pricing updated");
      onUpdated?.(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update pricing");
    }
  };

  const handleResetToGlobal = async () => {
    try {
      const updated = await pricing.mutateAsync({
        productId: product._id,
        data: { useGlobalPricing: true },
      });
      toast.success("Reset to global pricing");
      setPrice(updated.price?.toString() ?? "");
      setInvestorPrice(updated.investorPrice?.toString() ?? "");
      setInvestorPayout(updated.investorPayout?.toString() ?? "");
      onUpdated?.(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset pricing");
    }
  };

  const handleSetListingStatus = async (status: "live" | "rejected" | "paused" | "draft") => {
    try {
      const updated = await listingStatus.mutateAsync({
        productId: product._id,
        data: { listingStatus: status },
      });
      toast.success(`Listing marked ${STATUS_LABEL[status]}`);
      onUpdated?.(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update listing status");
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-slate-900">Superadmin Pricing</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Vendor cost, customer price, and investor terms — only superadmin can set these.
            <span className="font-medium text-amber-700"> This panel has its own Save Pricing button below — the page's Update Product button at the bottom does not save these fields.</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            product.useGlobalPricing === false ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"
          }`}>
            {product.useGlobalPricing === false ? "Custom Pricing" : "Global Pricing"}
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[product.listingStatus] || STATUS_COLOR.draft}`}>
            {STATUS_LABEL[product.listingStatus] || "Draft"}
          </span>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Quick markup helpers — type a % instead of doing the rupee math yourself */}
        <div className="grid md:grid-cols-2 gap-6 bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Customer Markup % (quick-fill)</label>
            <input
              type="number"
              value={customerMarkupPct}
              onChange={(e) => handleCustomerMarkupChange(e.target.value)}
              placeholder="e.g. 50"
              disabled={!vendorPrice}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all disabled:opacity-50"
            />
            <p className="text-xs text-slate-500 mt-1.5">Fills Customer Price below from vendor cost. You can still edit Customer Price directly.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Investor Markup % (quick-fill)</label>
            <input
              type="number"
              value={investorMarkupPct}
              onChange={(e) => handleInvestorMarkupChange(e.target.value)}
              placeholder="e.g. 20"
              disabled={!vendorPrice}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all disabled:opacity-50"
            />
            <p className="text-xs text-slate-500 mt-1.5">Fills Investor Price below from vendor cost. You can still edit Investor Price directly.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Vendor Price (cost, read-only)</label>
            <input
              value={vendorPrice}
              disabled
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Customer Price *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="150"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Investor Price (optional)</label>
            <input
              type="number"
              value={investorPrice}
              onChange={(e) => setInvestorPrice(e.target.value)}
              placeholder="120"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Investor Payout (optional)</label>
            <input
              type="number"
              value={investorPayout}
              onChange={(e) => setInvestorPayout(e.target.value)}
              placeholder="130"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Investable Units (optional, defaults to stock)</label>
            <input
              type="number"
              value={investableUnits}
              onChange={(e) => setInvestableUnits(e.target.value)}
              placeholder={product.stock?.toString()}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Live margin readout */}
        <div className="grid md:grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Your profit — unit sold with investor</p>
            <p className={`text-2xl font-semibold ${marginPreview.withInvestor < 0 ? "text-red-600" : "text-slate-900"}`}>
              ₹{marginPreview.withInvestor.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Your profit — unit sold without investor</p>
            <p className={`text-2xl font-semibold ${marginPreview.withoutInvestor < 0 ? "text-red-600" : "text-slate-900"}`}>
              ₹{marginPreview.withoutInvestor.toFixed(2)}
            </p>
          </div>
          {marginPreview.withInvestor < 0 && (
            <p className="md:col-span-2 text-xs text-red-600">
              Warning: with these numbers you lose money on investor-funded sales.
            </p>
          )}
        </div>

        {isDirty && (
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
            Unsaved pricing changes — click "Save Pricing" below to keep them, or they'll be lost.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSavePricing}
            disabled={pricing.isPending}
            className={`px-5 py-2.5 rounded-xl transition-all text-sm font-medium disabled:opacity-50 ${
              isDirty ? "bg-amber-600 text-white hover:bg-amber-700 ring-2 ring-amber-300" : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {pricing.isPending ? "Saving..." : isDirty ? "Save Pricing (unsaved changes)" : "Save Pricing"}
          </button>

          {product.vendorPrice != null && (
            <button
              type="button"
              onClick={handleResetToGlobal}
              disabled={pricing.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all text-sm font-medium disabled:opacity-50"
              title="Recompute this product's pricing from the current global markup settings"
            >
              <FiRefreshCw className="w-4 h-4" /> Reset to Global Pricing
            </button>
          )}

          <div className="w-px h-6 bg-slate-200 mx-1" />

          <button
            type="button"
            onClick={() => handleSetListingStatus("live")}
            disabled={listingStatus.isPending || product.pricingStatus !== "priced"}
            title={product.pricingStatus !== "priced" ? "Save pricing before publishing" : undefined}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FiCheckCircle className="w-4 h-4" /> Publish (Live)
          </button>

          <button
            type="button"
            onClick={() => handleSetListingStatus("paused")}
            disabled={listingStatus.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all text-sm font-medium disabled:opacity-40"
          >
            <FiPauseCircle className="w-4 h-4" /> Pause
          </button>

          <button
            type="button"
            onClick={() => handleSetListingStatus("rejected")}
            disabled={listingStatus.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-all text-sm font-medium disabled:opacity-40"
          >
            <FiXCircle className="w-4 h-4" /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}
