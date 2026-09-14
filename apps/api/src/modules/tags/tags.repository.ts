import { db } from "../../db";
import { tags } from "../../db/schema";
import { eq, and, asc } from "drizzle-orm";

export class TagsRepository {
  async findMany(userId: string) {
    return await db
      .select()
      .from(tags)
      .where(eq(tags.userId, userId))
      .orderBy(asc(tags.name))
      .all();
  }

  async findById(userId: string, tagId: string) {
    return await db
      .select()
      .from(tags)
      .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
      .get();
  }

  async create(userId: string, name: string, color?: string) {
    const id = crypto.randomUUID();
    const now = Date.now();

    await db.insert(tags).values({
      id,
      userId,
      name,
      color: color || "#3b82f6",
      createdAt: now,
      updatedAt: now,
    });

    return this.findById(userId, id);
  }

  async update(userId: string, tagId: string, data: { name?: string; color?: string }) {
    const existing = await this.findById(userId, tagId);
    if (!existing) return null;

    const now = Date.now();
    await db
      .update(tags)
      .set({
        name: data.name !== undefined ? data.name : existing.name,
        color: data.color !== undefined ? data.color : existing.color,
        updatedAt: now,
      })
      .where(and(eq(tags.id, tagId), eq(tags.userId, userId)));

    return this.findById(userId, tagId);
  }

  async delete(userId: string, tagId: string) {
    const existing = await this.findById(userId, tagId);
    if (!existing) return false;

    await db.delete(tags).where(and(eq(tags.id, tagId), eq(tags.userId, userId)));
    return true;
  }
}
