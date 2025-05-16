import { Lucid } from "@spacebudz/lucid";
import e from "express";
import { OpenChannelSchema } from "../../shared/api-types.ts";
import { openChannel } from "../../offchain/builders/open-channel.ts";
import { logger } from "../../shared/logger.ts";
import { z } from "zod";
import { Request, Response } from "express";
import { config } from "../../config.ts";

const setRoutes = async (lucid: Lucid, app: e.Application) => {
  // Lookup deployed reference script holding the validator
  const [refScript] = await lucid.utxosByOutRef([
    { txHash: config.ref_script.txHash, outputIndex: 0 },
  ]);
  if (!refScript) {
    throw new Error("Failed to find reference script");
  }

  /**
   * Open a new channel
   */
  app.post("/open", async (req: Request, res: Response) => {
    logger.info("handling request", "/open");
    try {
      const params = OpenChannelSchema.parse(req.body);
      const now = BigInt(Date.now());
      const openResult = await openChannel(lucid, params, refScript, now);
      res.status(200).json(openResult);
      logger.info(
        `open channel request completed; channelID: ${openResult.channelId}`,
        "/open",
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
        logger.error(`bad request: ${error}`, "/open");
      } else {
        res.status(500).json({ error: "Internal server error" });
        logger.error(`internal server error: ${error.stack}`, "/open");
      }
    }
  });
};

export { setRoutes };
