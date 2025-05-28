import { Data } from "@spacebudz/lucid";
import { getCMLPrivateKey, signMessage } from "./utils.ts";
import { testEnv } from "../../config.ts";
import assert from "assert";

const args = process.argv.slice(2);
let nonce, channelId, amount;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "-c":
    case "--channelId":
      channelId = args[i + 1];
      i++;
      break;
    case "-n":
    case "--nonce":
      nonce = BigInt(args[i + 1]);
      i++;
      break;
    case "-a":
    case "--amount":
      amount = BigInt(args[i + 1]);
      i++;
      break;
  }
}

assert(
  channelId !== undefined && nonce !== undefined && amount !== undefined,
  "USAGE: npm run sign -- -c <channelId> -n <nonce> -a <amount>",
);

if (!testEnv.SEED) {
  throw new Error("SEED not found in .test-env file");
}

console.log(
  signMessage(
    getCMLPrivateKey(testEnv.SEED),
    Data.to(
      [nonce, channelId, amount] as [bigint, string, bigint],
      Data.Tuple([Data.Integer(), Data.Bytes(), Data.Integer()]),
    ),
  ),
);
