import {
  Address,
  AssetId,
  NetworkId,
  SLOT_CONFIG_NETWORK,
} from "@blaze-cardano/core";
import { U5C } from "@utxorpc/blaze-provider";
import { config } from "../../config.ts";
import { protocol } from "../gen/typescript/protocol.ts";

const provider = new U5C({
  url: "http://localhost:50051",
  network: NetworkId.Testnet,
});

export const openChannel = async (
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
  const utxo = finalUtxos[0];

  let hex_index = utxo.toCore()[0].index.toString(16);
  if (hex_index.length % 2 !== 0) hex_index = "0" + hex_index;

  const channelId = Buffer.from(utxo.toCore()[0].txId + hex_index, "hex");

  const { tx } = await protocol.openTx({
    sender: Address.fromBech32(sender).toBytes(),
    receiverinput: Buffer.from(
      String(
        Address.fromBech32(receiver).asBase()?.getPaymentCredential().hash,
      ),
      "hex",
    ),
    signerpubkey: Buffer.from(signerPubKey, "hex"),
    initialdeposit: initialDeposit,
    channelid: channelId,
    groupid: Buffer.from(groupId),
    date: expirationDate,
    inputref: utxo.toCore()[0].txId + "#" + utxo.toCore()[0].index,
    policyid: Buffer.from(
      "7da6163888081e317f8567176057f0e9634932f85bc630657b1f8133",
      "hex",
    ),
    tokenname: Buffer.from(
      String(Address.fromBech32(sender).asBase()?.getPaymentCredential().hash),
      "hex",
    ),
    since: Math.floor(
      (Date.now() - 1000 * 60 - SLOT_CONFIG_NETWORK.Preview.zeroTime) /
        SLOT_CONFIG_NETWORK.Preview.slotLength,
    ),
    until: Math.floor(
      (Date.now() + 1000 * 60 - SLOT_CONFIG_NETWORK.Preview.zeroTime) /
        SLOT_CONFIG_NETWORK.Preview.slotLength,
    ),
  });

  return { openCbor: tx, channelId: channelId.toString("hex") };
};
