import { ethers } from "ethers";
import { makeBallotService, votesSchema } from "../../services/ballot";
import { Env, mustGetAlchemyApiKey } from "../env";
import { authWrap, createResponse, Handler, handlerWrap } from "./utils";
import { Reader } from "../../indexer/storage/reader";
import { entityDefinitions } from "../../indexer/contracts";
import { isBadgeholder } from "../../services/auth";

export async function handleBallotsRequest(
  request: Request,
  env: Env,
  reader: Reader<typeof entityDefinitions>
) {
  const path = new URL(request.url).pathname.split("/")[3];

  switch (path) {
    case "save":
      return wrappedSaveHandler(request, env);

    case "submit":
      return handleSubmitRequest(request, env, reader);

    default:
      return wrappedGetHandler(request, env);
  }
}

// ----------------
// Get
// ----------------

const handleGetRequest: Handler = async (
  request: Request,
  env: Env,
  address?: string
) => {
  if (!address) {
    return createResponse({ error: "Address is missing" }, 400, {}, request);
  }
  return createResponse(
    await makeBallotService().getBallot(address),
    200,
    {},
    request
  );
};

const wrappedGetHandler = authWrap(handlerWrap(handleGetRequest));

// ----------------
// Save
// ----------------

const handleSaveRequest: Handler = async (
  request: Request,
  env: Env,
  address?: string
): Promise<Response> => {
  const { votes } = (await request.json()) as any;

  const validationResult = votesSchema.safeParse(votes);

  if (!validationResult.success || !address) {
    return createResponse(
      { error: "Bad request: incorrect ballot schema" },
      400,
      {},
      request
    );
  }

  return createResponse(
    {
      ballot: await makeBallotService().saveBallot(address, votes),
    },
    200,
    {},
    request
  );
};

const wrappedSaveHandler = authWrap(handlerWrap(handleSaveRequest));

// ----------------
// Submit
// ----------------

const handleSubmitRequest = async (
  request: Request,
  env: Env,
  reader: Reader<typeof entityDefinitions>
): Promise<Response> => {
  try {
    const provider = new ethers.providers.AlchemyProvider(
      "optimism",
      mustGetAlchemyApiKey(env)
    );

    const { votes, signature, address } = (await request.json()) as any;

    const canSubmitBallot = await isBadgeholder(address, reader);

    if (!canSubmitBallot) {
      return createResponse(
        { error: "You must be a badgeholder to submit a ballot" },
        401,
        {},
        request
      );
    }

    const validationResult = votesSchema.safeParse(votes);

    if (!validationResult.success || !address || !signature) {
      return createResponse(
        { error: "Bad request: incorrect ballot schema" },
        400,
        {},
        request
      );
    }
    const submission = await makeBallotService().submitBallot(
      address,
      votes,
      signature,
      provider
    );

    if (submission.error) {
      return createResponse(
        { error: submission.error },
        submission.error.code,
        {},
        request
      );
    }

    return createResponse(
      {
        submission,
      },
      200,
      {},
      request
    );
  } catch (error) {
    return createResponse({ error }, 500, {}, request);
  }
};
