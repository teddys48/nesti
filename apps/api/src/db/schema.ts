import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
  userAgent: text("user_agent"),
  createdAt: integer("created_at").notNull(),
}, (table) => [
  index("sessions_user_id_idx").on(table.userId),
]);

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default(""),
  content: text("content").notNull().default(""),
  version: integer("version").notNull().default(1),
  archivedAt: integer("archived_at"),
  deletedAt: integer("deleted_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  index("notes_user_id_idx").on(table.userId),
  index("notes_updated_at_idx").on(table.updatedAt),
  index("notes_deleted_at_idx").on(table.deletedAt),
]);

export const noteRevisions = sqliteTable("note_revisions", {
  id: text("id").primaryKey(),
  noteId: text("note_id").notNull().references(() => notes.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [
  index("note_revisions_note_id_idx").on(table.noteId),
]);

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  index("tags_user_id_idx").on(table.userId),
]);

export const noteTags = sqliteTable("note_tags", {
  noteId: text("note_id").notNull().references(() => notes.id, { onDelete: "cascade" }),
  tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.noteId, table.tagId] }),
  index("note_tags_note_id_idx").on(table.noteId),
  index("note_tags_tag_id_idx").on(table.tagId),
]);
