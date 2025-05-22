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

// For testing purposes only
const seedSchema = z
  .string()
  .refine(
    (s) =>
      s.startsWith("SEED=") &&
      s.split("=").length === 2 &&
      s.split("=").pop()?.split(" ").length === 24,
    {
      message:
        "Invalid .test-env format. See the README file for the correct format."
    },
  )
  .transform((s) => s.split("=").pop() as string);
const testEnvFile = fs.readFileSync("./.test-env", "utf-8");
const testEnv = {
  SEED: seedSchema.parse(testEnvFile),
};
export { config, env, testEnv };
