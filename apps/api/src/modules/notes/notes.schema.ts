import { t } from "elysia";

export const createNoteSchema = t.Object({
  title: t.Optional(t.String({ maxLength: 250 })),
  content: t.Optional(t.String()),
  tagIds: t.Optional(t.Array(t.String())),
});

export const updateNoteSchema = t.Object({
  title: t.Optional(t.String({ maxLength: 250 })),
  content: t.Optional(t.String()),
  version: t.Optional(t.Number()),
  tagIds: t.Optional(t.Array(t.String())),
});

export const noteQuerySchema = t.Object({
  status: t.Optional(t.String({ enum: ["active", "archived", "trash", "all"] })),
  tagId: t.Optional(t.String()),
  search: t.Optional(t.String()),
  limit: t.Optional(t.Numeric({ default: 50 })),
  offset: t.Optional(t.Numeric({ default: 0 })),
});
