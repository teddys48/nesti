import { describe, expect, it, beforeAll } from "bun:test";
import { app } from "../src/index";
import { db } from "../src/db";
import { users, sessions, notes, tags, noteTags, noteRevisions } from "../src/db/schema";

describe("Notes API Integration Tests", () => {
  let cookieHeader = "";
  let noteId = "";
  let tagId = "";
  let revisionId = "";

  const testAdmin = {
    username: `admin_${Date.now()}`,
    password: "Password123!",
  };

  const testUser = {
    username: `regular_${Date.now()}`,
    password: "Password123!",
  };

  beforeAll(async () => {
    // Clear test database to start fresh
    await db.delete(noteTags);
    await db.delete(noteRevisions);
    await db.delete(notes);
    await db.delete(tags);
    await db.delete(sessions);
    await db.delete(users);
  });

  it("should return hasUsers false when DB is empty", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/setup-status", { method: "GET" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hasUsers).toBe(false);
  });

  it("should register initial admin user and return session cookie", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testAdmin),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.username).toBe(testAdmin.username.toLowerCase());
    expect(body.user.role).toBe("admin");

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).not.toBeNull();
    cookieHeader = setCookie!.split(";")[0];
  });

  it("should return hasUsers true after admin is registered", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/setup-status", { method: "GET" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hasUsers).toBe(true);
  });

  it("should block public registration after initial setup", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      })
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("REGISTRATION_DISABLED");
  });

  it("should allow admin to create a new user via admin endpoint", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password,
          role: "user",
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.username).toBe(testUser.username.toLowerCase());
    expect(body.user.role).toBe("user");
  });

  it("should list all users for admin", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/admin/users", {
        method: "GET",
        headers: { Cookie: cookieHeader },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.users.length).toBe(2);
  });

  it("should create a tag", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ name: "Work", color: "#ef4444" }),
      })
    );

    expect(res.status).toBe(200);
    const tag = await res.json();
    expect(tag.name).toBe("Work");
    tagId = tag.id;
  });

  it("should create a note with tag attached", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          title: "Initial Note",
          content: "This is test content for SQLite FTS search.",
          tagIds: [tagId],
        }),
      })
    );

    expect(res.status).toBe(200);
    const note = await res.json();
    expect(note.title).toBe("Initial Note");
    expect(note.tags.length).toBe(1);
    noteId = note.id;
  });

  it("should list notes for authenticated user", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/notes", {
        method: "GET",
        headers: { Cookie: cookieHeader },
      })
    );

    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("should update a note and create version snapshot", async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/notes/${noteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          title: "Updated Note Title",
          content: "Updated content for testing autosave.",
        }),
      })
    );

    expect(res.status).toBe(200);
    const note = await res.json();
    expect(note.title).toBe("Updated Note Title");
    expect(note.version).toBe(2);
  });

  it("should search notes using FTS5", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/search?q=autosave", {
        method: "GET",
        headers: { Cookie: cookieHeader },
      })
    );

    expect(res.status).toBe(200);
    const searchResults = await res.json();
    expect(searchResults.length).toBeGreaterThan(0);
  });

  it("should get note revisions list", async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/notes/${noteId}/revisions`, {
        method: "GET",
        headers: { Cookie: cookieHeader },
      })
    );

    expect(res.status).toBe(200);
    const revisions = await res.json();
    expect(revisions.length).toBeGreaterThan(0);
    revisionId = revisions[0].id;
  });

  it("should archive note and then restore it", async () => {
    // Archive
    const archRes = await app.handle(
      new Request(`http://localhost/api/notes/${noteId}/archive`, {
        method: "POST",
        headers: { Cookie: cookieHeader },
      })
    );
    expect(archRes.status).toBe(200);
    const archivedNote = await archRes.json();
    expect(archivedNote.archivedAt).not.toBeNull();

    // Unarchive
    const unarchRes = await app.handle(
      new Request(`http://localhost/api/notes/${noteId}/unarchive`, {
        method: "POST",
        headers: { Cookie: cookieHeader },
      })
    );
    expect(unarchRes.status).toBe(200);
    const restoredNote = await unarchRes.json();
    expect(restoredNote.archivedAt).toBeNull();
  });

  it("should soft delete note to trash and restore", async () => {
    // Trash
    const trashRes = await app.handle(
      new Request(`http://localhost/api/notes/${noteId}`, {
        method: "DELETE",
        headers: { Cookie: cookieHeader },
      })
    );
    expect(trashRes.status).toBe(200);

    // Restore
    const restoreRes = await app.handle(
      new Request(`http://localhost/api/notes/${noteId}/restore`, {
        method: "POST",
        headers: { Cookie: cookieHeader },
      })
    );
    expect(restoreRes.status).toBe(200);
  });
});
