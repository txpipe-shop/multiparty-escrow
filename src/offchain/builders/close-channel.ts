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
  toChannelRedeemer,
  validatorDetails,
} from "../lib/utils.ts";
import { TypesDatum } from "../types/plutus.ts";

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
  const { scriptAddress, scriptHash: mintingPolicyId } =
    validatorDetails(lucid);

  const senderPubKeyHash = Addresses.addressToCredential(senderAddress).hash;

  const channelToken = toUnit(mintingPolicyId, senderPubKeyHash);
  const channelUtxo = (
    await lucid.utxosAtWithUnit(scriptAddress, channelToken)
  ).find(({ txHash, outputIndex, datum }) => {
    if (!datum) {
      console.warn(
        `Channel UTxO without datum found: ${txHash}#${outputIndex}`,
      );
      return false;
    }
    try {
      return fromChannelDatum(datum).channelId == channelId;
    } catch (e) {
      console.warn(e);
      return false;
    }
  });
  if (!channelUtxo) throw new Error("Channel not found");

  const datumStr = channelUtxo.datum!;
  const datum: TypesDatum = fromChannelDatum(datumStr);

  const hasExpired = currentTime > datum.expirationDate;
  if (!hasExpired) throw new Error("Channel has not expired yet");

  const payout = addAssets(channelUtxo.assets, { [channelToken]: -1n });
  const tx = await lucid
    .newTx()
    .readFrom([scriptRef])
    .collectFrom([channelUtxo], toChannelRedeemer("Close"))
    .mint({ [channelToken]: -1n }, Data.void())
    .payTo(senderAddress, payout)
    .validFrom(Number(datum.expirationDate))
    .attachMetadata(674, { msg: ["Close Channel"] })
    .addSigner(senderPubKeyHash)
    .commit();

  return { closedChannelCbor: tx.toString() };
};
