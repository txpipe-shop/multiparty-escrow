import { Address, AssetId } from "@blaze-cardano/core";
import { U5C } from "@utxorpc/blaze-provider";
import { config } from "../../config.ts";
import { SingularityChannelMint } from "../blueprint.ts";
import { protocol } from "../gen/typescript/protocol.ts";
import { bech32ToPubKeyHash } from "../utils/string.ts";
import { toPreviewBlockSlot } from "../utils/time.ts";

export const openChannel = async (
  provider: U5C,
  sender: string,
  receiver: string,
  signerPubKey: string,
  initialDeposit: number,
  groupId: string,
  expirationDate: number,
) => {
  const utxos = await provider.getUnspentOutputs(Address.fromBech32(sender));
  const finalUtxos = utxos
    .filter((u) => {
      const value = u.toCore()[1].value;
      return (
        value.coins &&
        value.coins >= 20_000_000n &&
        (value.assets?.get(AssetId(config.token)) ?? 0) >= initialDeposit
      );
    })
    .sort((a, b) => {
      const aLex = `${a.toCore()[0].txId}${a.toCore()[0].index}`;
      const bLex = `${b.toCore()[0].txId}${b.toCore()[0].index}`;
      if (aLex < bLex) return -1;
      return 1;
    });
  if (finalUtxos.length === 0)
    throw new Error("No suitable UTXO found for opening a channel");

  const utxo = finalUtxos[0];
  let hex_index = utxo.toCore()[0].index.toString(16);
  if (hex_index.length % 2 !== 0) hex_index = "0" + hex_index;

  const channelId = Buffer.from(utxo.toCore()[0].txId + hex_index, "hex");
  const mintingPolicy = new SingularityChannelMint().Script.hash();

  const { tx } = await protocol.openTx({
    sender: Address.fromBech32(sender).toBytes(),
    receiverinput: Buffer.from(bech32ToPubKeyHash(receiver), "hex"),
    signerpubkey: Buffer.from(signerPubKey, "hex"),
    initialdeposit: initialDeposit,
    channelid: channelId,
    groupid: Buffer.from(groupId),
    date: expirationDate,
    inputref: utxo.toCore()[0].txId + "#" + utxo.toCore()[0].index,
    policyid: Buffer.from(mintingPolicy, "hex"),
    tokenname: Buffer.from(bech32ToPubKeyHash(sender), "hex"),
    since: toPreviewBlockSlot(Date.now() - 1000 * 60 * 5),
    until: toPreviewBlockSlot(Date.now() + 1000 * 60 * 5),
  });

  return { openCbor: tx, channelId: channelId.toString("hex") };
};
