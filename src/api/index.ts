import { env } from "../config.ts";
import { createServer } from "./entry-points/server.ts";
import { setRoutes } from "./entry-points/routes.ts";
import { Blockfrost, Lucid, Network } from "@spacebudz/lucid";
import { logger } from "../shared/logger.ts";

const startServer = async () => {
  const PORT = env.PORT;
  const app = createServer();
  const lucid = new Lucid({
    provider: new Blockfrost(env.PROVIDER_URL, env.PROVIDER_PROJECT_ID),
    network: env.NETWORK as Network,
  });
  await setRoutes(lucid, app);
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
};

await startServer();
