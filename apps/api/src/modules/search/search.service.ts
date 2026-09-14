import { NotesRepository } from "../notes/notes.repository";

export class SearchService {
  private notesRepo = new NotesRepository();

  async search(userId: string, query: string) {
    if (!query || !query.trim()) return [];
    const result = await this.notesRepo.findMany(userId, {
      search: query,
      status: "all",
      limit: 100,
    });
    return result.items;
  }
}
