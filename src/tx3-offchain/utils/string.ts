import { Address } from "@blaze-cardano/core";

export const bech32ToPubKeyHash = (bech32: string): string => {
  return String(
    Address.fromBech32(bech32).asBase()?.getPaymentCredential().hash,
  );
};
