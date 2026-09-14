import { AuthRepository } from "./auth.repository";
import { hashPassword, verifyPassword, createSession, revokeSession } from "../../lib/auth";
import { ApiError } from "../../lib/errors";

export class AuthService {
  private repo = new AuthRepository();

  async getUserCount(): Promise<number> {
    return await this.repo.countUsers();
  }

  async register(username: string, password: string, userAgent?: string) {
    const totalUsers = await this.repo.countUsers();
    if (totalUsers > 0) {
      throw new ApiError("REGISTRATION_DISABLED", "Public registration is disabled. Contact an administrator.", 403);
    }

    const existing = await this.repo.findByUsername(username.toLowerCase().trim());
    if (existing) {
      throw new ApiError("USERNAME_TAKEN", "Username is already taken", 409);
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    // First user is auto-admin
    const user = await this.repo.createUser({
      id: userId,
      username: username.toLowerCase().trim(),
      passwordHash,
      role: "admin",
    });

    const session = await createSession(userId, userAgent);
    return {
      user: { id: user!.id, username: user!.username, role: user!.role },
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
      user: { id: user.id, username: user.username, role: user.role },
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
      throw new ApiError("USER_NOT_FOUND", "User not found", 404);
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

  // Admin Management Methods
  private async ensureAdmin(adminUserId: string) {
    const admin = await this.repo.findById(adminUserId);
    if (!admin || admin.role !== "admin") {
      throw new ApiError("FORBIDDEN", "Admin privileges required", 403);
    }
  }

  async listUsersByAdmin(adminUserId: string) {
    await this.ensureAdmin(adminUserId);
    return await this.repo.findAllUsers();
  }

  async createUserByAdmin(adminUserId: string, username: string, password: string, role = "user") {
    await this.ensureAdmin(adminUserId);

    const existing = await this.repo.findByUsername(username.toLowerCase().trim());
    if (existing) {
      throw new ApiError("USERNAME_TAKEN", "Username is already taken", 409);
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const newUser = await this.repo.createUser({
      id: userId,
      username: username.toLowerCase().trim(),
      passwordHash,
      role: role === "admin" ? "admin" : "user",
    });

    return { id: newUser!.id, username: newUser!.username, role: newUser!.role };
  }

  async deleteUserByAdmin(adminUserId: string, targetUserId: string) {
    await this.ensureAdmin(adminUserId);
    if (adminUserId === targetUserId) {
      throw new ApiError("CANNOT_DELETE_SELF", "Admin cannot delete their own account via user management", 400);
    }
    await this.repo.deleteUser(targetUserId);
  }
}
