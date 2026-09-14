import { Elysia, t } from "elysia";
import { registerSchema, loginSchema, changePasswordSchema } from "./auth.schema";
import { AuthService } from "./auth.service";
import { SESSION_COOKIE, validateSession } from "../../lib/auth";

const authService = new AuthService();

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .get("/setup-status", async () => {
    const userCount = await authService.getUserCount();
    return { hasUsers: userCount > 0 };
  })
  .post(
    "/register",
    async ({ body, cookie, headers, set }) => {
      const result = await authService.register(
        body.username,
        body.password,
        headers["user-agent"]
      );

      cookie[SESSION_COOKIE].set({
        value: result.sessionId,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return { user: result.user };
    },
    { body: registerSchema }
  )
  .post(
    "/login",
    async ({ body, cookie, headers }) => {
      const result = await authService.login(
        body.username,
        body.password,
        headers["user-agent"]
      );

      cookie[SESSION_COOKIE].set({
        value: result.sessionId,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return { user: result.user };
    },
    { body: loginSchema }
  )
  .post("/logout", async ({ cookie }) => {
    const sessionId = cookie[SESSION_COOKIE].value;
    if (sessionId) {
      await authService.logout(sessionId as string);
    }
    cookie[SESSION_COOKIE].remove();
    return { success: true };
  })
  .get("/session", async ({ cookie, set }) => {
    const sessionId = cookie[SESSION_COOKIE].value;
    if (!sessionId) {
      set.status = 401;
      return { error: { code: "UNAUTHORIZED", message: "Not authenticated" } };
    }

    const sessionData = await validateSession(sessionId as string);
    if (!sessionData) {
      cookie[SESSION_COOKIE].remove();
      set.status = 401;
      return { error: { code: "UNAUTHORIZED", message: "Session expired or invalid" } };
    }

    return { user: sessionData.user };
  })
  .post(
    "/change-password",
    async ({ body, cookie, set }) => {
      const sessionId = cookie[SESSION_COOKIE].value;
      const sessionData = await validateSession(sessionId as string);
      if (!sessionData) {
        set.status = 401;
        return { error: { code: "UNAUTHORIZED", message: "Not authenticated" } };
      }

      await authService.changePassword(
        sessionData.user.id,
        body.currentPassword,
        body.newPassword
      );

      return { success: true };
    },
    { body: changePasswordSchema }
  )
  .delete("/account", async ({ cookie, set }) => {
    const sessionId = cookie[SESSION_COOKIE].value;
    const sessionData = await validateSession(sessionId as string);
    if (!sessionData) {
      set.status = 401;
      return { error: { code: "UNAUTHORIZED", message: "Not authenticated" } };
    }

    await authService.deleteAccount(sessionData.user.id);
    cookie[SESSION_COOKIE].remove();
    return { success: true };
  })
  // Admin Routes
  .get("/admin/users", async ({ cookie, set }) => {
    const sessionId = cookie[SESSION_COOKIE].value;
    const sessionData = await validateSession(sessionId as string);
    if (!sessionData) {
      set.status = 401;
      return { error: { code: "UNAUTHORIZED", message: "Not authenticated" } };
    }

    const usersList = await authService.listUsersByAdmin(sessionData.user.id);
    return { users: usersList };
  })
  .post(
    "/admin/users",
    async ({ body, cookie, set }) => {
      const sessionId = cookie[SESSION_COOKIE].value;
      const sessionData = await validateSession(sessionId as string);
      if (!sessionData) {
        set.status = 401;
        return { error: { code: "UNAUTHORIZED", message: "Not authenticated" } };
      }

      const user = await authService.createUserByAdmin(
        sessionData.user.id,
        body.username,
        body.password,
        body.role
      );

      return { user };
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3 }),
        password: t.String({ minLength: 6 }),
        role: t.Optional(t.String()),
      }),
    }
  )
  .delete("/admin/users/:id", async ({ params, cookie, set }) => {
    const sessionId = cookie[SESSION_COOKIE].value;
    const sessionData = await validateSession(sessionId as string);
    if (!sessionData) {
      set.status = 401;
      return { error: { code: "UNAUTHORIZED", message: "Not authenticated" } };
    }

    await authService.deleteUserByAdmin(sessionData.user.id, params.id);
    return { success: true };
  });

