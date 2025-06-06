import { SLOT_CONFIG_NETWORK } from "@blaze-cardano/core";

export const toPreviewBlockSlot = (timestamp: number): number => {
  const zeroTime = SLOT_CONFIG_NETWORK.Preview.zeroTime;
  const slotLength = SLOT_CONFIG_NETWORK.Preview.slotLength;
  return Math.floor((timestamp - zeroTime) / slotLength);
};
