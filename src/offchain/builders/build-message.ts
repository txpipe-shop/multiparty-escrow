import { Addresses, Data, Lucid, toUnit } from "@spacebudz/lucid";
import { fromChannelDatum, validatorDetails } from "../lib/utils.ts";
import { TypesDatum } from "../types/plutus.ts";
import { BuildMessageParams } from "./../../shared/api-types.ts";

export const SignatureSchema = Data.Tuple([
  Data.Integer(),
  Data.Bytes(),
  Data.Integer(),
]);

export const buildMessage = async (
  lucid: Lucid,
  { channelId, amount, senderAddress }: BuildMessageParams,
) => {
  const { scriptAddress, scriptHash } = validatorDetails(lucid);
  const senderPubKeyHash = Addresses.addressToCredential(senderAddress).hash;

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
      return fromChannelDatum(datum).channelId == channelId;
    } catch (e) {
      console.warn(e);
      return false;
    }
  });
  if (!channelUtxo) throw new Error("Channel not found");

  const datumStr = channelUtxo.datum!;
  const datum: TypesDatum = fromChannelDatum(datumStr);

  const msg: [bigint, string, bigint] = [datum.nonce, datum.channelId, amount];
  const payload = Data.to(msg, SignatureSchema);

  return { payload: payload };
};
