import { Addresses, Network } from "@spacebudz/lucid";
import { z, ZodError } from "zod";
import { env } from "../config.ts";

const NETWORKS = {
  MAINNET: {
    url: "https://cardano-mainnet.blockfrost.io/api/v0",
    network: "Mainnet",
  },
  PREPROD: {
    url: "https://cardano-preprod.blockfrost.io/api/v0",
    network: "Preprod",
  },
  PREVIEW: {
    url: "https://cardano-preview.blockfrost.io/api/v0",
    network: "Preview",
  },
} as const;

/**
 * Gets the right url & network for the API
 *
 * @param projectId ProjectId of the Blockfrost API
 * @returns A pair {url, network} according to the `projectId`
 */
function deduceBlockfrostUrlAndNetwork(projectId: string): {
  url: string;
  network: Network;
} {
  if (projectId.includes(NETWORKS.MAINNET.network.toLowerCase())) {
    return NETWORKS.MAINNET;
  }
  if (projectId.includes(NETWORKS.PREVIEW.network.toLowerCase())) {
    return NETWORKS.PREVIEW;
  }
  if (projectId.includes(NETWORKS.PREPROD.network.toLowerCase())) {
    return NETWORKS.PREPROD;
  }
  throw new Error("Invalid projectId");
}

const { network } = deduceBlockfrostUrlAndNetwork(env.PROVIDER_PROJECT_ID);

const validateAddressType = (address: string) => {
  return Addresses.inspect(address).type === "Base";
};

const invalidTypeAddress = {
  message: "Address should be a Base address",
};

const networkToId = (network: Network) => {
  switch (network) {
    case "Mainnet":
      return 1;
    case "Preprod":
      return 0;
    case "Preview":
      return 0;
    default:
      throw new Error("Invalid network");
  }
};

const validateAddressFormat = (address: string) => {
  try {
    return Addresses.inspect(address);
  } catch {
    throw new ZodError([
      {
        code: z.ZodIssueCode.custom,
        message: "Address should be a valid Cardano address",
        path: ["address"],
      },
    ]);
  }
};

const invalidFormatAddress = {
  message: "Address should be a valid Cardano address",
};

const validateAddressNetwork = (address: string) => {
  return Addresses.inspect(address).networkId === networkToId(network);
};

const invalidAddressNetwork = {
  message: `Address should be of the network ${network}`,
};

function addressToBech32(address: string): string {
  return Addresses.inspect(address).address; // Bech32 address ?
}

const addressSchema = z
  .string({ description: "Bech32 Cardano Address" })
  .refine(validateAddressFormat, invalidFormatAddress)
  .refine(validateAddressType, invalidTypeAddress)
  .refine(validateAddressNetwork, invalidAddressNetwork)
  .transform(addressToBech32);

export const OutRef = z.string(); // txHash + outputIndex

export const OpenChannelSchema = z.object({
  senderAddress: addressSchema,
  signerPubKey: z.string().length(64),
  receiverAddress: addressSchema,
  initialDeposit: z.bigint().min(1n),
  expirationDate: z.bigint().min(0n),
  groupId: z.string(),
});

export const UpdateChannelSchema = z.object({
  channelId: OutRef,
  userAddress: addressSchema,
  senderAddress: addressSchema,
  addDeposit: z.bigint().optional(),
  expirationDate: z.bigint().optional(),
});

export const ClaimChannelSchema = z.array(
  z.object({
    senderAddress: addressSchema,
    channelId: OutRef,
    amount: z.bigint(),
    signature: z.string(),
    finalize: z.boolean(),
  }),
);

export const CloseChannelSchema = z.object({
  senderAddress: addressSchema,
  channelId: OutRef,
});

export const BuildMessageSchema = z.object({
  channelId: OutRef,
  senderAddress: addressSchema,
  amount: z.bigint(),
});

export type channelIdType = z.infer<typeof OutRef>;
export type OpenChannelParams = z.infer<typeof OpenChannelSchema>;
export type UpdateChannelParams = z.infer<typeof UpdateChannelSchema>;
export type ClaimChannelParams = z.infer<typeof ClaimChannelSchema>;
export type CloseChannelParams = z.infer<typeof CloseChannelSchema>;
export type BuildMessageParams = z.infer<typeof BuildMessageSchema>;
