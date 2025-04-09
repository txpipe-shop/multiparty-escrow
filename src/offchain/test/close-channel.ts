import { Emulator, Lucid } from "@spacebudz/lucid";
import { config } from "../../config.ts";
import { testCloseChannel, testOpenOperation } from "./operations.ts";
import { getRandomUser, printUtxos } from "./utils.ts";

const {
  privateKey: senderPrivKey,
  publicKey: senderPubKey,
  address: senderAddress,
} = getRandomUser();

const { address: receiverAddress } = getRandomUser();

const emulator = new Emulator([
  {
    address: senderAddress,
    assets: { lovelace: 30_000_000n, [config.token]: 12n },
  },
]);
const lucid = new Lucid({ provider: emulator });
await printUtxos(lucid, senderAddress);

const channelId = await testOpenOperation(
  {
    lucid,
    senderAddress,
    receiverAddress,
    signerPubKey: senderPubKey,
    groupId: 10n,
    expirationDate: BigInt(Date.now() + 30 * 1000),
    initialDeposit: 6n,
  },
  senderPrivKey,
);

await testCloseChannel(
  {
    lucid,
    senderAddress,
    channelId,
    currentTime: BigInt(Date.now() + 31 * 1000),
  },
  senderPrivKey,
);
