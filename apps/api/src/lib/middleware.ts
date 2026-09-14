import { Elysia } from "elysia";
import { SESSION_COOKIE, validateSession } from "./auth";
import { ApiError } from "./errors";

export const requireAuth = new Elysia({ name: "requireAuth" })
  .derive({ as: "scoped" }, async ({ cookie, set }) => {
    const sessionId = cookie[SESSION_COOKIE]?.value;
    if (!sessionId) {
      set.status = 401;
      throw new ApiError("UNAUTHORIZED", "Not authenticated", 401);
    }

    const sessionData = await validateSession(sessionId as string);
    if (!sessionData) {
      cookie[SESSION_COOKIE]?.remove();
      set.status = 401;
      throw new ApiError("UNAUTHORIZED", "Session expired or invalid", 401);
    }

    return {
      user: sessionData.user,
    };
  });
