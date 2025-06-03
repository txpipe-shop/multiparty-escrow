import { config } from "../../config.ts";
import { openChannel } from "../builders/open.ts";

const sender = config.sender;
const receiver = config.receiver;
const signerPubKey = config.signer_pub_key;
const initialDeposit = 1;
const groupId = "group1";
const expirationDate = Date.now() + 1000 * 60 * 60; // 1 hour from now

const { openCbor, channelId } = await openChannel(
  sender,
  receiver,
  signerPubKey,
  initialDeposit,
  groupId,
  expirationDate,
);

console.log("Open channel cbor:", openCbor, "\nWith channelId:", channelId);
