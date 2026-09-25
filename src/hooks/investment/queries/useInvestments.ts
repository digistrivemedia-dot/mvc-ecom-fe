import { useQuery } from "@tanstack/react-query";
import { INVESTMENT_QUERY_KEYS } from "../keys";
import { getApiUrl } from "@/lib/utils/api";

type Investment = {
  _id: string;
  product: { _id: string; name: string; images?: { url: string }[]; price?: number } | string;
  amountInvested: number;
  expectedPayout: number;
  status: "unmatched" | "matched";
  matchedOrder?: { _id: string; orderStatus: string; createdAt: string } | string | null;
  matchedAt?: string | null;
  createdAt: string;
};

export const useInvestments = () => {
  const query = useQuery({
    queryKey: INVESTMENT_QUERY_KEYS.mine(),
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${getApiUrl()}/investor/investments/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load investments");
      }

      return data.investments as Investment[];
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 60 * 1000,
  });

  return {
    ...query,
    investments: query.data ?? [],
  };
};
