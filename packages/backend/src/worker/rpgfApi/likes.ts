import { ethers } from "ethers";
import { makeLikesService } from "../../services/likes";
import { Env } from "../env";
import { authWrap, createResponse, Handler, handlerWrap } from "./utils";

export async function handleLikesRequest(request: Request, env: Env) {
  const path = new URL(request.url).pathname.split("/")[4];
  switch (path) {
    case "like":
      return wrappedLikeHandler(request, env);

    default:
      return wrappedGetHandler(request, env);
  }
}

// ----------------
// Get
// ----------------

const handleGetRequest: Handler = async (request: Request, env: Env) => {
  const listId = new URL(request.url).pathname.split("/")[3];
  if (!listId) {
    return createResponse(await makeLikesService().getAllLikes());
  }

  return createResponse(await makeLikesService().getLikes(listId));
};

const wrappedGetHandler = handlerWrap(handleGetRequest);

// ----------------
// Like
// ----------------

const handleLikeRequest: Handler = async (
  request: Request,
  env: Env,
  address?: string
): Promise<Response> => {
  const listId = new URL(request.url).pathname.split("/")[3];

  if (!listId || !address) {
    return createResponse(
      {
        error: "Bad request: address of listId is missing",
        listId,
        address,
      },
      400
    );
  }

  // TODO: verify that listId exists

  return createResponse(await makeLikesService().like({ listId, address }));
};

const wrappedLikeHandler = authWrap(handlerWrap(handleLikeRequest));
