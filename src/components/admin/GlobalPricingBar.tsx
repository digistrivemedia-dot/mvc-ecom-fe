"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { HiCurrencyRupee } from "react-icons/hi";
import { FiLock, FiUnlock } from "react-icons/fi";
import { usePricingSettings, useUpdatePricingSettings } from "@/hooks/admin";

// Superadmin-only. Lets superadmin set the global markup percentages once
// instead of pricing every vendor product by hand — see
// MARKETPLACE_CONVERSION_PLAN.md. Self-contained (own fetch/state) so it
// drops into the products page without touching its existing logic.
export function GlobalPricingBar() {
  const { settings, isLoading } = usePricingSettings();
  const { updateSettings, isPending } = useUpdatePricingSettings();

  const [customerPct, setCustomerPct] = useState("");
  const [investorPct, setInvestorPct] = useState("");
  const [returnPct, setReturnPct] = useState("");
  const [isLocked, setIsLocked] = useState(true);

  // Track if we have performed initial sync from server
  const hasSyncedRef = useRef(false);

  // Input refs so clicking a locked field can auto-unlock and focus
  const customerInputRef = useRef<HTMLInputElement>(null);
  const investorInputRef = useRef<HTMLInputElement>(null);
  const returnInputRef = useRef<HTMLInputElement>(null);

  // Sync settings when loaded from server (only when locked to avoid overwriting active typing)
  useEffect(() => {
    if (!isLoading && settings) {
      if (!hasSyncedRef.current || isLocked) {
        setCustomerPct(settings.customerMarkupPct !== undefined ? settings.customerMarkupPct.toString() : "0");
        setInvestorPct(settings.investorMarkupPct !== undefined ? settings.investorMarkupPct.toString() : "0");
        setReturnPct(settings.investorReturnPct !== undefined ? settings.investorReturnPct.toString() : "0");
        hasSyncedRef.current = true;
      }
    }
  }, [isLoading, settings, isLocked]);

  // Only disable when actively saving or when user has locked it
  const fieldsDisabled = isPending || isLocked;

  const unlockAndFocus = (targetRef?: React.RefObject<HTMLInputElement | null>) => {
    if (isLocked) {
      setIsLocked(false);
      toast.info("Unlocked — you can edit the pricing % now");
      setTimeout(() => {
        targetRef?.current?.focus();
        targetRef?.current?.select();
      }, 50);
    }
  };

  const toggleLock = () => {
    if (isLocked) {
      setIsLocked(false);
      toast.info("Unlocked — you can edit the pricing % now");
      setTimeout(() => {
        customerInputRef.current?.focus();
      }, 50);
    } else {
      setIsLocked(true);
      toast.info("Locked");
    }
  };

  const handleSave = () => {
    if (isLocked) return;
    updateSettings(
      {
        customerMarkupPct: Number(customerPct) || 0,
        investorMarkupPct: Number(investorPct) || 0,
        investorReturnPct: Number(returnPct) || 0,
      },
      {
        onSuccess: (data) => {
          setIsLocked(true);
          if (data?.settings) {
            setCustomerPct(data.settings.customerMarkupPct?.toString() ?? "0");
            setInvestorPct(data.settings.investorMarkupPct?.toString() ?? "0");
            setReturnPct(data.settings.investorReturnPct?.toString() ?? "0");
          }
        },
      }
    );
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 p-5 transition-colors ${
        isLocked ? "border-slate-200" : "border-amber-400 bg-amber-50/20"
      }`}
      style={{ colorScheme: "light" }}
    >
      {/* Header bar with title and unlock toggle button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            <HiCurrencyRupee className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-sm">Global Pricing</h2>
              {isLocked ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  <FiLock className="w-3 h-3" /> Locked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                  <FiUnlock className="w-3 h-3" /> Editing Enabled
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Default markup applied to vendor product cost price. Override any single product from its edit page.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleLock}
          aria-pressed={!isLocked}
          className={`relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer flex-shrink-0 ${
            isLocked
              ? "bg-slate-800 text-white hover:bg-slate-700 shadow-sm"
              : "bg-amber-500 text-white hover:bg-amber-600 shadow-md"
          }`}
        >
          {isLocked ? <FiLock className="w-3.5 h-3.5" /> : <FiUnlock className="w-3.5 h-3.5" />}
          <span>{isLocked ? "Click to Unlock" : "Lock Inputs"}</span>
        </button>
      </div>

      {/* Inputs grid - layout stays stable without jumping */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
        {/* Customer Markup */}
        <div>
          <label
            htmlFor="globalCustomerPct"
            onClick={() => isLocked && unlockAndFocus(customerInputRef)}
            className="block text-xs font-semibold text-slate-700 mb-1.5 cursor-pointer"
          >
            Customer Markup %
          </label>
          <div
            className="relative cursor-text"
            onClick={() => isLocked && unlockAndFocus(customerInputRef)}
          >
            <input
              ref={customerInputRef}
              id="globalCustomerPct"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={customerPct}
              onChange={(e) => setCustomerPct(e.target.value)}
              placeholder="0"
              disabled={fieldsDisabled}
              style={{ colorScheme: "light" }}
              className="w-full pl-3 pr-8 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
              %
            </span>
          </div>
        </div>

        {/* Investor Markup */}
        <div>
          <label
            htmlFor="globalInvestorPct"
            onClick={() => isLocked && unlockAndFocus(investorInputRef)}
            className="block text-xs font-semibold text-slate-700 mb-1.5 cursor-pointer"
          >
            Investor Markup %
          </label>
          <div
            className="relative cursor-text"
            onClick={() => isLocked && unlockAndFocus(investorInputRef)}
          >
            <input
              ref={investorInputRef}
              id="globalInvestorPct"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={investorPct}
              onChange={(e) => setInvestorPct(e.target.value)}
              placeholder="0"
              disabled={fieldsDisabled}
              style={{ colorScheme: "light" }}
              className="w-full pl-3 pr-8 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
              %
            </span>
          </div>
        </div>

        {/* Investor Return */}
        <div>
          <label
            htmlFor="globalReturnPct"
            onClick={() => isLocked && unlockAndFocus(returnInputRef)}
            className="block text-xs font-semibold text-slate-700 mb-1.5 cursor-pointer"
          >
            Investor Return %
          </label>
          <div
            className="relative cursor-text"
            onClick={() => isLocked && unlockAndFocus(returnInputRef)}
          >
            <input
              ref={returnInputRef}
              id="globalReturnPct"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={returnPct}
              onChange={(e) => setReturnPct(e.target.value)}
              placeholder="0"
              disabled={fieldsDisabled}
              style={{ colorScheme: "light" }}
              className="w-full pl-3 pr-8 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
              %
            </span>
          </div>
        </div>

        {/* Apply button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || isLocked}
          title={isLocked ? "Unlock to edit and apply pricing" : undefined}
          className="h-[42px] px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all active:scale-[0.98] text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Applying...</span>
            </>
          ) : (
            <span>Apply to All Products</span>
          )}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
        <span>
          <strong>Formula:</strong> Customer Price = cost × (1 + Customer%). Investor Price = cost × (1 + Investor%). Investor Payout = Investor Price × (1 + Return%).
        </span>
        {isLocked && (
          <span className="text-amber-700 font-medium">
            💡 Tip: Click &quot;Click to Unlock&quot; or click any input box to start editing.
          </span>
        )}
      </div>
    </div>
  );
}
