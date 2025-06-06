// deno-lint-ignore-file no-explicit-any
import { describe, expect, it } from "@jest/globals";
import { Data, fromText, fromUnit } from "@spacebudz/lucid";
import { config } from "../../../config.ts";
import { fromChannelDatum, validatorDetails } from "../../lib/utils.ts";
import { ChannelDatum } from "../../types/types.ts";
import { testOpenOperation } from "../operations.ts";
import { setupTestEnv } from "../utils.ts";

const { sender, signer, receiver, lucid, emulator, scriptRef } =
  await setupTestEnv();

const expirationDate = BigInt(emulator.now() + 60 * 60 * 1000);
const initialDeposit = 6n;
const groupId = "group1";
const open = async () => {
  const { channelId, openTx } = await testOpenOperation(
    {
      lucid,
      scriptRef,
      senderAddress: sender.address,
      receiverAddress: receiver.address,
      signerPubKey: signer.publicKey,
      groupId,
      expirationDate,
      initialDeposit,
      currentTime: BigInt(emulator.now()),
    },
    sender.privateKey,
    false,
  );
  const [channelUtxo] = await lucid.utxosByOutRef([
    { txHash: openTx, outputIndex: 0 },
  ]);

  return { channelId, channelUtxo };
};

//
// TESTS
//
describe("Attack tests", () => {
  it("Fails to open an expired channel", async () => {
    try {
      const channelId = await testOpenOperation(
        {
          lucid: lucid,
          scriptRef,
          senderAddress: sender.address,
          receiverAddress: receiver.address,
          signerPubKey: signer.publicKey,
          groupId,
          expirationDate: BigInt(emulator.now() - 50 * 1000),
          initialDeposit: 6n,
          currentTime: BigInt(emulator.now()),
        },
        sender.privateKey,
        false,
      );
      expect(channelId).toBeUndefined();
    } catch (e) {
      console.log("\x1b[32m%s\x1b[0m", "Test: Open channel already expired.\n");
      console.log("\x1b[31m%s\x1b[0m", String(e));
      expect(String(e)).toContain("Expiration date is in the past");
    }
  });
});

describe("Open channel tests", () => {
  it("Has an output with the token [scriptHash][senderAddress]", async () => {
    const { channelUtxo } = await open();

    const channelToken = Object.keys(channelUtxo.assets).find(
      (asset) => fromUnit(asset).policyId == validatorDetails(lucid).scriptHash,
    );
    if (!channelToken) throw new Error("Channel token not found");
    expect(fromUnit(channelToken).name).toBe(sender.pubKeyHash);
  });
  it("Has an output with the correct datum", async () => {
    const senderUtxos = await lucid.wallet.getUtxos();
    const { channelId, channelUtxo } = await open();
    const datumStr = channelUtxo.datum!;
    const datum: ChannelDatum = fromChannelDatum(datumStr);

    const expectedChannelId = Buffer.from(
      senderUtxos[0].txHash +
        Data.to<bigint>(BigInt(senderUtxos[0].outputIndex)),
      "hex",
    ).toString("hex");
    const channelIdIsValid = expectedChannelId == channelId;
    expect(channelIdIsValid).toBe(true);
    expect(datum.nonce).toBe(0n);
    expect(datum.signer).toBe(signer.publicKey);
    expect(datum.receiver).toBe(receiver.pubKeyHash);
    expect(datum.groupId).toBe(fromText(groupId));
    expect(datum.expirationDate).toBe(expirationDate);
  });
  it("Has a correct amount of tokens", async () => {
    const { channelUtxo } = await open();
    const tokenAmount = channelUtxo.assets[config.token];
    expect(tokenAmount).toBe(6n);
  });
});

describe("Attack tests", () => {
  it("Fails to open an expired channel", async () => {
    try {
      const channelId = await testOpenOperation(
        {
          lucid,
          scriptRef,
          senderAddress: sender.address,
          receiverAddress: receiver.address,
          signerPubKey: signer.publicKey,
          groupId,
          expirationDate: BigInt(emulator.now() - 50 * 1000),
          initialDeposit: 6n,
          currentTime: BigInt(emulator.now()),
        },
        sender.privateKey,
        false,
      );
      expect(channelId).toBeUndefined();
    } catch (e) {
      console.log("\x1b[32m%s\x1b[0m", "Test: Open channel already expired.\n");
      console.log("\x1b[31m%s\x1b[0m", String(e));
      expect(String(e)).toContain("Expiration date is in the past");
    }
  });
});
