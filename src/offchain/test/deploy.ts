import { Blockfrost, Lucid } from "@spacebudz/lucid";
import { testEnv, env } from "../../config.ts";
import { deployScript } from "../builders/deploy-script.ts";

const lucid = new Lucid({
  provider: new Blockfrost(env.PROVIDER_URL, env.PROVIDER_PROJECT_ID),
});

if (!testEnv.SEED) throw new Error("SEED not found in .test-env file");

lucid.selectWalletFromSeed(testEnv.SEED);
const { cbor } = await deployScript(lucid);
const txId = await lucid
  .fromTx(cbor)
  .then((txComp) => {
    return txComp.sign().commit();
  })
  .then((txSigned) => txSigned.submit());
console.log(`Validator deployed. TxId: ${txId}`);
