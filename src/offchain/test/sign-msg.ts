import { Data } from "@spacebudz/lucid";
import { getCMLPrivateKey, signMessage } from "./utils.ts";
import { env } from "../../config.ts";
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

console.log(
  signMessage(
    getCMLPrivateKey(env.SEED as string),
    Data.to(
      [nonce, channelId, amount] as [bigint, string, bigint],
      Data.Tuple([Data.Integer(), Data.Bytes(), Data.Integer()]),
    ),
  ),
);
