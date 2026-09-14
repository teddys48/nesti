import { RevisionsRepository } from "./revisions.repository";
import { ApiError } from "../../lib/errors";

export class RevisionsService {
  private repo = new RevisionsRepository();

  async getRevisions(userId: string, noteId: string) {
    return await this.repo.findByNoteId(userId, noteId);
  }

  async restoreRevision(userId: string, noteId: string, revisionId: string) {
    const updated = await this.repo.restoreRevision(userId, noteId, revisionId);
    if (!updated) {
      throw new ApiError("REVISION_NOT_FOUND", "Revision or note not found", 404);
    }
    return updated;
  }
}
