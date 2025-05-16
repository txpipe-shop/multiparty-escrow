import dotenv from "dotenv";
import fs from "fs";
import { z } from "zod";

dotenv.config();
const envSchema = z
  .object({
    PORT: z
      .string()
      .refine(
        (val) =>
          Number.isFinite(Number.parseInt(val)) && Number.parseInt(val) > 0,
        { message: `Port must be a positive integer` },
      )
      .transform((val) => Number.parseInt(val)),
    PROVIDER_PROJECT_ID: z.string(),
    PROVIDER_URL: z.string(),
    NETWORK: z.string(),
    CONFIG_FILE: z.string(),
    SEED: z.string().optional(),
  })
  .readonly();

export type EnvSchema = z.infer<typeof envSchema>;
const env = envSchema.parse(process.env);

const configFile = JSON.parse(fs.readFileSync(env.CONFIG_FILE, "utf-8"));
const configFileSchema = z.object({
  token: z.string(),
  ref_script: z.object({
    txHash: z.string(),
  }),
});
const config = configFileSchema.parse(configFile);
export { config, env };
