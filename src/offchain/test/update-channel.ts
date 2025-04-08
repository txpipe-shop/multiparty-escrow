import { Addresses, Crypto, Emulator, Lucid } from "@spacebudz/lucid";
import { generateMnemonic } from "bip39";
import { config } from "../../config.ts";
import { openChannel } from "../builders/open-channel.ts";
import { updateChannel } from "../builders/update-channel.ts";
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
    assets: { lovelace: 3000000000n, [config.token]: 12n },
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
    expirationDate: BigInt(Date.now()) + 2n * 24n * 60n * 60n * 1000n,
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

const { updatedChannelCbor } = await updateChannel(
  lucid,
  {
    userAddress: senderAddress,
    senderAddress,
    channelId,
    addDeposit: 3n,
    expirationDate: BigInt(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
  scriptRef,
  BigInt(Date.now() + 4 * 60 * 60 * 1000),
);
const updatedTx = await signAndSubmit(lucid, senderPrivKey, updatedChannelCbor);

console.log(`\n
    > Channel updated with ID: ${channelId}
    > Add Deposit: 3
    > Tx ID: ${updatedTx}
    > CBOR: ${updatedChannelCbor}\n\n`);

const finalUtxosAtScript = await lucid.utxosAt(scriptAddress);
printUtxos(lucid, senderAddress);
printUtxos(lucid, undefined, finalUtxosAtScript);
