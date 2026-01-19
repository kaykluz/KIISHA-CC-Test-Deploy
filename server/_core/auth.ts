/**
 * Local Authentication Module
 * Handles JWT-based authentication for local login and OAuth providers
 */

import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

// JWT payload type for local auth
export type LocalSessionPayload = {
  userId: number;
  email: string;
  organizationId?: number;
  role: string;
};

class LocalAuthService {
  private getSessionSecret() {
    const secret = process.env.JWT_SECRET || "default-secret-change-me";
    return new TextEncoder().encode(secret);
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  /**
   * Create a session token for a local user
   */
  async createSessionToken(payload: {
    userId: number;
    organizationId?: number;
  }): Promise<string> {
    const user = await db.getUserById(payload.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const issuedAt = Date.now();
    const expiresInMs = ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    const jwtPayload: Record<string, unknown> = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: payload.organizationId || user.activeOrgId,
    };

    return new SignJWT(jwtPayload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  /**
   * Verify a session token
   */
  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<LocalSessionPayload | null> {
    if (!cookieValue) {
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });

      const { userId, email, role, organizationId } = payload as Record<string, unknown>;

      if (
        typeof userId !== "number" ||
        typeof email !== "string" ||
        typeof role !== "string"
      ) {
        return null;
      }

      return {
        userId,
        email,
        role,
        organizationId: typeof organizationId === "number" ? organizationId : undefined,
      };
    } catch (error) {
      // Token might be invalid or expired
      return null;
    }
  }

  /**
   * Authenticate a request using local JWT
   */
  async authenticateRequest(req: Request): Promise<User | null> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      return null;
    }

    // Get user from database
    const user = await db.getUserById(session.userId);
    if (!user) {
      return null;
    }

    // Update last signed in
    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: new Date(),
    });

    return user;
  }
}

// Export singleton instance
export const localAuth = new LocalAuthService();

// Re-export the auth namespace for SDK compatibility
export const auth = {
  createSessionToken: (payload: { userId: number; organizationId?: number }) =>
    localAuth.createSessionToken(payload),
};