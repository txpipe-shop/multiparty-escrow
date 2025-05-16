import { Addresses, Assets, Data, Lucid, Utxo } from "@spacebudz/lucid";
import {
  ChannelAction,
  ChannelDatum,
  ChannelDatumSchema,
  ChannelRedeemerSchema,
  ChannelValidator,
} from "../types/types.ts";

export const toChannelDatum = (d: ChannelDatum): string =>
  Data.to(d, ChannelDatumSchema);
export const fromChannelDatum = (d: string): ChannelDatum =>
  Data.from(d, ChannelDatumSchema);

export const toChannelRedeemer = (r: ChannelAction) =>
  Data.to(r, ChannelRedeemerSchema);

export const getChannelUtxo = async (
  lucid: Lucid,
  channelToken: string,
  channelId: string
) => {
  const validator = new ChannelValidator();
  const scriptAddress = Addresses.scriptToAddress(lucid.network, validator);
  return await lucid
    .utxosAtWithUnit(scriptAddress, channelToken)
    .then((utxos) =>
      utxos.find(({ txHash, outputIndex, datum }) => {
        if (!datum) {
          console.warn(
            `Channel UTxO without datum found: ${txHash}#${outputIndex}`
          );
          return false;
        }
        try {
          const { channelId: cId } = fromChannelDatum(datum);
          return cId == channelId;
        } catch (e) {
          console.warn(e);
          return false;
        }
      })
    );
};

export const validatorDetails = (lucid: Lucid) => {
  const validator = new ChannelValidator();

  const scriptAddress = Addresses.scriptToAddress(lucid.network, validator);

  const details = Addresses.inspect(scriptAddress);
  const scriptCredential = details.payment;
  if (!scriptCredential) throw new Error("Script credentials not found");
  const scriptHash = scriptCredential.hash;
  const scriptRewardAddress = Addresses.credentialToRewardAddress(
    lucid.network,
    scriptCredential
  );

  return { scriptAddress, scriptHash, scriptRewardAddress };
};

/**
  Returns a list of UTxOs whose total assets are equal to or greater than the asset value provided,
  @param utxos list of available utxos,
  @param totalAssets minimum total assets required,
  @param includeUTxOsWithScriptRef Whether to include UTxOs with scriptRef or not. default = false
*/
export const selectUTxOs = (
  utxos: Utxo[],
  totalAssets: Assets,
  includeUtxosWithScriptRef: boolean = false,
) => {
  const selectedUtxos: Utxo[] = [];
  let isSelected = false;
  const assetsRequired = new Map<string, bigint>(Object.entries(totalAssets));
  for (const utxo of utxos) {
    if (!includeUtxosWithScriptRef && utxo.scriptRef) continue;
    isSelected = false;
    for (const [unit, amount] of assetsRequired)
      if (unit in utxo.assets) {
        const utxoAmount = utxo.assets[unit];
        if (utxoAmount >= amount) assetsRequired.delete(unit);
        else assetsRequired.set(unit, amount - utxoAmount);
        isSelected = true;
      }
    if (isSelected) selectedUtxos.push(utxo);
    if (assetsRequired.size == 0) break;
  }
  if (assetsRequired.size > 0) return [];
  return selectedUtxos;
};
