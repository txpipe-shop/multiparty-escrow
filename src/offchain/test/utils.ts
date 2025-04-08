import { Lucid, Utxo } from "@spacebudz/lucid";
import { deployScript } from "../builders/deploy-script.ts";
import { ChannelInfo } from "../types/types.ts";

const pad = (text = "", length = 80, padChar = "-") => {
  const padLength = Math.max(0, (length - text.length) / 2);
  const pad = padChar.repeat(Math.floor(padLength));
  return `<<<<<<${pad}${text}${pad}>>>>>>`;
};

export const printUtxos = async (
  lucid: Lucid,
  address?: string,
  utxos?: Utxo[],
) => {
  if (address) lucid.selectReadOnlyWallet({ address });
  const walletUtxos = utxos ?? (await lucid.wallet.getUtxos());
  const title = address ? "WALLET UTXOS" : "SCRIPT UTXOS";
  console.log(pad(title));
  console.dir(walletUtxos, { depth: null });
  console.log(pad());
};

export const printChannels = (
  header: string,
  channels: ChannelInfo[] | ChannelInfo,
) => {
  console.log(pad(header));
  console.dir(channels, { depth: null });
  console.log(pad());
};

export const signAndSubmit = async (
  lucid: Lucid,
  privKey: string,
  cbor: string,
) => {
  lucid.selectWalletFromPrivateKey(privKey);
  const txToSign = await lucid.fromTx(cbor);
  const signedTx = await txToSign.sign().commit();
  const tx = await signedTx.submit();
  await lucid.awaitTx(tx);
  return tx;
};

export const getScriptRef = async (lucid: Lucid, privKey: string) => {
  const { cbor } = await deployScript(lucid);
  lucid.selectWalletFromPrivateKey(privKey);
  const txDeployHash = await lucid
    .fromTx(cbor)
    .then((txComp) => txComp.sign().commit())
    .then((txSigned) => txSigned.submit());
  await lucid.awaitTx(txDeployHash);
  const [scriptRef] = await lucid.utxosByOutRef([
    { txHash: txDeployHash, outputIndex: 0 },
  ]);
  return scriptRef;
};
