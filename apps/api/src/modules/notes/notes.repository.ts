import { db, rawSqlite } from "../../db";
import { notes, noteTags, tags, noteRevisions } from "../../db/schema";
import { eq, and, isNull, isNotNull, inArray, desc, sql } from "drizzle-orm";
import { syncNoteToFts, deleteNoteFromFts, searchNotesFts } from "../../db/fts";

export class NotesRepository {
  async findById(userId: string, noteId: string) {
    const note = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .get();

    if (!note) return null;

    const attachedTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(noteTags)
      .innerJoin(tags, eq(noteTags.tagId, tags.id))
      .where(eq(noteTags.noteId, noteId))
      .all();

    return {
      ...note,
      tags: attachedTags,
    };
  }

  async findMany(userId: string, options: { status?: string; tagId?: string; search?: string; limit?: number; offset?: number }) {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    let ftsMatchIds: string[] | null = null;
    if (options.search && options.search.trim()) {
      ftsMatchIds = searchNotesFts(userId, options.search);
      if (ftsMatchIds.length === 0) return { items: [], total: 0 };
    }

    const conditions = [eq(notes.userId, userId)];

    if (ftsMatchIds !== null) {
      conditions.push(inArray(notes.id, ftsMatchIds));
    }

    if (options.status === "archived") {
      conditions.push(isNotNull(notes.archivedAt));
      conditions.push(isNull(notes.deletedAt));
    } else if (options.status === "trash") {
      conditions.push(isNotNull(notes.deletedAt));
    } else if (options.status === "all") {
      // no filter on archived or deleted
    } else {
      // default "active"
      conditions.push(isNull(notes.archivedAt));
      conditions.push(isNull(notes.deletedAt));
    }

    if (options.tagId) {
      const notesWithTag = await db
        .select({ noteId: noteTags.noteId })
        .from(noteTags)
        .where(eq(noteTags.tagId, options.tagId))
        .all();
      const ids = notesWithTag.map((nt) => nt.noteId);
      if (ids.length === 0) return { items: [], total: 0 };
      conditions.push(inArray(notes.id, ids));
    }

    const whereClause = and(...conditions);

    const itemsList = await db
      .select()
      .from(notes)
      .where(whereClause)
      .orderBy(desc(notes.updatedAt))
      .limit(limit)
      .offset(offset)
      .all();

    if (itemsList.length === 0) return { items: [], total: 0 };

    const noteIds = itemsList.map((n) => n.id);
    const allNoteTags = await db
      .select({
        noteId: noteTags.noteId,
        id: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(noteTags)
      .innerJoin(tags, eq(noteTags.tagId, tags.id))
      .where(inArray(noteTags.noteId, noteIds))
      .all();

    const tagMap = new Map<string, Array<{ id: string; name: string; color: string }>>();
    for (const item of allNoteTags) {
      if (!tagMap.has(item.noteId)) tagMap.set(item.noteId, []);
      tagMap.get(item.noteId)!.push({ id: item.id, name: item.name, color: item.color });
    }

    const items = itemsList.map((note) => ({
      ...note,
      tags: tagMap.get(note.id) || [],
    }));

    return { items, total: items.length };
  }

  async create(data: { id: string; userId: string; title: string; content: string; tagIds?: string[] }) {
    const now = Date.now();
    await db.insert(notes).values({
      id: data.id,
      userId: data.userId,
      title: data.title,
      content: data.content,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    if (data.tagIds && data.tagIds.length > 0) {
      await this.setTags(data.id, data.tagIds);
    }

    syncNoteToFts({ id: data.id, userId: data.userId, title: data.title, content: data.content });

    // Initial revision snapshot
    await db.insert(noteRevisions).values({
      id: crypto.randomUUID(),
      noteId: data.id,
      userId: data.userId,
      title: data.title,
      content: data.content,
      createdAt: now,
    });

    return this.findById(data.userId, data.id);
  }

  async update(
    userId: string,
    noteId: string,
    data: { title?: string; content?: string; version?: number; tagIds?: string[] }
  ) {
    const current = await this.findById(userId, noteId);
    if (!current) return null;

    // Optional version check for concurrency control
    if (data.version !== undefined && data.version !== current.version) {
      throw new Error("VERSION_MISMATCH");
    }

    const newTitle = data.title !== undefined ? data.title : current.title;
    const newContent = data.content !== undefined ? data.content : current.content;
    const now = Date.now();
    const newVersion = current.version + 1;

    await db
      .update(notes)
      .set({
        title: newTitle,
        content: newContent,
        version: newVersion,
        updatedAt: now,
      })
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

    if (data.tagIds !== undefined) {
      await this.setTags(noteId, data.tagIds);
    }

    syncNoteToFts({ id: noteId, userId, title: newTitle, content: newContent });

    // Throttled Revision Snapshot: check if last revision was >30s ago
    const lastRev = await db
      .select()
      .from(noteRevisions)
      .where(and(eq(noteRevisions.noteId, noteId), eq(noteRevisions.userId, userId)))
      .orderBy(desc(noteRevisions.createdAt))
      .get();

    if (!lastRev || now - lastRev.createdAt >= 30000) {
      await db.insert(noteRevisions).values({
        id: crypto.randomUUID(),
        noteId,
        userId,
        title: newTitle,
        content: newContent,
        createdAt: now,
      });
    }

    return this.findById(userId, noteId);
  }

  async setTags(noteId: string, tagIds: string[]) {
    await db.delete(noteTags).where(eq(noteTags.noteId, noteId));
    if (tagIds.length > 0) {
      await db.insert(noteTags).values(
        tagIds.map((tagId) => ({ noteId, tagId }))
      );
    }
  }

  async setArchiveState(userId: string, noteId: string, archive: boolean) {
    const now = Date.now();
    await db
      .update(notes)
      .set({ archivedAt: archive ? now : null, updatedAt: now })
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
    return this.findById(userId, noteId);
  }

  async setTrashState(userId: string, noteId: string, trash: boolean) {
    const now = Date.now();
    await db
      .update(notes)
      .set({ deletedAt: trash ? now : null, updatedAt: now })
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
    return this.findById(userId, noteId);
  }

  async deletePermanent(userId: string, noteId: string) {
    const note = await this.findById(userId, noteId);
    if (!note) return false;

    await db.delete(notes).where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
    deleteNoteFromFts(noteId);
    return true;
  }
}
