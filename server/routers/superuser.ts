/**
 * KIISHA Superuser Router
 * 
 * Elevated support mode for KIISHA staff:
 * - Time-boxed elevation with explicit scope
 * - Full audit trail
 * - Org-scoped or global access
 * - Automatic expiry
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { logSecurityEvent, checkSuperuserElevation } from "../services/orgContext";

// Maximum elevation duration
const MAX_ELEVATION_HOURS = 8;
const DEFAULT_ELEVATION_HOURS = 1;

/**
 * Verify caller is a KIISHA superuser
 */
async function requireSuperuser(userId: number) {
  const superusers = await db.getAllOrganizationSuperusers();
  const isSuperuser = superusers.some(s => s.userId === userId);
  
  if (!isSuperuser) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "KIISHA superuser access required",
    });
  }
}

export const superuserRouter = router({
  /**
   * Start elevated support session
   */
  startElevation: protectedProcedure
    .input(z.object({
      reason: z.string().min(10).max(500),
      targetOrganizationId: z.number().optional(),
      scope: z.enum(["global", "organization"]).default("organization"),
      durationHours: z.number().min(0.25).max(MAX_ELEVATION_HOURS).default(DEFAULT_ELEVATION_HOURS),
      canRead: z.boolean().default(true),
      canWrite: z.boolean().default(false),
      canExport: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireSuperuser(ctx.user.id);
      
      // Check for existing active elevation
      const existing = await db.getActiveSuperuserElevation(ctx.user.id);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have an active elevation. End it first.",
        });
      }
      
      // Validate organization scope requires org ID
      if (input.scope === "organization" && !input.targetOrganizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organization ID required for org-specific scope",
        });
      }
      
      // Calculate expiry
      const startedAt = new Date();
      const expiresAt = new Date(startedAt.getTime() + input.durationHours * 60 * 60 * 1000);
      
      // Create elevation
      const elevationId = await db.createSuperuserElevation({
        userId: ctx.user.id,
        targetOrganizationId: input.targetOrganizationId,
        scope: input.scope,
        reason: input.reason,
        canRead: input.canRead,
        canWrite: input.canWrite,
        canExport: input.canExport,
        startedAt,
        expiresAt,
        status: "active",
      });
      
      // Log elevation start
      await logSecurityEvent("elevation_started", ctx.user.id, {
        targetOrganizationId: input.targetOrganizationId,
        elevationId: elevationId || undefined,
        elevationReason: input.reason,
        extra: {
          scope: input.scope,
          durationHours: input.durationHours,
          canRead: input.canRead,
          canWrite: input.canWrite,
          canExport: input.canExport,
        },
      });
      
      return {
        success: true,
        elevationId,
        expiresAt,
        message: `Elevation active until ${expiresAt.toISOString()}`,
      };
    }),

  /**
   * End elevated support session
   */
  endElevation: protectedProcedure
    .input(z.object({
      elevationId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireSuperuser(ctx.user.id);
      
      // Get active elevation
      const elevation = await db.getActiveSuperuserElevation(ctx.user.id);
      
      if (!elevation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active elevation found",
        });
      }
      
      // End elevation
      await db.endSuperuserElevation(elevation.id);
      
      // Log elevation end
      await logSecurityEvent("elevation_ended", ctx.user.id, {
        targetOrganizationId: elevation.targetOrganizationId || undefined,
        elevationId: elevation.id,
        extra: {
          reason: "manual_end",
          durationMinutes: Math.round(
            (Date.now() - elevation.startedAt.getTime()) / 60000
          ),
        },
      });
      
      return { success: true };
    }),

  /**
   * Get current elevation status
   */
  getElevationStatus: protectedProcedure.query(async ({ ctx }) => {
    await requireSuperuser(ctx.user.id);
    
    const elevation = await db.getActiveSuperuserElevation(ctx.user.id);
    
    if (!elevation) {
      return {
        isElevated: false,
      };
    }
    
    return {
      isElevated: true,
      elevation: {
        id: elevation.id,
        scope: elevation.scope,
        targetOrganizationId: elevation.targetOrganizationId,
        reason: elevation.reason,
        canRead: elevation.canRead,
        canWrite: elevation.canWrite,
        canExport: elevation.canExport,
        startedAt: elevation.startedAt,
        expiresAt: elevation.expiresAt,
        remainingMinutes: Math.max(
          0,
          Math.round((elevation.expiresAt.getTime() - Date.now()) / 60000)
        ),
      },
    };
  }),

  /**
   * View org data with elevation (read-only)
   */
  viewOrgData: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      dataType: z.enum(["users", "projects", "documents", "audit_log"]),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      await requireSuperuser(ctx.user.id);
      
      // Check elevation
      const { isElevated, elevation } = await checkSuperuserElevation(
        ctx.user.id,
        input.organizationId
      );
      
      if (!isElevated) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Elevation required to view org data",
        });
      }
      
      if (!elevation?.canRead) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Read permission not granted in current elevation",
        });
      }
      
      // Log the access
      await logSecurityEvent("elevated_data_access", ctx.user.id, {
        organizationId: input.organizationId,
        elevationId: elevation.id,
        extra: {
          dataType: input.dataType,
          limit: input.limit,
        },
      });
      
      // Return data based on type
      switch (input.dataType) {
        case "users": {
          // Get org members
          const members = await db.getOrganizationMemberships(input.organizationId);
          return {
            dataType: "users",
            count: members.length,
            data: members.slice(0, input.limit),
          };
        }
        case "projects": {
          const projects = await db.getAllProjects();
          const orgProjects = projects.filter(p => p.organizationId === input.organizationId);
          return {
            dataType: "projects",
            count: orgProjects.length,
            data: orgProjects.slice(0, input.limit),
          };
        }
        case "audit_log": {
          const logs = await db.getSecurityAuditLog({
            organizationId: input.organizationId,
            limit: input.limit,
          });
          return {
            dataType: "audit_log",
            count: logs.length,
            data: logs,
          };
        }
        default:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unsupported data type",
          });
      }
    }),

  /**
   * List all KIISHA superusers (admin only)
   */
  listSuperusers: protectedProcedure.query(async ({ ctx }) => {
    // Only existing superusers can list other superusers
    await requireSuperuser(ctx.user.id);
    
    const superusers = await db.getAllOrganizationSuperusers();
    
    return superusers.map(s => ({
      id: s.id,
      userId: s.userId,
      organizationId: s.organizationId,
      grantedBy: s.grantedBy,
      grantedAt: s.grantedAt,
    }));
  }),

  /**
   * Get elevation history for audit
   */
  getElevationHistory: protectedProcedure
    .input(z.object({
      userId: z.number().optional(),
      organizationId: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().min(1).max(500).default(100),
    }))
    .query(async ({ ctx, input }) => {
      await requireSuperuser(ctx.user.id);
      
      // Get elevation events from security audit log
      const logs = await db.getSecurityAuditLog({
        userId: input.userId,
        organizationId: input.organizationId,
        eventType: "elevation_started",
        startDate: input.startDate,
        endDate: input.endDate,
        limit: input.limit,
      });
      
      return logs;
    }),
});
