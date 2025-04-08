import { Addresses, Crypto, Emulator, Lucid } from "@spacebudz/lucid";
import { generateMnemonic } from "bip39";
import { config } from "../../config.ts";
import { closeChannel } from "../builders/close-channel.ts";
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
    expirationDate: BigInt(Date.now() + 30 * 1000),
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
const utxosAtScript = await lucid.utxosAt(scriptAddress);
printUtxos(lucid, undefined, utxosAtScript);

const { closedChannelCbor } = await closeChannel(
  lucid,
  { senderAddress, channelId },
  scriptRef,
  BigInt(Date.now() + 31 * 1000),
);
const closedTx = await signAndSubmit(lucid, senderPrivKey, closedChannelCbor);

console.log(`\n
    > Channel closed with ID: ${channelId}
    > Tx ID: ${closedTx}
    > CBOR: ${closedChannelCbor}\n\n`);

const finalUtxosAtScript = await lucid.utxosAt(scriptAddress);
printUtxos(lucid, senderAddress);
printUtxos(lucid, undefined, finalUtxosAtScript);
