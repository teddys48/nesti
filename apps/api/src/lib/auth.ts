import { db } from "../db";
import { sessions, users } from "../db/schema";
import { eq, and, gt } from "drizzle-orm";

const SESSION_COOKIE = "notes_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: "argon2id",
    memoryCost: 19456,
    timeCost: 2,
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

export async function createSession(userId: string, userAgent?: string): Promise<{ id: string; expiresAt: number }> {
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_DURATION_MS;

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
    userAgent: userAgent || null,
    createdAt: Date.now(),
  });

  return { id: sessionId, expiresAt };
}

export async function validateSession(sessionId: string) {
  if (!sessionId) return null;

  const now = Date.now();
  const result = await db
    .select({
      session: sessions,
      user: {
        id: users.id,
        username: users.username,
        createdAt: users.createdAt,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
    .get();

  if (!result) return null;
  return result;
}

export async function revokeSession(sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export { SESSION_COOKIE };
