import { NotesRepository } from "./notes.repository";
import { ApiError } from "../../lib/errors";

export class NotesService {
  private repo = new NotesRepository();

  async getNotes(userId: string, options: { status?: string; tagId?: string; search?: string; limit?: number; offset?: number }) {
    return await this.repo.findMany(userId, options);
  }

  async getNote(userId: string, noteId: string) {
    const note = await this.repo.findById(userId, noteId);
    if (!note) {
      throw new ApiError("NOTE_NOT_FOUND", "Note not found", 404);
    }
    return note;
  }

  async createNote(userId: string, data: { title?: string; content?: string; tagIds?: string[] }) {
    const id = crypto.randomUUID();
    return await this.repo.create({
      id,
      userId,
      title: data.title || "Untitled Note",
      content: data.content || "",
      tagIds: data.tagIds,
    });
  }

  async updateNote(userId: string, noteId: string, data: { title?: string; content?: string; version?: number; tagIds?: string[] }) {
    try {
      const updated = await this.repo.update(userId, noteId, data);
      if (!updated) {
        throw new ApiError("NOTE_NOT_FOUND", "Note not found", 404);
      }
      return updated;
    } catch (err: any) {
      if (err.message === "VERSION_MISMATCH") {
        throw new ApiError("VERSION_CONFLICT", "Note has been modified by another session", 409);
      }
      throw err;
    }
  }

  async archiveNote(userId: string, noteId: string) {
    const updated = await this.repo.setArchiveState(userId, noteId, true);
    if (!updated) throw new ApiError("NOTE_NOT_FOUND", "Note not found", 404);
    return updated;
  }

  async unarchiveNote(userId: string, noteId: string) {
    const updated = await this.repo.setArchiveState(userId, noteId, false);
    if (!updated) throw new ApiError("NOTE_NOT_FOUND", "Note not found", 404);
    return updated;
  }

  async trashNote(userId: string, noteId: string) {
    const updated = await this.repo.setTrashState(userId, noteId, true);
    if (!updated) throw new ApiError("NOTE_NOT_FOUND", "Note not found", 404);
    return updated;
  }

  async restoreNote(userId: string, noteId: string) {
    const updated = await this.repo.setTrashState(userId, noteId, false);
    if (!updated) throw new ApiError("NOTE_NOT_FOUND", "Note not found", 404);
    return updated;
  }

  async deletePermanent(userId: string, noteId: string) {
    const ok = await this.repo.deletePermanent(userId, noteId);
    if (!ok) throw new ApiError("NOTE_NOT_FOUND", "Note not found", 404);
    return { success: true };
  }
}
