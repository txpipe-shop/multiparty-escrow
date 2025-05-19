import { Blockfrost, Crypto, Lucid } from "@spacebudz/lucid";
import promptSync from "prompt-sync";
import { env } from "../../config.ts";
import { ClaimChannelParams } from "../../shared/api-types.ts";
import { buildMessage } from "../builders/build-message.ts";
import { getChannelById } from "../queries/channel-by-id.ts";
import { getChannelsFromReceiver } from "../queries/channels-from-receiver.ts";
import { getChannelsFromSender } from "../queries/channels-from-sender.ts";
import {
  testClaimOperation,
  testCloseChannel,
  testOpenOperation,
  testUpdateOperation,
} from "./operations.ts";
import {
  getCMLPrivateKey,
  getScriptRef,
  printChannels,
  signMessage,
} from "./utils.ts";

const prompt = promptSync();

const lucid = new Lucid({
  provider: new Blockfrost(
    "https://cardano-preview.blockfrost.io/api/v0",
    env.PROVIDER_PROJECT_ID,
  ),
});

const seed = env.SEED;
if (!seed) throw Error("Unable to read wallet's seed from env");
lucid.selectWalletFromSeed(seed);
const { privateKey, publicKey } = Crypto.seedToDetails(seed, 0, "Payment");
const address = await lucid.wallet.address();

type ActionKey = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
const scriptRef = await getScriptRef(lucid, privateKey);

const actions: Record<ActionKey, () => Promise<void>> = {
  1: async () => {
    console.log("\n[Creating a channel]");
    const receiverAddress = prompt("Receiver address: ");
    const initialDeposit = prompt("Initial deposit: ");
    const expirationDate = prompt("Expiration date (in ms): ");
    const groupId = prompt("Group id: ");
    console.log("Creating a channel...");
    await testOpenOperation(
      {
        lucid,
        scriptRef,
        senderAddress: address,
        receiverAddress,
        signerPubKey: publicKey,
        groupId,
        expirationDate: BigInt(expirationDate),
        initialDeposit: BigInt(initialDeposit),
        currentTime: BigInt(Date.now()),
      },
      privateKey,
      false,
    );
  },
  2: async () => {
    console.log("\n[Updating a channel]");
    const channelId = prompt("Channel ID: ");
    const addDeposit = prompt("New deposit: ");
    let expirationDate = prompt("New expiration date (in ms): ");
    console.log("Updating a channel...");
    await testUpdateOperation(
      {
        lucid,
        scriptRef,
        userAddress: address,
        senderAddress: address,
        channelId,
        addDeposit: addDeposit ? BigInt(addDeposit) : undefined,
        expirationDate: expirationDate ? BigInt(expirationDate) : undefined,
        currentTime: BigInt(Date.now()),
      },
      privateKey,
      false,
    );
  },
  3: async () => {
    console.log("\n[Building a message (as Signer)]");
    const channelId = prompt("Channel ID: ");
    const amount = prompt("Amount: ");
    const senderAddress = prompt("Sender Address: ");
    const { payload } = await buildMessage(lucid, {
      channelId,
      amount: BigInt(amount),
      senderAddress,
    });
    lucid.selectWalletFromPrivateKey(privateKey);
    const privKey = getCMLPrivateKey(seed);
    const signature = await signMessage(privKey, payload);

    console.log("Signed Message:");
    console.log(signature);
  },
  4: async () => {
    console.log("\n[Closing a channel]");
    const channelId = prompt("Channel ID: ");
    console.log("Closing a channel...");
    await testCloseChannel(
      {
        lucid,
        scriptRef,
        senderAddress: address,
        channelId,
        currentTime: BigInt(Date.now()),
      },
      privateKey,
      false,
    );
  },
  5: async () => {
    console.log("\n[Claiming channels]");
    let claimAction = 0;
    let listOfClaims: ClaimChannelParams["channels"] = [];
    while (claimAction !== 2) {
      console.log(
        "\nOPTIONS:\n1: Add a channel to claim\n2: Claim added channels",
      );
      claimAction = Number(prompt("Select an option (1-2): "));
      if (claimAction === 1) {
        const senderAddress = prompt("Sender Address: ");
        const channelId = prompt("Channel ID: ");
        const close = prompt("Close channel (y/n): ");
        const amount = prompt("Amount: ");
        const signature = prompt("Signature: ");
        listOfClaims.push({
          senderAddress,
          channelId,
          finalize: close === "y",
          amount: BigInt(amount),
          signature,
        });
      } else if (claimAction !== 2)
        console.log("Invalid option. Please try again.");
    }
    console.log("Claiming a channel...");
    await testClaimOperation(
      {
        lucid,
        listOfClaims,
        scriptRef,
        currentTime: BigInt(Date.now()),
        receiverAddress: address,
      },
      privateKey,
      false,
    );
  },
  6: async () => {
    console.log("\n[Get a channel by ID]");
    const channelId = prompt("Channel ID: ");
    printChannels(
      `CHANNELS WITH ID: ${channelId}`,
      await getChannelById(lucid, channelId),
    );
  },
  7: async () => {
    console.log("\n[Get Own Channels (as Sender)]");
    printChannels("OWN CHANNELS", await getChannelsFromSender(lucid, address));
  },
  8: async () => {
    console.log("\n[Get Own Channels (as Receiver)]");
    printChannels(
      "OWN CHANNELS",
      await getChannelsFromReceiver(lucid, address),
    );
  },
  9: async () => {
    console.log("\n[EXIT]");
  },
};

async function main() {
  let action = 0;
  while (action !== 9) {
    console.log(
      "\nOPTIONS:\n1: create a channel\n2: update a channel\n3: build a message\n4: close channel\n5: claim a channel\n6: get channel by ID\n7: get own channels (as a sender)\n8: get own channels (as a receiver)\n9: exit",
    );
    action = Number(prompt("Select an option (1-9): "));
    if (action && actions.hasOwnProperty(action))
      try {
        await actions[action as ActionKey]();
      } catch (e) {
        console.error(e);
      }
    else console.log("Invalid option. Please try again.");
  }
}

main();
