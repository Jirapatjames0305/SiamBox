// Payment-gateway registry.
//
// One provider is active at a time, chosen with PAYMENT_PROVIDER (ksher | opn | 2c2p).
// Existing Payment rows keep the provider they were created with in Payment.gatewayProvider,
// so switching providers never breaks status sync or refunds for orders already in flight.

import { ksher } from "./ksher.js";
import { opn } from "./opn.js";
import { twoctwop } from "./twoctwop.js";
import { gatewayError, type PaymentProvider, type ProviderId } from "./types.js";

export * from "./types.js";
export { ksher } from "./ksher.js";
export { opn } from "./opn.js";
export { twoctwop } from "./twoctwop.js";

const PROVIDERS: Record<ProviderId, PaymentProvider> = {
  ksher,
  opn,
  "2c2p": twoctwop,
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

/** Display names for the checkout and admin UIs. */
export const PROVIDER_LABELS: Record<ProviderId, string> = {
  ksher: ksher.label,
  opn: opn.label,
  "2c2p": twoctwop.label,
};

/** Providers whose credentials are present — i.e. that could actually take a payment. */
export function configuredProviderIds(): ProviderId[] {
  return PROVIDER_IDS.filter((id) => PROVIDERS[id].isEnabled());
}

export function isProviderId(value: string): value is ProviderId {
  return value in PROVIDERS;
}

/** Provider a stored Payment was created with — null for pre-migration rows. */
export function getProvider(id: string | null | undefined): PaymentProvider | null {
  if (!id || !isProviderId(id)) return null;
  return PROVIDERS[id];
}

/**
 * The provider new checkouts go through. Null when PAYMENT_PROVIDER is unset or its
 * credentials are missing — callers turn that into a 503 rather than a crash.
 */
export function activeProvider(): PaymentProvider | null {
  const id = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (!id) return null;
  if (!isProviderId(id)) return null;
  const provider = PROVIDERS[id];
  return provider.isEnabled() ? provider : null;
}

export function requireActiveProvider(): PaymentProvider {
  const provider = activeProvider();
  if (!provider) throw gatewayError("PaymentGatewayDisabled", 503);
  return provider;
}

export function isGatewayEnabled(): boolean {
  return activeProvider() !== null;
}
