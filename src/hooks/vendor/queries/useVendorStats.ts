import { useQuery } from "@tanstack/react-query";
import { VENDOR_QUERY_KEYS } from "../keys";
import { getApiUrl } from "@/lib/utils/api";

type VendorStats = {
  productCount: number;
  liveCount: number;
  pendingApprovalCount: number;
  unitsSold: number;
  lifetimeIncome: number;
};

export const useVendorStats = () => {
  const query = useQuery({
    queryKey: VENDOR_QUERY_KEYS.stats(),
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${getApiUrl()}/vendor/stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load stats");
      }

      return data.stats as VendorStats;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 60 * 1000,
  });

  return {
    ...query,
    stats: query.data ?? {
      productCount: 0,
      liveCount: 0,
      pendingApprovalCount: 0,
      unitsSold: 0,
      lifetimeIncome: 0,
    },
  };
};
