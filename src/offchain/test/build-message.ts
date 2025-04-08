import { Addresses, Crypto, Emulator, Lucid } from "@spacebudz/lucid";
import { generateMnemonic } from "bip39";
import { config } from "../../config.ts";
import { buildMessage } from "../builders/build-message.ts";
import { openChannel } from "../builders/open-channel.ts";
import { validatorDetails } from "../lib/utils.ts";
import { getScriptRef, printUtxos, signAndSubmit } from "./utils.ts";

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
    assets: { lovelace: 30_000_000n, [config.token]: 12n },
  },
]);
const lucid = new Lucid({ provider: emulator });

await printUtxos(lucid, senderAddress);
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

await printUtxos(lucid, senderAddress);
const { scriptAddress } = validatorDetails(lucid);
const utxoAtScript = await lucid.utxosAt(scriptAddress);
printUtxos(lucid, undefined, utxoAtScript);

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
console.log("\n\nVerification: ", verification);
