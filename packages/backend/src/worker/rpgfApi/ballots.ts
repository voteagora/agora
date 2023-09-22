import { ethers } from "ethers";
import { makeBallotService, votesSchema } from "../../services/ballot";
import { Env, mustGetAlchemyApiKey } from "../env";
import { authWrap, createResponse, Handler, handlerWrap } from "./utils";

export async function handleBallotsRequest(request: Request, env: Env) {
  const path = new URL(request.url).pathname.split("/")[3];

  switch (path) {
    case "save":
      return wrappedSaveHandler(request, env);

    case "submit":
      return wrappedSubmitHandler(request, env);

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
    return createResponse({ error: "Address is missing" }, 400);
  }
  return createResponse(await makeBallotService().getBallot(address));
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
      400
    );
  }

  return createResponse({
    ballot: await makeBallotService().saveBallot(address, votes),
  });
};

const wrappedSaveHandler = authWrap(handlerWrap(handleSaveRequest));

// ----------------
// Submit
// ----------------

const handleSubmitRequest: Handler = async (
  request: Request,
  env: Env
): Promise<Response> => {
  const provider = new ethers.providers.AlchemyProvider(
    "optimism",
    mustGetAlchemyApiKey(env)
  );

  const { votes, signature, address } = (await request.json()) as any;

  const validationResult = votesSchema.safeParse(votes);

  if (!validationResult.success || !address || !signature) {
    return createResponse(
      { error: "Bad request: incorrect ballot schema" },
      400
    );
  }
  try {
    const submission = await makeBallotService().submitBallot(
      address,
      votes,
      signature,
      provider
    );

    if (submission.error) {
      return createResponse({ error: submission.error }, submission.error.code);
    }

    return createResponse({
      submission,
    });
  } catch (error) {
    return createResponse({ error }, 500);
  }
};

const wrappedSubmitHandler = handlerWrap(handleSubmitRequest);
