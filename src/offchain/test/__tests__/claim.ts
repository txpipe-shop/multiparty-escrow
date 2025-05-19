// deno-lint-ignore-file no-explicit-any
import { describe, expect, it } from "@jest/globals";
import { addAssets, fromUnit } from "@spacebudz/lucid";
import { config } from "../../../config.ts";
import { ClaimChannelParams } from "../../../shared/api-types.ts";
import { buildMessage } from "../../builders/build-message.ts";
import { fromChannelDatum, validatorDetails } from "../../lib/utils.ts";
import { getChannelById } from "../../queries/channel-by-id.ts";
import { testClaimOperation, testOpenOperation } from "../operations.ts";
import {
  getCMLPrivateKey,
  normalizeAssets,
  setupTestEnv,
  signMessage,
} from "../utils.ts";

const { sender, signer, receiver, lucid, emulator, scriptRef } =
  await setupTestEnv();

const amount = 100n;

const openChannel = async () => {
  const { openTx, channelId } = await testOpenOperation(
    {
      lucid: lucid,
      scriptRef,
      senderAddress: sender.address,
      receiverAddress: receiver.address,
      signerPubKey: signer.publicKey,
      groupId: "group1",
      expirationDate: BigInt(emulator.now() + 50 * 1000),
      initialDeposit: 600000n,
      currentTime: BigInt(emulator.now()),
    },
    sender.privateKey,
    false,
  );
  const [openChannelUtxo] = await lucid.utxosByOutRef([
    { txHash: openTx, outputIndex: 0 },
  ]);
  return { utxo: openChannelUtxo, channelId };
};
const { scriptHash, scriptAddress } = validatorDetails(lucid);

//
// TESTS
//

describe("Single claim: happy path tests", () => {
  it("Output is correct", async () => {
    const { utxo: openChannelUtxo, channelId } = await openChannel();
    const oldDatum = fromChannelDatum(openChannelUtxo.datum!);
    const { payload } = await buildMessage(lucid, {
      channelId,
      amount,
      senderAddress: sender.address,
    });
    const signature = await signMessage(getCMLPrivateKey(signer.seed), payload);
    const claims: ClaimChannelParams["channels"] = [
      {
        senderAddress: sender.address,
        channelId,
        amount,
        signature,
        finalize: false,
      },
    ];
    const { claimTx } = await testClaimOperation(
      {
        lucid,
        scriptRef,
        listOfClaims: claims,
        currentTime: BigInt(emulator.now()),
        receiverAddress: receiver.address,
      },
      receiver.privateKey,
      false,
    );
    const [claimUtxo] = await lucid.utxosByOutRef([
      { txHash: claimTx, outputIndex: 0 },
    ]);
    const newDatum = fromChannelDatum(claimUtxo.datum!);
    const channelToken = Object.keys(claimUtxo.assets).find(
      (asset) => fromUnit(asset).policyId == scriptHash,
    );
    if (!channelToken) throw new Error("Channel token not found");
    expect(fromUnit(channelToken).name).toBe(sender.pubKeyHash);
    expect(newDatum).toEqual({ ...oldDatum, nonce: oldDatum.nonce + 1n });
  });

  it("Claim and close channel", async () => {
    const { channelId } = await openChannel();
    const { payload } = await buildMessage(lucid, {
      channelId,
      amount,
      senderAddress: sender.address,
    });
    const [channelUtxo] = await getChannelById(lucid, channelId).then(
      ({ txHash, outputIndex }) =>
        lucid.utxosByOutRef([{ txHash, outputIndex }]),
    );
    const channelToken = Object.keys(channelUtxo.assets).find(
      (asset) => fromUnit(asset).policyId == scriptHash,
    );
    if (!channelToken) throw new Error("Channel token not found");
    const signature = await signMessage(getCMLPrivateKey(signer.seed), payload);
    const claims: ClaimChannelParams["channels"] = [
      {
        senderAddress: sender.address,
        channelId,
        amount,
        signature,
        finalize: true,
      },
    ];
    const { claimTx } = await testClaimOperation(
      {
        lucid,
        scriptRef,
        listOfClaims: claims,
        currentTime: BigInt(emulator.now()),
        receiverAddress: receiver.address,
      },
      receiver.privateKey,
      false,
    );
    await lucid.awaitTx(claimTx);
    const txOutputs = await lucid
      .utxosAt(scriptAddress)
      .then(async (utxos) => utxos.concat(await lucid.utxosAt(sender.address)))
      .then((utxos) => utxos.filter((utxo) => utxo.txHash === claimTx));
    const userPayout = txOutputs[0];

    expect(txOutputs.find((o) => o.address === scriptAddress)).toBeUndefined();
    expect(userPayout.address).toBe(sender.address);
    expect(userPayout.assets).toMatchObject(
      normalizeAssets(
        addAssets(
          channelUtxo.assets,
          { [channelToken]: -1n },
          { [config.token]: -amount },
        ),
      ),
    );
  });
});

