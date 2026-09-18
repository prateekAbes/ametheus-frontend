import { apiClient } from "./client";

export interface CreateOrderResponse {
  status: string;
  order_id: string | null;
  amount_paise?: number;
  amount_inr?: number;
  currency?: string;
  key_id?: string;
  tournament_title?: string;
  team_name?: string;
  message?: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  status: string;
  message: string;
  order_id: string;
  payment_id: string;
}

export async function createEscrowOrder(
  tournamentId: string,
  teamId?: string
): Promise<CreateOrderResponse> {
  return apiClient<CreateOrderResponse>("/payments/create-order", {
    method: "POST",
    body: JSON.stringify(teamId ? { tournament_id: tournamentId, team_id: teamId } : { tournament_id: tournamentId }),
  });
}

export async function verifyEscrowPayment(
  data: VerifyPaymentRequest
): Promise<VerifyPaymentResponse> {
  return apiClient<VerifyPaymentResponse>("/payments/verify", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getOrderStatus(orderId: string): Promise<{
  order_id: string;
  payment_status: string;
  tournament_id: string;
  team_id: string;
}> {
  return apiClient(`/payments/order/${orderId}`);
}
