import { Addresses, Data, Lucid } from "@spacebudz/lucid";
import {
  ChannelAction,
  ChannelDatum,
  ChannelDatumSchema,
  ChannelRedeemerSchema,
  ChannelValidator,
} from "../types/types.ts";

export const toChannelDatum = (d: ChannelDatum): string =>
  Data.to(d, ChannelDatumSchema);
export const fromChannelDatum = (d: string): ChannelDatum =>
  Data.from(d, ChannelDatumSchema);

export const toChannelRedeemer = (r: ChannelAction) =>
  Data.to(r, ChannelRedeemerSchema);

export const getChannelUtxo = async (
  lucid: Lucid,
  channelToken: string,
  channelId: string,
) => {
  const validator = new ChannelValidator();
  const scriptAddress = Addresses.scriptToAddress(lucid.network, validator);
  return await lucid
    .utxosAtWithUnit(scriptAddress, channelToken)
    .then((utxos) =>
      utxos.find(({ txHash, outputIndex, datum }) => {
        if (!datum) {
          console.warn(
            `Channel UTxO without datum found: ${txHash}#${outputIndex}`,
          );
          return false;
        }
        try {
          const { channelId: cId } = fromChannelDatum(datum);
          return cId == channelId;
        } catch (e) {
          console.warn(e);
          return false;
        }
      }),
    );
};

export const validatorDetails = (lucid: Lucid) => {
  const validator = new ChannelValidator();

  const scriptAddress = Addresses.scriptToAddress(lucid.network, validator);

  const details = Addresses.inspect(scriptAddress);
  const scriptCredential = details.payment;
  if (!scriptCredential) throw new Error("Script credentials not found");
  const scriptHash = scriptCredential.hash;
  const scriptRewardAddress = Addresses.credentialToRewardAddress(
    lucid.network,
    scriptCredential,
  );

  return { scriptAddress, scriptHash, scriptRewardAddress };
};
