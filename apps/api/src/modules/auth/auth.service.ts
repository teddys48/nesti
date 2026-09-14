import { AuthRepository } from "./auth.repository";
import { hashPassword, verifyPassword, createSession, revokeSession } from "../../lib/auth";
import { ApiError } from "../../lib/errors";

export class AuthService {
  private repo = new AuthRepository();

  async register(username: string, password: string, userAgent?: string) {
    const existing = await this.repo.findByUsername(username.toLowerCase().trim());
    if (existing) {
      throw new ApiError("USERNAME_TAKEN", "Username is already taken", 409);
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const user = await this.repo.createUser({
      id: userId,
      username: username.toLowerCase().trim(),
      passwordHash,
    });

    const session = await createSession(userId, userAgent);
    return {
      user: { id: user!.id, username: user!.username },
      sessionId: session.id,
      expiresAt: session.expiresAt,
    };
  }

  async login(username: string, password: string, userAgent?: string) {
    const user = await this.repo.findByUsername(username.toLowerCase().trim());
    if (!user) {
      throw new ApiError("INVALID_CREDENTIALS", "Invalid username or password", 401);
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new ApiError("INVALID_CREDENTIALS", "Invalid username or password", 401);
    }

    const session = await createSession(user.id, userAgent);
    return {
      user: { id: user.id, username: user.username },
      sessionId: session.id,
      expiresAt: session.expiresAt,
    };
  }

  async logout(sessionId: string) {
    await revokeSession(sessionId);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new ApiError("USER_NOT_FOUND", "User not found", 440);
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ApiError("INVALID_PASSWORD", "Current password is incorrect", 400);
    }

    const newHash = await hashPassword(newPassword);
    await this.repo.updatePassword(userId, newHash);
  }

  async deleteAccount(userId: string) {
    await this.repo.deleteUser(userId);
  }
}
