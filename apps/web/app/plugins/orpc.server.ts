import { createContext } from "@my-ai-stack/api/context";
import { appRouter } from "@my-ai-stack/api/routers/index";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

export default defineNuxtPlugin(async () => {
  const event = useRequestEvent();

  const context = await createContext({
    headers: event?.headers ?? new Headers(),
  });

  const client = createRouterClient(appRouter, {
    context,
  });

  const orpc = createTanstackQueryUtils(client);

  return {
    provide: {
      orpc,
    },
  };
});
