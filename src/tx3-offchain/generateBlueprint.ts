import { generateBlueprint } from "@blaze-cardano/blueprint";

await generateBlueprint({
  infile: "./onchain/plutus.json",
  outfile: "./tx3-offchain/blueprint.ts",
  useSdk: true,
});
