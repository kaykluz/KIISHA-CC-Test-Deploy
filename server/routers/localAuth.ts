import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import crypto from "crypto";
import { SignJWT } from "jose";

// Password hashing function (using crypto.pbkdf2)
async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ":" + derivedKey.toString("hex"));
    });
  });
}

// Password verification function
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":");
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString("hex"));
    });
  });
}

// Generate JWT token
async function generateToken(userId: number): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret");
  const token = await new SignJWT({
    userId,
    type: "access",
    iat: Math.floor(Date.now() / 1000),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(secret);

  return token;
}

export const localAuthRouter = router({
  // Local signup
  localSignup: publicProcedure
    .input(z.object({
      email: z.string().email().transform(e => e.toLowerCase()),
      password: z.string().min(8, "Password must be at least 8 characters"),
      organizationName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { email, password, organizationName } = input;

      // Check if user already exists
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An account with this email already exists",
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create organization if name provided
      let orgId = 1; // Default org
      if (organizationName) {
        const org = await db.createOrganization({
          name: organizationName,
          slug: organizationName.toLowerCase().replace(/\s+/g, "-"),
        });
        orgId = org.id;
      }

      // Create user
      const user = await db.createUser({
        email,
        passwordHash,
        emailVerified: false,
        role: "admin",
        organizationId: orgId,
      });

      // Generate token
      const token = await generateToken(user.id);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: orgId,
        },
      };
    }),

  // Local login
  localLogin: publicProcedure
    .input(z.object({
      email: z.string().email().transform(e => e.toLowerCase()),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { email, password } = input;

      // Find user
      const user = await db.getUserByEmail(email);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Generate token
      const token = await generateToken(user.id);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        },
      };
    }),

  // Password reset request
  requestPasswordReset: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const { email } = input;

      // Always return success to prevent email enumeration
      const user = await db.getUserByEmail(email);
      if (user) {
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        // Save reset token
        await db.savePasswordResetToken({
          userId: user.id,
          token: resetToken,
          expires: resetExpires,
        });

        // Here you would send an email with the reset link
        // await sendPasswordResetEmail(email, resetToken);
      }

      return {
        success: true,
        message: "If an account exists, a password reset link has been sent",
      };
    }),

  // Password reset
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input }) => {
      const { token, newPassword } = input;

      // Verify token
      const resetRequest = await db.getPasswordResetByToken(token);
      if (!resetRequest || resetRequest.expires < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update user password
      await db.updateUserPassword(resetRequest.userId, passwordHash);

      // Delete used token
      await db.deletePasswordResetToken(token);

      return {
        success: true,
        message: "Password successfully reset",
      };
    }),
});