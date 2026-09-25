import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/utils/api";
import { INVESTMENT_QUERY_KEYS } from "../keys";

interface RazorpayCheckoutResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface InvestCartLine {
  productId: string;
  quantity: number;
}

interface InvestArgs {
  items: InvestCartLine[];
  totalAmount: number;
}

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useInvestMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ items, totalAmount }: InvestArgs) => {
      // Step 1: create a single Razorpay order for the whole batch total.
      const orderResponse = await fetch(`${getApiUrl()}/payment/razorpay/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        credentials: "include",
        body: JSON.stringify({
          amount: totalAmount,
          currency: "INR",
          receipt: `invest_${Date.now()}`,
          notes: { purpose: "investment", items: JSON.stringify(items) },
        }),
      });
      const orderData = await orderResponse.json();
      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.message || "Failed to create payment order");
      }

      // Step 2: open Razorpay checkout and wait for the user to pay.
      // Razorpay's SDK can call `handler` more than once for the same
      // payment in some flows (and `ondismiss` can fire right after a
      // successful `handler` call too) — a `settled` guard makes sure we
      // only ever act on the first one, so we never submit the same
      // payment to the backend twice.
      const paymentResult = await new Promise<RazorpayCheckoutResponse>((resolve, reject) => {
        let settled = false;
        const razorpay = new (window as any).Razorpay({
          key: orderData.key_id,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: "Investment",
          description: `Invest in ${items.length} product${items.length > 1 ? "s" : ""}`,
          order_id: orderData.order.id,
          theme: { color: "#10b981" },
          handler: (response: RazorpayCheckoutResponse) => {
            if (settled) return;
            settled = true;
            resolve(response);
          },
          modal: {
            ondismiss: () => {
              if (settled) return;
              settled = true;
              reject(new Error("Payment cancelled"));
            },
          },
        });
        razorpay.open();
      });

      // Step 3: hand the payment proof to the backend, which re-verifies the
      // signature and total amount before creating one Investment per unit.
      const investResponse = await fetch(`${getApiUrl()}/investor/invest`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        credentials: "include",
        body: JSON.stringify({
          items,
          razorpay_order_id: paymentResult.razorpay_order_id,
          razorpay_payment_id: paymentResult.razorpay_payment_id,
          razorpay_signature: paymentResult.razorpay_signature,
        }),
      });
      const investData = await investResponse.json();
      if (!investResponse.ok || !investData.success) {
        throw new Error(investData.message || "Failed to place investment");
      }

      return investData.investments;
    },
    onSuccess: (investments) => {
      toast.success(`Payment successful! ${investments.length} investment${investments.length > 1 ? "s" : ""} placed.`);
      queryClient.invalidateQueries({ queryKey: INVESTMENT_QUERY_KEYS.mine() });
      queryClient.invalidateQueries({ queryKey: INVESTMENT_QUERY_KEYS.earnings() });
      queryClient.invalidateQueries({ queryKey: INVESTMENT_QUERY_KEYS.investableProducts() });
    },
    onError: (error: Error) => {
      // This specific message means the backend's replay guard caught a
      // second submission of a payment that already succeeded once — the
      // investment is real, just don't say "failed" and scare the user.
      if (error.message?.toLowerCase().includes("already been used")) {
        toast.success("Payment already recorded — your investment went through.");
        queryClient.invalidateQueries({ queryKey: INVESTMENT_QUERY_KEYS.mine() });
        queryClient.invalidateQueries({ queryKey: INVESTMENT_QUERY_KEYS.earnings() });
        queryClient.invalidateQueries({ queryKey: INVESTMENT_QUERY_KEYS.investableProducts() });
        return;
      }
      toast.error(error.message || "Failed to place investment");
    },
  });

  return {
    invest: mutation.mutate,
    investAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
