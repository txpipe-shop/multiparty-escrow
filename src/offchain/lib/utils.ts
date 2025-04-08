import { Addresses, Data, Lucid } from "@spacebudz/lucid";
import {
  ChannelAction,
  ChannelDatum,
  ChannelDatumSchema,
  ChannelRedeemerSchema,
  ChannelValidator,
} from "../types/types.ts";

export const toChannelDatum = (d: ChannelDatum) =>
  Data.to(d, ChannelDatumSchema);
export const fromChannelDatum = (d: string) => Data.from(d, ChannelDatumSchema);

export const toChannelRedeemer = (r: ChannelAction) =>
  Data.to(r, ChannelRedeemerSchema);

export const validatorDetails = (lucid: Lucid) => {
  const validator = new ChannelValidator();

  const scriptAddress = Addresses.scriptToAddress(lucid.network, validator);

  const scriptAddressDetails = Addresses.inspect(scriptAddress).payment;
  if (!scriptAddressDetails) throw new Error("Script credentials not found");
  const scriptHash = scriptAddressDetails.hash;

  return { scriptAddress, scriptHash };
};
