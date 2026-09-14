import { db } from "../../db";
import { users } from "../../db/schema";
import { eq, count } from "drizzle-orm";

export class AuthRepository {
  async findByUsername(username: string) {
    return await db.select().from(users).where(eq(users.username, username)).get();
  }

  async findById(id: string) {
    return await db.select().from(users).where(eq(users.id, id)).get();
  }

  async countUsers(): Promise<number> {
    const res = await db.select({ value: count() }).from(users).get();
    return res?.value || 0;
  }

  async findAllUsers() {
    return await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .all();
  }

  async createUser(data: { id: string; username: string; passwordHash: string; role?: string }) {
    const now = Date.now();
    await db.insert(users).values({
      id: data.id,
      username: data.username,
      passwordHash: data.passwordHash,
      role: data.role || "user",
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
