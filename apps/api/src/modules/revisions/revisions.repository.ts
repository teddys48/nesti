import { db } from "../../db";
import { noteRevisions, notes } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { syncNoteToFts } from "../../db/fts";

export class RevisionsRepository {
  async findByNoteId(userId: string, noteId: string) {
    return await db
      .select()
      .from(noteRevisions)
      .where(and(eq(noteRevisions.noteId, noteId), eq(noteRevisions.userId, userId)))
      .orderBy(desc(noteRevisions.createdAt))
      .all();
  }

  async findById(userId: string, revisionId: string) {
    return await db
      .select()
      .from(noteRevisions)
      .where(and(eq(noteRevisions.id, revisionId), eq(noteRevisions.userId, userId)))
      .get();
  }

  async restoreRevision(userId: string, noteId: string, revisionId: string) {
    const revision = await this.findById(userId, revisionId);
    if (!revision || revision.noteId !== noteId) return null;

    const currentNote = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .get();

    if (!currentNote) return null;

    const now = Date.now();
    const newVersion = currentNote.version + 1;

    await db
      .update(notes)
      .set({
        title: revision.title,
        content: revision.content,
        version: newVersion,
        updatedAt: now,
      })
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

    syncNoteToFts({ id: noteId, userId, title: revision.title, content: revision.content });

    // Save a new revision snapshot representing the restoration event
    await db.insert(noteRevisions).values({
      id: crypto.randomUUID(),
      noteId,
      userId,
      title: revision.title,
      content: revision.content,
      createdAt: now,
    });

    return await db.select().from(notes).where(eq(notes.id, noteId)).get();
  }
}
