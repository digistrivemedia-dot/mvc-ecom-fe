import { useQuery } from "@tanstack/react-query";
import { INVESTMENT_QUERY_KEYS } from "../keys";
import { getApiUrl } from "@/lib/utils/api";

type EarningsResponse = {
  success: boolean;
  totals: { totalInvested: number; totalPaidOut: number };
  transactions: { _id: string; total: number }[];
};

export const useInvestorEarnings = () => {
  const query = useQuery({
    queryKey: INVESTMENT_QUERY_KEYS.earnings(),
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${getApiUrl()}/investor/earnings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });

      const data: EarningsResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error((data as any).message || "Failed to load earnings");
      }

      return data;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 60 * 1000,
  });

  return {
    ...query,
    totals: query.data?.totals ?? { totalInvested: 0, totalPaidOut: 0 },
  };
};
