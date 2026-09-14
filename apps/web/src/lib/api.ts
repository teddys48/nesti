import { treaty } from "@elysiajs/eden";
import type { App } from "@notes/api";

const baseUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3002";
export const api = treaty<App>(baseUrl);
