import "@my-ai-stack/env/web";
import alchemy from "alchemy/cloudflare/nuxt";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "latest",
  devtools: { enabled: true },
  experimental: {
    payloadExtraction: "client",
  },
  modules: ["@nuxt/ui", "nitro-cloudflare-dev"],
  css: ["~/assets/css/main.css"],
  devServer: {
    port: 3001,
  },
  nitro: {
    preset: "cloudflare-module",
    cloudflare: alchemy(),
    prerender: {
      routes: ["/"],
      autoSubfolderIndex: false,
    },
  },
});
