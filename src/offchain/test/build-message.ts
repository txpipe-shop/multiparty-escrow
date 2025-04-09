import { Emulator, Lucid } from "@spacebudz/lucid";
import { config } from "../../config.ts";
import { buildMessage } from "../builders/build-message.ts";
import { testOpenOperation } from "./operations.ts";
import { getRandomUser } from "./utils.ts";

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
lucid.selectReadOnlyWallet({ address: senderAddress });
const channelId = await testOpenOperation(
  {
    lucid,
    senderAddress,
    receiverAddress,
    signerPubKey: senderPubKey,
    groupId: 10n,
    expirationDate: BigInt(Date.now() + 2 * 24 * 60 * 60 * 1000),
    initialDeposit: 6n,
  },
  senderPrivKey,
  false,
);

const { payload } = await buildMessage(lucid, {
  channelId,
  amount: 3n,
  senderAddress,
});

lucid.selectWalletFromPrivateKey(senderPrivKey);
const message = await lucid.wallet.signMessage(senderAddress, payload);

console.log("\n\nSigned Message:");
console.log(message);

const verification = lucid.verifyMessage(senderAddress, payload, message);
console.log("\nVerification: ", verification);
