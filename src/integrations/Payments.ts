/**
 * Mock payment gateway. Formalizes the inline "MOCK PAYMENT GATEWAY" seam in
 * DirectBookingModal. Same shape a Stripe call would have — on migration this
 * becomes a real Checkout/PaymentIntent behind the identical signature.
 */
export interface CheckoutInput {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CheckoutResult {
  id: string;
  status: 'completed' | 'failed';
  amount: number;
  currency: string;
  method: string;
  created_at: string;
}

export async function createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  // Simulate gateway latency.
  await new Promise((r) => setTimeout(r, 600));
  // eslint-disable-next-line no-console
  console.info('[mock Payments.createCheckout]', input);
  return {
    id: 'ch_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    status: 'completed',
    amount: input.amount,
    currency: input.currency || 'USD',
    method: 'mock_card',
    created_at: new Date().toISOString(),
  };
}

export default { createCheckout };
