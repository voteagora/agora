type ServiceBinding = {
  fetch(request: Request): Promise<Response>;
};

export interface Env extends ServiceBindings {
  ENVIRONMENT: "dev" | "prod";
}

type ServiceBindings = {
  ENS: ServiceBinding;
  NOUNS: ServiceBinding;
  LIL_NOUNS: ServiceBinding;
};

type MappingType = {
  [host: string]: keyof ServiceBindings;
};

const dev: MappingType = {};

const prod: MappingType = {
  "agora.ensdao.xyz": "ENS",
  "agora.ensdao.org": "ENS",
};

const mapping: { dev: MappingType; prod: MappingType } = {
  dev,
  prod,
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const resolvedBinding = mapping[env.ENVIRONMENT][url.host];
    if (!resolvedBinding) {
      return new Response("not found", { status: 404 });
    }

    const serviceBinding = env[resolvedBinding];
    return await serviceBinding.fetch(request);
  },
};
