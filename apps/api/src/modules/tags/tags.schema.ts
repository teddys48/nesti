import { t } from "elysia";

export const createTagSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 50 }),
  color: t.Optional(t.String({ maxLength: 20 })),
});

export const updateTagSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
  color: t.Optional(t.String({ maxLength: 20 })),
});
