import { TagsRepository } from "./tags.repository";
import { ApiError } from "../../lib/errors";

export class TagsService {
  private repo = new TagsRepository();

  async getTags(userId: string) {
    return await this.repo.findMany(userId);
  }

  async createTag(userId: string, name: string, color?: string) {
    return await this.repo.create(userId, name.trim(), color);
  }

  async updateTag(userId: string, tagId: string, data: { name?: string; color?: string }) {
    const updated = await this.repo.update(userId, tagId, data);
    if (!updated) throw new ApiError("TAG_NOT_FOUND", "Tag not found", 404);
    return updated;
  }

  async deleteTag(userId: string, tagId: string) {
    const ok = await this.repo.delete(userId, tagId);
    if (!ok) throw new ApiError("TAG_NOT_FOUND", "Tag not found", 404);
    return { success: true };
  }
}
