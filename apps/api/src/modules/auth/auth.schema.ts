import { t } from "elysia";

export const registerSchema = t.Object({
  username: t.String({ minLength: 3, maxLength: 30 }),
  password: t.String({ minLength: 6, maxLength: 100 }),
});

export const loginSchema = t.Object({
  username: t.String(),
  password: t.String(),
});

export const changePasswordSchema = t.Object({
  currentPassword: t.String(),
  newPassword: t.String({ minLength: 6, maxLength: 100 }),
});
