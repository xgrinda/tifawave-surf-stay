import Stripe from "stripe";
import { getStripeEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeEnv().stripeSecretKey);
  }

  return stripeClient;
}
