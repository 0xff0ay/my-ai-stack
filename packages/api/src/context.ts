import { auth } from "@my-ai-stack/auth";
import { db } from "@my-ai-stack/db";

export type CreateContextOptions = {
  headers: Headers;
};

export async function createContext({ headers }: CreateContextOptions) {
  const session = await auth.api.getSession({ headers });
  return {
    session,
    db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
