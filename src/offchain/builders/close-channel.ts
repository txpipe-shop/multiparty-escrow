import {
  addAssets,
  Addresses,
  Data,
  Lucid,
  toUnit,
  Utxo,
} from "@spacebudz/lucid";
import { CloseChannelParams } from "../../shared/api-types.ts";
import {
  fromChannelDatum,
  getChannelUtxo,
  toChannelRedeemer,
  validatorDetails,
} from "../lib/utils.ts";
import { ChannelDatum } from "../types/types.ts";

/**
 * This operation is used from the sender when channel has expired,
 * to close and claim remaining funds on the channel
 */
export const closeChannel = async (
  lucid: Lucid,
  { senderAddress, channelId }: CloseChannelParams,
  scriptRef: Utxo,
  currentTime: bigint,
) => {
  const { scriptHash: mintingPolicyId } = validatorDetails(lucid);

  const senderPubKeyHash = Addresses.addressToCredential(senderAddress).hash;

  const channelToken = toUnit(mintingPolicyId, senderPubKeyHash);
  const channelUtxo = await getChannelUtxo(lucid, channelToken, channelId);
  if (!channelUtxo) throw new Error("Channel not found");

  const datumStr = channelUtxo.datum!;
  const datum: ChannelDatum = fromChannelDatum(datumStr);

  const hasExpired = currentTime > datum.expirationDate;
  if (!hasExpired) throw new Error("Channel has not expired yet");

  const payout = addAssets(channelUtxo.assets, { [channelToken]: -1n });
  const tx = await lucid
    .newTx()
    .readFrom([scriptRef])
    .collectFrom([channelUtxo], toChannelRedeemer("Close"))
    .mint({ [channelToken]: -1n }, Data.void())
    .payTo(senderAddress, payout)
    // Validity range must be entirely after expiration date
    .validFrom(Number(datum.expirationDate + 1000n))
    .attachMetadata(674, { msg: ["Close Channel"] })
    .addSigner(senderPubKeyHash)
    .commit();

  return { closedChannelCbor: tx.toString() };
};
