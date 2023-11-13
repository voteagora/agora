import { ethers } from "ethers";
import express from "express";
import bodyParser from "body-parser";
import {
  isBadgeholder,
  makeSIWENonce,
  verifySIWEMessage,
  verifySIWESession,
} from "../services/auth";
import { makeBallotService, votesSchema } from "../services/ballot";
import { makeLikesService } from "../services/likes";
import PrismaSingleton from "../store/prisma/client";
import { Reader } from "../indexer/storage/reader";
import { entityDefinitions } from "../indexer/contracts";

const app = express();
const PORT = 4003;

export function startRestServer(
  provider: ethers.providers.BaseProvider,
  reader: Reader<typeof entityDefinitions>
) {
  PrismaSingleton.setConnectionUrl(process.env.DATABASE_URL!);

  app.use(bodyParser.json());
  app.use("/api/auth", authRoutes(reader, provider));
  app.use("/api/ballot", ballotRoutes(provider));
  app.use("/api/likes", likesRoutes());

  app.listen(PORT, () => {
    console.log(`REST server is running on http://localhost:${PORT}`);
  });
}

// ----------------
// Auth
// ----------------

function authRoutes(
  reader: Reader<typeof entityDefinitions>,
  provider: ethers.providers.BaseProvider
) {
  const router = express.Router();

  router.get("/nonce", (_, res) => {
    try {
      const newNonce = makeSIWENonce();

      // Setting the cookie
      res.cookie("nonce", newNonce, {
        path: "/",
        httpOnly: true,
        secure: true,
        maxAge: 300 * 1000, // 5 minutes
      });

      res.json({ nonce: newNonce });
    } catch (error) {
      res.status(500).json({ error });
    }
  });

  router.post("/verify", async (req, res) => {
    try {
      const { message, signature, nonce } = req.body;

      if (!message || !signature) {
        return res.status(400).json({ error: "Invalid request" });
      }

      if (nonce) {
        const { success, jwt } = await verifySIWEMessage(
          message,
          signature,
          nonce,
          "secret",
          provider
        );

        if (success) {
          res.cookie("access-token", jwt, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            maxAge: 3600 * 1000,
          });

          return res.json({ success });
        } else {
          return res.status(401).json({ error: "Invalid nonce or signature" });
        }
      } else {
        return res.status(401).json({ error: "Missing nonce" });
      }
    } catch (error) {
      return res.status(500).json({ error });
    }
  });

  router.get("/session", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.split(" ")[1];

      if (accessToken) {
        const session = await verifySIWESession(accessToken, "secret");
        if (session) {
          return res.json({ ...session.payload, chainId: 10 });
        } else {
          return res
            .status(401)
            .json({ error: "Invalid or expired access token" });
        }
      } else {
        return res.status(401).json({ error: "Missing access token" });
      }
    } catch (error) {
      return res.status(500).json({ error });
    }
  });

  router.post("/can-signin", async (req, res) => {
    try {
      const { address } = req.body;
      const canSignIn = await isBadgeholder(address, reader);
      return res.json({ canSignIn });
    } catch (error) {
      return res.status(500).json({ error });
    }
  });

  return router;
}

// ----------------
// Ballots
// ----------------

function ballotRoutes(provider: ethers.providers.BaseProvider) {
  const router = express.Router();
  const ballotService = makeBallotService();

  router.get("/:address", async (req, res) => {
    const address = req.params.address;
    try {
      const ballot = await ballotService.getBallot(address);
      return res.json({ ballot });
    } catch (error) {
      return res.status(500).json({ error });
    }
  });

  router.post("/save", async (req, res) => {
    const { address, votes } = req.body;

    const validationResult = votesSchema.safeParse(votes);

    if (!validationResult.success || !address) {
      return res
        .status(400)
        .json({ error: "Bad request: incorrect ballot schema" });
    }

    try {
      const savedBallot = await ballotService.saveBallot(address, votes);
      return res.json({ ballot: savedBallot });
    } catch (error) {
      return res.status(500).json({ error });
    }
  });

  router.post("/submit", async (req, res) => {
    const { address, votes, signature } = req.body;

    const validationResult = votesSchema.safeParse(votes);

    if (!validationResult.success || !address || !signature) {
      return res
        .status(400)
        .json({ error: "Bad request: incorrect ballot schema" });
    }

    try {
      const submission = await ballotService.submitBallot(
        address,
        votes,
        signature,
        provider
      );
      if (submission.error) {
        return res
          .status(submission.error.code)
          .json({ error: submission.error.message });
      }
      return res.json({ submission });
    } catch (error) {
      return res.status(500).json({ error });
    }
  });

  return router;
}

// ----------------
// Likes
// ----------------

function likesRoutes() {
  const router = express.Router();
  const likesService = makeLikesService();

  router.post("/:listId/like", async (req, res) => {
    const listId = req.params.listId;

    if (!listId) {
      return res
        .status(400)
        .json({ error: "Bad request: address of listId is missing" });
    }

    // TODO: verify that listId exists

    const address = req.body.address; // TODO: get address from session

    try {
      const like = await likesService.like({ listId, address });
      return res.json(like);
    } catch (error) {
      return res.status(500).json({ error });
    }
  });

  router.get("/:listId", async (req, res) => {
    const listId = req.params.listId;

    if (!listId) {
      return res.status(400).json({ error: "Bad request:  listId is missing" });
    }

    try {
      const likes = await likesService.getLikes(listId);
      return res.json(likes);
    } catch (error) {
      return res.status(500).json({ error });
    }
  });

  router.get("/", async (_, res) => {
    try {
      const likes = await likesService.getAllLikes();
      return res.json(likes);
    } catch (error) {
      return res.status(500).json({ error });
    }
  });

  return router;
}
