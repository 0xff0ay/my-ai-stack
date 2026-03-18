import { auth } from "@my-ai-stack/auth";

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event));
});
