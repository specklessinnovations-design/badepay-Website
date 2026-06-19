// FRONTEND-ONLY MODE: Stripe is stubbed — no real payment processing.
export function getStripePublishableKey(): string | undefined {
  return undefined;
}
export function getStripe(): Promise<null> {
  return Promise.resolve(null);
}
