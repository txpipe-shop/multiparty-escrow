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
import { selectUTxOs, toChannelDatum, validatorDetails } from "../lib/utils.ts";
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
  currentTime: bigint
) => {
  if (expirationDate < currentTime)
    throw new Error("Expiration date is in the past");
  lucid.selectReadOnlyWallet({ address: senderAddress });
  const selectedUtxos = await lucid.wallet.getUtxos().then((utxos) =>
    selectUTxOs(utxos, {
      lovelace: 20_000_000n,
      [config.token]: initialDeposit,
    })
  );
  if (selectedUtxos.length === 0)
    throw new Error("Not enough funds to open channel");

  const utxos = selectedUtxos.sort((a, b) => {
    const aLex = `${a.txHash}${a.outputIndex}`;
    const bLex = `${b.txHash}${b.outputIndex}`;
    if (aLex < bLex) return -1;
    return 1;
  });
  const utxo = utxos[0];
  const channelId: string = Buffer.from(
    utxo.txHash + Data.to<bigint>(BigInt(utxo.outputIndex)),
    "hex"
  ).toString("hex");
  const receiverPubKeyHash =
    Addresses.addressToCredential(receiverAddress).hash;

  const datum: ChannelDatum = {
    channelId,
    nonce: 0n,
    signer: signerPubKey,
    receiver: receiverPubKeyHash,
    groupId: fromText(groupId),
    expirationDate,
  };
  const { scriptAddress, scriptHash: mintingPolicyId } =
    validatorDetails(lucid);

  const senderPubKeyHash = Addresses.addressToCredential(senderAddress).hash;

  const channelToken = toUnit(mintingPolicyId, senderPubKeyHash);
  const tx = await lucid
    .newTx()
    .readFrom([scriptRef])
    .collectFrom(utxos)
    .addSigner(senderPubKeyHash)
    .mint({ [channelToken]: 1n }, Data.void())
    .payToContract(
      scriptAddress,
      { Inline: toChannelDatum(datum) },
      { [config.token]: initialDeposit, [channelToken]: 1n }
    )
    .validTo(Number(expirationDate))
    .attachMetadata(674, { msg: ["Open Channel"] })
    .commit();

  return { openChannelCbor: tx.toString(), channelId };
};
