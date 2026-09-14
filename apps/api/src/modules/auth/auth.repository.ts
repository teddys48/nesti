import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

export class AuthRepository {
  async findByUsername(username: string) {
    return await db.select().from(users).where(eq(users.username, username)).get();
  }

  async findById(id: string) {
    return await db.select().from(users).where(eq(users.id, id)).get();
  }

  async createUser(data: { id: string; username: string; passwordHash: string }) {
    const now = Date.now();
    await db.insert(users).values({
      id: data.id,
      username: data.username,
      passwordHash: data.passwordHash,
      createdAt: now,
      updatedAt: now,
    });
    return this.findById(data.id);
  }

  async updatePassword(userId: string, newPasswordHash: string) {
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: Date.now() })
      .where(eq(users.id, userId));
  }

  async deleteUser(userId: string) {
    await db.delete(users).where(eq(users.id, userId));
  }
}
