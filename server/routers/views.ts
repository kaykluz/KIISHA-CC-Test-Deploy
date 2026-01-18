/**
 * View Overlay Router
 * 
 * Handles view scopes, item inclusion/exclusion, and field overrides.
 * Views allow users to create filtered perspectives on data without
 * modifying the underlying records.
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

export const viewsRouter = router({
  // ============ VIEW SCOPES ============
  
  // Create a new view scope
  create: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      viewType: z.enum(["portfolio", "dataroom", "report", "checklist", "custom"]),
      name: z.string().min(1).max(200),
      description: z.string().optional(),
      config: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admin can create views
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can create view scopes" });
      }
      
      const viewScope = await db.createViewScope({
        organizationId: input.organizationId,
        viewType: input.viewType,
        name: input.name,
        description: input.description,
        config: input.config,
        ownerId: ctx.user.id,
      });
      
      await db.createUserActivity({
        userId: ctx.user.id,
        action: "view_scope_created",
        entityType: "view_scope",
        entityId: viewScope?.id ?? 0,
        details: { viewType: input.viewType, name: input.name },
      });
      
      return viewScope;
    }),
  
  // Get view scope by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getViewScopeById(input.id);
    }),
  
  // List view scopes for organization
  listByOrg: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      return db.getViewScopesForOrg(input.organizationId);
    }),
  
  // List view scopes by type
  listByType: protectedProcedure
    .input(z.object({ organizationId: z.number(), viewType: z.string() }))
    .query(async ({ input }) => {
      return db.getViewScopesByType(input.organizationId, input.viewType);
    }),
  
  // Update view scope
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      config: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      // Only admin can update views
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can update view scopes" });
      }
      
      return db.updateViewScope(id, data);
    }),
  
  // Delete view scope
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Only admin can delete views
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete view scopes" });
      }
      
      await db.deleteViewScope(input.id);
      
      await db.createUserActivity({
        userId: ctx.user.id,
        action: "view_scope_deleted",
        entityType: "view_scope",
        entityId: input.id,
      });
      
      return { success: true };
    }),
  
  // ============ VIEW ITEMS (INCLUSION/EXCLUSION) ============
  
  // Remove item from view (exclude)
  excludeItem: protectedProcedure
    .input(z.object({
      viewId: z.number(),
      entityType: z.enum(["asset", "project", "document", "field", "evidence", "task", "rfi", "checklist_item"]),
      entityId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admin/editor can modify views
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can modify view items" });
      }
      
      await db.removeFromView(input.viewId, input.entityType, input.entityId, ctx.user.id, input.reason);
      
      await db.createUserActivity({
        userId: ctx.user.id,
        action: "item_excluded_from_view",
        entityType: input.entityType,
        entityId: input.entityId,
        details: { viewId: input.viewId, reason: input.reason },
      });
      
      return { success: true };
    }),
  
  // Restore item to view (include)
  includeItem: protectedProcedure
    .input(z.object({
      viewId: z.number(),
      entityType: z.enum(["asset", "project", "document", "field", "evidence", "task", "rfi", "checklist_item"]),
      entityId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admin can restore items
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can restore view items" });
      }
      
      await db.restoreToView(input.viewId, input.entityType, input.entityId, ctx.user.id, input.reason);
      
      await db.createUserActivity({
        userId: ctx.user.id,
        action: "item_included_in_view",
        entityType: input.entityType,
        entityId: input.entityId,
        details: { viewId: input.viewId, reason: input.reason },
      });
      
      return { success: true };
    }),
  
  // Get all items in a view
  getItems: protectedProcedure
    .input(z.object({ viewId: z.number(), entityType: z.string().optional() }))
    .query(async ({ input }) => {
      return db.getViewItems(input.viewId, input.entityType);
    }),
  
  // Get excluded items for a view
  getExcludedItems: protectedProcedure
    .input(z.object({ viewId: z.number() }))
    .query(async ({ input }) => {
      return db.getExcludedItemsForView(input.viewId);
    }),
  
  // ============ FIELD OVERRIDES ============
  
  // Hide a field in a view
  hideField: protectedProcedure
    .input(z.object({
      viewId: z.number(),
      assetId: z.number(),
      fieldKey: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admin can hide fields
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can hide fields in views" });
      }
      
      await db.setFieldOverride({
        viewId: input.viewId,
        assetId: input.assetId,
        fieldKey: input.fieldKey,
        state: "hide",
        reason: input.reason,
        updatedBy: ctx.user.id,
      });
      
      // Log to field history
      await db.createFieldHistoryEntry({
        assetId: input.assetId,
        fieldKey: input.fieldKey,
        viewId: input.viewId,
        changeType: "suppressed_in_view",
        changedBy: ctx.user.id,
        reason: input.reason,
      });
      
      return { success: true };
    }),
  
  // Show a hidden field in a view
  showField: protectedProcedure
    .input(z.object({
      viewId: z.number(),
      assetId: z.number(),
      fieldKey: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admin can show fields
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can show fields in views" });
      }
      
      await db.setFieldOverride({
        viewId: input.viewId,
        assetId: input.assetId,
        fieldKey: input.fieldKey,
        state: "show",
        reason: input.reason,
        updatedBy: ctx.user.id,
      });
      
      // Log to field history
      await db.createFieldHistoryEntry({
        assetId: input.assetId,
        fieldKey: input.fieldKey,
        viewId: input.viewId,
        changeType: "restored_in_view",
        changedBy: ctx.user.id,
        reason: input.reason,
      });
      
      return { success: true };
    }),
  
  // Pin a specific version of a field
  pinFieldVersion: protectedProcedure
    .input(z.object({
      viewId: z.number(),
      assetId: z.number(),
      fieldKey: z.string(),
      versionId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admin can pin versions
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can pin field versions" });
      }
      
      await db.setFieldOverride({
        viewId: input.viewId,
        assetId: input.assetId,
        fieldKey: input.fieldKey,
        state: "pin_version",
        specificVersionId: input.versionId,
        reason: input.reason,
        updatedBy: ctx.user.id,
      });
      
      return { success: true };
    }),
  
  // Get field overrides for a view
  getFieldOverrides: protectedProcedure
    .input(z.object({ viewId: z.number(), assetId: z.number().optional() }))
    .query(async ({ input }) => {
      return db.getFieldOverridesForView(input.viewId, input.assetId);
    }),
  
  // Get hidden fields for a view
  getHiddenFields: protectedProcedure
    .input(z.object({ viewId: z.number() }))
    .query(async ({ input }) => {
      return db.getHiddenFieldsForView(input.viewId);
    }),
  
  // ============ VIEW-SCOPED DATA QUERIES ============
  
  // Get assets with classification filters and view overlay applied
  getAssets: protectedProcedure
    .input(z.object({
      viewId: z.number().optional(),
      projectId: z.number().optional(),
      organizationId: z.number().optional(),
      // Classification filters
      assetClassification: z.array(z.string()).optional(),
      configurationProfile: z.array(z.string()).optional(),
      gridConnectionType: z.array(z.string()).optional(),
      componentIncludes: z.array(z.string()).optional(),
      // Pagination
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input }) => {
      return db.getAssetsWithFilters({
        viewId: input.viewId,
        projectId: input.projectId,
        organizationId: input.organizationId,
        assetClassification: input.assetClassification,
        configurationProfile: input.configurationProfile,
        gridConnectionType: input.gridConnectionType,
        componentIncludes: input.componentIncludes,
        limit: input.limit,
        offset: input.offset,
      });
    }),
  
  // Get documents with view overlay applied
  getDocuments: protectedProcedure
    .input(z.object({ viewId: z.number(), projectId: z.number() }))
    .query(async ({ input }) => {
      return db.getDocumentsForView(input.viewId, input.projectId);
    }),
  
  // Get asset attributes with view overlay applied
  getAssetAttributes: protectedProcedure
    .input(z.object({ viewId: z.number(), assetId: z.number() }))
    .query(async ({ input }) => {
      return db.getAssetAttributesForView(input.viewId, input.assetId);
    }),
  
  // ============ FIELD HISTORY ============
  
  // Get field history for an asset
  getFieldHistory: protectedProcedure
    .input(z.object({ 
      assetId: z.number(), 
      fieldKey: z.string().optional(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      return db.getFieldHistory(input.assetId, input.fieldKey, input.limit);
    }),
  
  // Get field history for a specific view
  getFieldHistoryForView: protectedProcedure
    .input(z.object({ 
      viewId: z.number(),
      assetId: z.number(), 
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      return db.getFieldHistoryForView(input.viewId, input.assetId, input.limit);
    }),
  
  // ============ EXPORT MANIFESTS ============
  
  // Create export manifest
  createExportManifest: protectedProcedure
    .input(z.object({
      viewId: z.number(),
      exportType: z.enum(["csv", "excel", "pdf", "due_diligence_pack"]),
      includeHidden: z.boolean().optional().default(false),
      filters: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const manifest = await db.createExportManifest({
        viewId: input.viewId,
        exportType: input.exportType,
        exportedBy: ctx.user.id,
        includeHidden: input.includeHidden,
        filters: input.filters,
        status: "pending",
      });
      
      await db.createUserActivity({
        userId: ctx.user.id,
        action: "export_created",
        entityType: "export_manifest",
        entityId: manifest?.id ?? 0,
        details: { viewId: input.viewId, exportType: input.exportType },
      });
      
      return manifest;
    }),
  
  // Get export manifest by ID
  getExportManifest: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getExportManifestById(input.id);
    }),
  
  // Get export manifests for a view
  getExportManifests: protectedProcedure
    .input(z.object({ viewId: z.number() }))
    .query(async ({ input }) => {
      return db.getExportManifestsForView(input.viewId);
    }),
});
