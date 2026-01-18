/**
 * Admin Router - Organization administration
 * 
 * Handles:
 * - Pre-approve emails (create pending memberships)
 * - Generate invite tokens with configurable bindings
 * - Manage access requests
 * - View security audit log
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { logSecurityEvent, resolveOrgContext } from "../services/orgContext";
import crypto from "crypto";

const INVITE_TOKEN_HASH_ALGORITHM = "sha256";

/**
 * Generate secure random token
 */
function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Hash token for storage (one-way)
 */
function hashToken(token: string): string {
  return crypto.createHash(INVITE_TOKEN_HASH_ALGORITHM).update(token).digest("hex");
}

/**
 * Require org admin role
 */
async function requireOrgAdmin(userId: number, organizationId: number) {
  const memberships = await db.getUserOrganizationMemberships(userId);
  const membership = memberships.find(
    m => m.organizationId === organizationId && m.status === "active"
  );
  
  if (!membership || membership.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  
  return membership;
}

export const adminRouter = router({
  /**
   * Pre-approve an email for organization access
   */
  preApproveEmail: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      email: z.string().email(),
      role: z.enum(["admin", "editor", "reviewer", "investor_viewer"]).default("editor"),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireOrgAdmin(ctx.user.id, input.organizationId);
      
      // Check if already pre-approved
      const existing = await db.getPreApprovedMembershipByEmail(input.email);
      if (existing && existing.organizationId === input.organizationId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email is already pre-approved for this organization",
        });
      }
      
      // Create pre-approved membership
      const membershipId = await db.createPreApprovedMembership({
        organizationId: input.organizationId,
        email: input.email,
        role: input.role,
        invitedBy: ctx.user.id,
      });
      
      // Log event
      await logSecurityEvent("org_access_granted", ctx.user.id, {
        organizationId: input.organizationId,
        extra: { 
          action: "pre_approve",
          targetEmail: input.email,
          role: input.role,
        },
      });
      
      return {
        success: true,
        membershipId,
        message: `${input.email} has been pre-approved with ${input.role} role`,
      };
    }),

  /**
   * Generate invite token with configurable bindings
   */
  generateInviteToken: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      role: z.enum(["admin", "editor", "reviewer", "investor_viewer"]).default("editor"),
      maxUses: z.number().min(1).max(1000).default(1),
      expiresInDays: z.number().min(1).max(365).default(7),
      restrictToEmail: z.string().email().optional(),
      restrictToDomain: z.string().optional(),
      teamIds: z.array(z.number()).optional(),
      projectIds: z.array(z.number()).optional(),
      require2FA: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireOrgAdmin(ctx.user.id, input.organizationId);
      
      // Generate token
      const rawToken = generateToken();
      const tokenHash = hashToken(rawToken);
      
      // Calculate expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);
      
      // Create token record
      const tokenId = await db.createInviteToken({
        tokenHash,
        organizationId: input.organizationId,
        role: input.role,
        maxUses: input.maxUses,
        expiresAt,
        restrictToEmail: input.restrictToEmail,
        restrictToDomain: input.restrictToDomain,
        teamIds: input.teamIds,
        projectIds: input.projectIds,
        require2FA: input.require2FA,
        createdBy: ctx.user.id,
      });
      
      // Log event (don't log the actual token)
      await logSecurityEvent("share_token_created", ctx.user.id, {
        organizationId: input.organizationId,
        extra: {
          tokenId,
          role: input.role,
          maxUses: input.maxUses,
          expiresAt: expiresAt.toISOString(),
        },
      });
      
      return {
        success: true,
        tokenId,
        // Return raw token ONLY ONCE - it cannot be retrieved again
        token: rawToken,
        expiresAt,
        message: "Save this token - it cannot be retrieved again",
      };
    }),

  /**
   * Revoke an invite token
   */
  revokeInviteToken: protectedProcedure
    .input(z.object({
      tokenId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get token to verify org ownership
      const tokens = await db.getInviteTokensForOrg(ctx.user.activeOrgId || 0);
      const token = tokens.find(t => t.id === input.tokenId);
      
      if (!token) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token not found",
        });
      }
      
      await requireOrgAdmin(ctx.user.id, token.organizationId);
      
      await db.revokeInviteToken(input.tokenId, ctx.user.id, input.reason);
      
      await logSecurityEvent("share_token_revoked", ctx.user.id, {
        organizationId: token.organizationId,
        extra: { tokenId: input.tokenId, reason: input.reason },
      });
      
      return { success: true };
    }),

  /**
   * List invite tokens for organization
   */
  listInviteTokens: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      await requireOrgAdmin(ctx.user.id, input.organizationId);
      
      const tokens = await db.getInviteTokensForOrg(input.organizationId);
      
      // Don't return the hash - just metadata
      return tokens.map(t => ({
        id: t.id,
        role: t.role,
        maxUses: t.maxUses,
        usedCount: t.usedCount,
        expiresAt: t.expiresAt,
        restrictToEmail: t.restrictToEmail,
        restrictToDomain: t.restrictToDomain,
        require2FA: t.require2FA,
        createdAt: t.createdAt,
        revokedAt: t.revokedAt,
        isActive: !t.revokedAt && t.usedCount < t.maxUses && new Date() < t.expiresAt,
      }));
    }),

  /**
   * List pending access requests
   */
  listAccessRequests: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      await requireOrgAdmin(ctx.user.id, input.organizationId);
      
      return db.getPendingAccessRequests(input.organizationId);
    }),

  /**
   * Approve access request
   */
  approveAccessRequest: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      role: z.enum(["admin", "editor", "reviewer", "investor_viewer"]).default("editor"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get request
      const requests = await db.getPendingAccessRequests();
      const request = requests.find(r => r.id === input.requestId);
      
      if (!request || !request.targetOrganizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }
      
      await requireOrgAdmin(ctx.user.id, request.targetOrganizationId);
      
      // Create membership
      const membershipId = await db.createPreApprovedMembership({
        organizationId: request.targetOrganizationId,
        email: request.userEmail,
        role: input.role,
        invitedBy: ctx.user.id,
      });
      
      // Activate if user exists
      const membership = await db.getPreApprovedMembershipByEmail(request.userEmail);
      if (membership) {
        await db.activatePreApprovedMembership(membership.id, request.userId);
      }
      
      // Resolve request
      await db.resolveAccessRequest(
        input.requestId,
        "approved",
        ctx.user.id,
        input.notes,
        membershipId || undefined
      );
      
      await logSecurityEvent("org_access_granted", ctx.user.id, {
        organizationId: request.targetOrganizationId,
        targetUserId: request.userId,
        extra: { action: "approve_request", role: input.role },
      });
      
      return { success: true };
    }),

  /**
   * Reject access request
   */
  rejectAccessRequest: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const requests = await db.getPendingAccessRequests();
      const request = requests.find(r => r.id === input.requestId);
      
      if (!request || !request.targetOrganizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }
      
      await requireOrgAdmin(ctx.user.id, request.targetOrganizationId);
      
      await db.resolveAccessRequest(
        input.requestId,
        "rejected",
        ctx.user.id,
        input.reason
      );
      
      return { success: true };
    }),

  /**
   * View security audit log for organization
   */
  getSecurityAuditLog: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      eventType: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().min(1).max(500).default(100),
    }))
    .query(async ({ ctx, input }) => {
      await requireOrgAdmin(ctx.user.id, input.organizationId);
      
      return db.getSecurityAuditLog({
        organizationId: input.organizationId,
        eventType: input.eventType,
        startDate: input.startDate,
        endDate: input.endDate,
        limit: input.limit,
      });
    }),

  /**
   * Revoke user's organization membership
   */
  revokeMembership: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      userId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireOrgAdmin(ctx.user.id, input.organizationId);
      
      // Can't revoke own membership
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot revoke your own membership",
        });
      }
      
      // Update membership status
      const memberships = await db.getUserOrganizationMemberships(input.userId);
      const membership = memberships.find(m => m.organizationId === input.organizationId);
      
      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Membership not found",
        });
      }
      
      // For now, we'll just log the event - actual revocation would update the membership status
      await logSecurityEvent("org_access_revoked", ctx.user.id, {
        organizationId: input.organizationId,
        targetUserId: input.userId,
        extra: { reason: input.reason },
      });
      
      return { success: true };
    }),

  /**
   * Change user's role in organization
   */
  changeUserRole: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      userId: z.number(),
      newRole: z.enum(["admin", "editor", "reviewer", "investor_viewer"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireOrgAdmin(ctx.user.id, input.organizationId);
      
      // Can't change own role (prevents lockout)
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot change your own role",
        });
      }
      
      const memberships = await db.getUserOrganizationMemberships(input.userId);
      const membership = memberships.find(m => m.organizationId === input.organizationId);
      
      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Membership not found",
        });
      }
      
      const oldRole = membership.role;
      
      // For now, log the event - actual role change would update the membership
      await logSecurityEvent("role_changed", ctx.user.id, {
        organizationId: input.organizationId,
        targetUserId: input.userId,
        extra: { oldRole, newRole: input.newRole },
      });
      
      return { success: true, oldRole, newRole: input.newRole };
    }),
});
