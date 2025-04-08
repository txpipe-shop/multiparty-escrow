import { Addresses, Crypto, Emulator, Lucid } from "@spacebudz/lucid";
import { generateMnemonic } from "bip39";
import { config } from "../../config.ts";
import { openChannel } from "../builders/open-channel.ts";
import { getAllChannels } from "../queries/all-channels.ts";
import { getChannelById } from "../queries/channel-by-id.ts";
import { getChannelsFromReceiver } from "../queries/channels-from-receiver.ts";
import { getChannelsFromSender } from "../queries/channels-from-sender.ts";
import {
  getScriptRef,
  printChannels,
  printUtxos,
  signAndSubmit,
} from "./utils.ts";

const {
  privateKey: senderPrivKey,
  publicKey: senderPubKey,
  credential: senderCredential,
} = Crypto.seedToDetails(generateMnemonic(256), 0, "Payment");
const senderAddress = Addresses.credentialToAddress(
  { Emulator: 0 },
  senderCredential,
);

const { privateKey: receiverPrivKey } = Crypto.seedToDetails(
  generateMnemonic(256),
  0,
  "Payment",
);
const receiverAddress = Addresses.credentialToAddress(
  { Emulator: 0 },
  Crypto.privateKeyToDetails(receiverPrivKey).credential,
);

const emulator = new Emulator([
  {
    address: senderAddress,
    assets: { lovelace: 10_000_000n, [config.token]: 12n },
  },
]);
const lucid = new Lucid({ provider: emulator });
await printUtxos(lucid, senderAddress);

printChannels("GET ALL CHANNELS BEFORE TX", await getAllChannels(lucid));

const scriptRef = await getScriptRef(lucid, senderPrivKey);

const { openChannelCbor, channelId } = await openChannel(
  lucid,
  {
    senderAddress,
    signerPubKey: senderPubKey,
    receiverAddress: receiverAddress,
    initialDeposit: 6n,
    expirationDate: 2n,
    groupId: 10n,
  },
  scriptRef,
);
const openTx = await signAndSubmit(lucid, senderPrivKey, openChannelCbor);

console.log(`\n
    > Channel opened with ID: ${channelId}
    > Initial Deposit: 6
    > Tx ID: ${openTx}
    > CBOR: ${openChannelCbor}\n\n`);

printChannels(
  "GET SENDERS CHANNELS AFTER TX",
  await getChannelsFromSender(lucid, senderAddress),
);
printChannels("GET CHANNEL BY ID", await getChannelById(lucid, channelId));
printChannels(
  "GET CHANNELS FROM RECEIVER",
  await getChannelsFromReceiver(lucid, receiverAddress),
);
