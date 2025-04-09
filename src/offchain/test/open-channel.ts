import { Emulator, Lucid } from "@spacebudz/lucid";
import { config } from "../../config.ts";
import { getAllChannels } from "../queries/all-channels.ts";
import { getChannelById } from "../queries/channel-by-id.ts";
import { getChannelsFromReceiver } from "../queries/channels-from-receiver.ts";
import { getChannelsFromSender } from "../queries/channels-from-sender.ts";
import { testOpenOperation } from "./operations.ts";
import { getRandomUser, printChannels, printUtxos } from "./utils.ts";

const {
  privateKey: senderPrivKey,
  publicKey: senderPubKey,
  address: senderAddress,
} = getRandomUser();

const { address: receiverAddress } = getRandomUser();

const emulator = new Emulator([
  {
    address: senderAddress,
    assets: { lovelace: 10_000_000n, [config.token]: 12n },
  },
]);

const lucid = new Lucid({ provider: emulator });
await printUtxos(lucid, senderAddress);

printChannels("GET ALL CHANNELS BEFORE TX", await getAllChannels(lucid));

const channelId = await testOpenOperation(
  {
    lucid,
    senderAddress,
    receiverAddress,
    signerPubKey: senderPubKey,
    groupId: 10n,
    expirationDate: BigInt(Date.now() + 50 * 1000),
    initialDeposit: 6n,
  },
  senderPrivKey,
);

printChannels(
  "GET SENDERS CHANNELS AFTER TX",
  await getChannelsFromSender(lucid, senderAddress),
);
printChannels("GET CHANNEL BY ID", await getChannelById(lucid, channelId));
printChannels(
  "GET CHANNELS FROM RECEIVER",
  await getChannelsFromReceiver(lucid, receiverAddress),
);
