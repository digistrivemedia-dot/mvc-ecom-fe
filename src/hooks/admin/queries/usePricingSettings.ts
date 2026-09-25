import { useQuery } from "@tanstack/react-query";
import { ADMIN_QUERY_KEYS } from "../keys";
import { getApiUrl } from "@/lib/utils/api";

export type PricingSettings = {
  customerMarkupPct: number;
  investorMarkupPct: number;
  investorReturnPct: number;
};

const DEFAULT_SETTINGS: PricingSettings = { customerMarkupPct: 0, investorMarkupPct: 0, investorReturnPct: 0 };

export const usePricingSettings = () => {
  const query = useQuery({
    queryKey: ADMIN_QUERY_KEYS.pricingSettings(),
    queryFn: async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const response = await fetch(`${getApiUrl()}/admin/pricing-settings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load pricing settings");
      }

      return data.settings as PricingSettings;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    staleTime: 60 * 1000,
  });

  return {
    ...query,
    settings: query.data ?? DEFAULT_SETTINGS,
  };
};
