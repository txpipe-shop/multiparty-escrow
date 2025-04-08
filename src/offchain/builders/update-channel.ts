import { Addresses, Lucid, toUnit, Utxo } from "@spacebudz/lucid";
import { config } from "../../config.ts";
import {
  fromChannelDatum,
  toChannelDatum,
  toChannelRedeemer,
  validatorDetails,
} from "../lib/utils.ts";
import { ChannelDatum } from "../types/types.ts";
import { UpdateChannelParams } from "./../../shared/api-types.ts";

export const updateChannel = async (
  lucid: Lucid,
  {
    channelId,
    addDeposit,
    expirationDate,
    userAddress,
    senderAddress,
  }: UpdateChannelParams,
  scriptRef: Utxo,
  currentTime: bigint,
) => {
  const { scriptAddress, scriptHash } = validatorDetails(lucid);

  const senderPubKeyHash = Addresses.addressToCredential(senderAddress).hash;

  const userPubKeyHash = Addresses.addressToCredential(userAddress).hash;

  const channelToken = toUnit(scriptHash, senderPubKeyHash);
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
      const { channelId: cId } = fromChannelDatum(datum);
      return cId == channelId;
    } catch (e) {
      console.warn(e);
      return false;
    }
  });
  if (!channelUtxo) throw new Error("Channel not found");

  const datumStr = channelUtxo.datum!;
  const datum: ChannelDatum = fromChannelDatum(datumStr);

  if (datum.expirationDate < currentTime) throw new Error("Channel expired");
  if (expirationDate && expirationDate < datum.expirationDate)
    throw new Error("New expiration date must be greater than current");

  const newDeposit = channelUtxo.assets[config.token] + (addDeposit ?? 0n);
  const newExpirationDate = expirationDate ?? datum.expirationDate;

  const newDatum: ChannelDatum = {
    ...datum,
    expirationDate: newExpirationDate,
  };

  const updateExpiration = newExpirationDate != datum.expirationDate;
  const updateBalance = !!addDeposit;
  const msg =
    updateExpiration && updateBalance
      ? "Update Channel Expiration and Balance"
      : updateExpiration
        ? "Update Channel Expiration"
        : "Update Channel Balance";

  const tx = lucid
    .newTx()
    .readFrom([scriptRef])
    .collectFrom([channelUtxo], toChannelRedeemer("Update"))
    .payToContract(
      scriptAddress,
      { Inline: toChannelDatum(newDatum) },
      { [config.token]: newDeposit, [channelToken]: 1n },
    )
    .validTo(Number(datum.expirationDate))
    .attachMetadata(674, { msg: [msg] });

  if (updateExpiration) tx.addSigner(senderPubKeyHash);
  else tx.addSigner(userPubKeyHash);

  const completeTx = await tx.commit();
  return { updatedChannelCbor: completeTx.toString() };
};
