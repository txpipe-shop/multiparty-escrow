import { NetworkId } from "@blaze-cardano/core";
import { U5C } from "@utxorpc/blaze-provider";
import { config } from "../../config.ts";
import { closeChannel } from "../builders/close.ts";

const provider = new U5C({
  url: "http://localhost:50051",
  network: NetworkId.Testnet,
});
const sender = config.sender;
const channelId =
  "bb79350d37bb54c94e1e397c310a61373bf6bfb3ec90dd650c51f561ffdc0b1a01";

const { closeCbor } = await closeChannel(provider, sender, channelId);

console.log("close channel cbor:", closeCbor);
