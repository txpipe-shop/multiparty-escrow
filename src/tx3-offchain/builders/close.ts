import { Address, AssetId, HexBlob, PlutusData } from "@blaze-cardano/core";
import { parse } from "@blaze-cardano/data";
import { U5C } from "@utxorpc/blaze-provider";
import { Datum, SingularityChannelMint } from "../blueprint.ts";
import { protocol } from "../gen/typescript/protocol.ts";
import { bech32ToPubKeyHash } from "../utils/string.ts";
import { toPreviewBlockSlot } from "../utils/time.ts";

export const closeChannel = async (
  provider: U5C,
  sender: string,
  channelId: string,
) => {
  const senderPubKeyHash = String(
    Address.fromBech32(sender).asBase()?.getPaymentCredential().hash,
  );
  const scriptHash = new SingularityChannelMint().Script.hash();
  const channelToken = scriptHash + senderPubKeyHash;
  const scriptUtxos = await provider.getUnspentOutputs(
    Address.fromBytes(HexBlob.fromBytes(Buffer.from("70" + scriptHash, "hex"))),
  );

  const [channelUtxo] = scriptUtxos
    .filter((u) => {
      const value = u.toCore()[1].value;
      return value.assets?.get(AssetId(channelToken));
    })
    .filter((u) => {
      try {
        const parsedDatum = parse(
          Datum,
          PlutusData.fromCore(u.toCore()[1].datum!),
        );
        return parsedDatum.channel_id === channelId;
      } catch (e) {
        console.warn(e);
        return false;
      }
    });

  const channelUtxoId =
    channelUtxo.toCore()[0].txId + "#" + channelUtxo.toCore()[0].index;

  const { tx } = await protocol.closeTx({
    channelutxo: channelUtxoId,
    sender: Address.fromBech32(sender).toBytes(),
    policyid: Buffer.from(scriptHash, "hex"),
    tokenname: Buffer.from(bech32ToPubKeyHash(sender), "hex"),
    since: toPreviewBlockSlot(Date.now() - 1000 * 60),
    until: toPreviewBlockSlot(Date.now() + 1000 * 60),
  });

  return { closeCbor: tx };
};