describe("Multiple claims: happy path tests", () => {
  it("Check inputs and outputs one on one", async () => {
    // Open two new channels
    const { utxo: openUtxo1 } = await openChannel();
    const { utxo: openUtxo2 } = await openChannel();

    // Inputs are sorted lexicographically
    const [in1, in2] = [openUtxo1, openUtxo2].sort((a, b) => {
      const aLex = `${a.txHash}${a.outputIndex}`;
      const bLex = `${b.txHash}${b.outputIndex}`;
      if (aLex < bLex) return -1;
      return 1;
    });
    const in1Datum = fromChannelDatum(in1.datum!);
    const in2Datum = fromChannelDatum(in2.datum!);

    // Claim both channels
    const { payload: p1 } = await buildMessage(lucid, {
      channelId: in1Datum.channelId,
      amount,
      senderAddress: sender.address,
    });
    const { payload: p2 } = await buildMessage(lucid, {
      channelId: in2Datum.channelId,
      amount,
      senderAddress: sender.address,
    });
    const signature = await signMessage(getCMLPrivateKey(signer.seed), p1);
    const signature2 = await signMessage(getCMLPrivateKey(signer.seed), p2);
    const claims: ClaimChannelParams["channels"] = [
      {
        senderAddress: sender.address,
        channelId: in1Datum.channelId,
        amount,
        signature,
        finalize: false,
      },
      {
        senderAddress: sender.address,
        channelId: in2Datum.channelId,
        amount,
        signature: signature2,
        finalize: true,
      },
    ];
    const { claimTx } = await testClaimOperation(
      {
        lucid,
        scriptRef,
        listOfClaims: claims,
        currentTime: BigInt(emulator.now()),
        receiverAddress: receiver.address,
      },
      receiver.privateKey,
      false,
    );
    const [claimUtxo, userUtxo] = await lucid.utxosByOutRef([
      { txHash: claimTx, outputIndex: 0 },
      { txHash: claimTx, outputIndex: 1 },
    ]);
    const claimDatum = fromChannelDatum(claimUtxo.datum!);
    const channelToken = Object.keys(in2.assets).find(
      (asset) => fromUnit(asset).policyId == scriptHash,
    );
    if (!channelToken) throw new Error("Channel token not found");

    // Check output 1
    expect(claimUtxo.address).toBe(scriptAddress);
    expect(claimUtxo.assets).toMatchObject(
      addAssets(in1.assets, { [config.token]: -amount }),
    );
    expect(claimDatum).toEqual({ ...in1Datum, nonce: in1Datum.nonce + 1n });

    // Check output 2 (closed channel)
    expect(userUtxo.address).toBe(sender.address);
    expect(userUtxo.assets).toMatchObject(
      normalizeAssets(
        addAssets(
          in2.assets,
          { [channelToken]: -1n },
          { [config.token]: -amount },
        ),
      ),
    );
  });
});

describe("Attack tests", () => {
  it("Fails to claim an expired channel", async () => {
    try {
      const { channelId } = await openChannel();
      const { payload } = await buildMessage(lucid, {
        channelId,
        amount,
        senderAddress: sender.address,
      });
      const signature = await signMessage(
        getCMLPrivateKey(signer.seed),
        payload,
      );
      const claims: ClaimChannelParams["channels"] = [
        {
          senderAddress: sender.address,
          channelId,
          amount,
          signature,
          finalize: false,
        },
      ];
      const { claimTx } = await testClaimOperation(
        {
          lucid,
          scriptRef,
          listOfClaims: claims,
          currentTime: BigInt(emulator.now() + 60 * 1000),
          receiverAddress: receiver.address,
        },
        receiver.privateKey,
        false,
      );
      expect(claimTx).toBeUndefined();
    } catch (e) {
      console.log("\x1b[31m%s\x1b[0m", String(e));
      expect(String(e)).toContain("No channels available to claim");
    }
  });
});
