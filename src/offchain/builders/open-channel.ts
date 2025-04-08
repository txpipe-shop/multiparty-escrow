import {
  Addresses,
  Data,
  fromText,
  Lucid,
  toUnit,
  Utxo,
} from "@spacebudz/lucid";
import { config } from "../../config.ts";
import { OpenChannelParams } from "../../shared/api-types.ts";
import { toChannelDatum, validatorDetails } from "../lib/utils.ts";
import { ChannelDatum } from "../types/types.ts";

export const openChannel = async (
  lucid: Lucid,
  {
    senderAddress,
    receiverAddress,
    signerPubKey,
    groupId,
    expirationDate,
    initialDeposit,
  }: OpenChannelParams,
  scriptRef: Utxo,
) => {
  lucid.selectReadOnlyWallet({ address: senderAddress });
  const utxos = await lucid.wallet.getUtxos();
  const utxo = utxos[0];
  const channelId: string = utxo.txHash + fromText(String(utxo.outputIndex));

  const receiverPubKeyHash =
    Addresses.addressToCredential(receiverAddress).hash;

  const datum: ChannelDatum = {
    channelId,
    nonce: 0n,
    signer: signerPubKey,
    receiver: receiverPubKeyHash,
    groupId,
    expirationDate,
  };
  const { scriptAddress, scriptHash: mintingPolicyId } =
    validatorDetails(lucid);

  const senderPubKeyHash = Addresses.addressToCredential(senderAddress).hash;

  const channelToken = toUnit(mintingPolicyId, senderPubKeyHash);
  const tx = await lucid
    .newTx()
    .readFrom([scriptRef])
    .collectFrom([utxo])
    .addSigner(senderPubKeyHash)
    .mint({ [channelToken]: 1n }, Data.void())
    .payToContract(
      scriptAddress,
      { Inline: toChannelDatum(datum) },
      { [config.token]: initialDeposit, [channelToken]: 1n },
    )
    .validTo(Number(expirationDate))
    .attachMetadata(674, { msg: ["Open Channel"] })
    .commit();

  return { openChannelCbor: tx.toString(), channelId };
};
