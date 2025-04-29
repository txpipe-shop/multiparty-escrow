import { Emulator, Lucid } from "@spacebudz/lucid";
import { config } from "../../config.ts";
import { testOpenOperation, testUpdateOperation } from "./operations.ts";
import { getRandomUser, getScriptRef, printUtxos } from "./utils.ts";

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
const scriptRef = await getScriptRef(lucid, senderPrivKey);

const { channelId } = await testOpenOperation(
  {
    lucid,
    scriptRef,
    senderAddress,
    receiverAddress,
    signerPubKey: senderPubKey,
    groupId: "group1",
    expirationDate: BigInt(Date.now() + 2 * 24 * 60 * 60 * 1000),
    initialDeposit: 6n,
  },
  senderPrivKey,
);

await testUpdateOperation(
  {
    lucid,
    scriptRef,
    userAddress: senderAddress,
    senderAddress,
    channelId,
    addDeposit: 3n,
    expirationDate: BigInt(Date.now() + 5 * 24 * 60 * 60 * 1000),
    currentTime: BigInt(Date.now() + 4 * 60 * 60 * 1000),
  },
  senderPrivKey,
);
