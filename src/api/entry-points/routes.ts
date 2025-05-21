import { Lucid } from "@spacebudz/lucid";
import e, { Request, Response } from "express";
import { z } from "zod";
import { config } from "../../config.ts";
import { openChannel } from "../../offchain/builders/open-channel.ts";
import { updateChannel } from "../../offchain/builders/update-channel.ts";
import {
  OpenChannelSchema,
  UpdateChannelSchema,
} from "../../shared/api-types.ts";
import { logger } from "../../shared/logger.ts";

enum Routes {
  OPEN = "/open",
  UPDATE = "/update",
  CLAIM = "/claim",
  CLOSE = "/close",
  ALL_CHANNELS = "/channels",
  CHANNEL_WITH_ID = "/channels-with-id",
  CHANNELS_FROM_SENDER = "/channels-from-sender",
  CHANNELS_FROM_RECEIVER = "/channels-from-receiver",
}

export const setRoutes = async (lucid: Lucid, app: e.Application) => {
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
  app.post(Routes.OPEN, async (req: Request, res: Response) => {
    logger.info("handling request", Routes.OPEN);
    try {
      const params = OpenChannelSchema.parse(req.body);
      const currentTime = BigInt(Date.now());
      const openResult = await openChannel(
        lucid,
        params,
        refScript,
        currentTime
      );
      res.status(200).json(openResult);
      logger.info(
        `open channel request completed; channelID: ${openResult.channelId}`,
        Routes.OPEN
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
        logger.error(`bad request: ${error}`, Routes.OPEN);
      } else {
        res.status(500).json({ error: "Internal server error" });
        logger.error(`internal server error: ${error.stack}`, Routes.OPEN);
      }
    }
  });

  /**
   * Update a channel
   */
  app.post(Routes.UPDATE, async (req: Request, res: Response) => {
    logger.info("handling request", Routes.UPDATE);
    try {
      const params = UpdateChannelSchema.parse(req.body);
      const currentTime = BigInt(Date.now());
      const updateResult = await updateChannel(
        lucid,
        params,
        refScript,
        currentTime
      );
      res.status(200).json(updateResult);
      logger.info(
        `update channel request completed;
        - Amount: ${params.addDeposit ?? 0}
        - Expiration date: ${
          Number(params.expirationDate)
            ? new Date(Number(params.expirationDate))
            : "N/A"
        }`,
        Routes.UPDATE
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
        logger.error(`bad request: ${error}`, Routes.OPEN);
      } else {
        res.status(500).json({ error: "Internal server error" });
        logger.error(`internal server error: ${error.stack}`, Routes.OPEN);
      }
    }
  });
};
