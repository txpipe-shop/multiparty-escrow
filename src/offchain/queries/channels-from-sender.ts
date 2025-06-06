import { Addresses, Lucid } from "@spacebudz/lucid";
import { fromChannelDatum, validatorDetails } from "../lib/utils.ts";
import { ChannelInfo } from "../types/types.ts";

export const getChannelsFromSender = async (
  lucid: Lucid,
  senderAddr: string,
): Promise<ChannelInfo[]> => {
  const { scriptAddress, scriptHash: policyId } = validatorDetails(lucid);
  const senderKey = Addresses.inspect(senderAddr).payment;
  if (!senderKey) {
    throw new Error(
      `Invalid sender address: ${senderAddr}. Must have a payment key`,
    );
  }
  const sender = senderKey.hash;
  const channelToken = `${policyId}${sender}`;

  return await lucid
    .utxosAtWithUnit(scriptAddress, channelToken)
    .then((utxos) =>
      utxos
        .map((utxo) => {
          const { assets: balance, txHash, outputIndex, datum } = utxo;
          if (!datum) {
            console.warn(
              `Channel UTxO without datum found: ${txHash}#${outputIndex}`,
            );
            return null;
          }
          try {
            const {
              channelId,
              nonce,
              signer,
              receiver,
              groupId,
              expirationDate,
            } = fromChannelDatum(datum);
            return {
              txHash,
              outputIndex,
              balance,
              channelId,
              nonce,
              signer,
              sender,
              receiver,
              groupId,
              expirationDate,
              active: Date.now() < expirationDate,
            };
          } catch (_) {
            console.warn(
              `Invalid datum found in channel UTxO: ${txHash}#${outputIndex}`,
            );
            return null;
          }
        })
        .filter((channel) => channel !== null),
    );
};
