import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean, date, bigint, uniqueIndex, index, unique } from "drizzle-orm/mysql-core";

// Core user table backing auth flow
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }), // For local auth
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  userType: mysqlEnum("userType", ["operations_manager", "field_coordinator", "portfolio_manager", "investor", "technical_advisor"]).default("operations_manager"),
  organization: varchar("organization", { length: 255 }),
  avatarUrl: text("avatarUrl"),
  totpSecret: varchar("totpSecret", { length: 64 }), // For 2FA
  totpEnabled: boolean("totpEnabled").default(false),
  onboardingStatus: mysqlEnum("onboardingStatus", ["not_started", "in_progress", "completed", "skipped"]).default("not_started"),
  onboardingStep: int("onboardingStep").default(0),
  
  // Active organization context for session scoping
  activeOrgId: int("activeOrgId"), // Currently selected organization
  
  // Email verification
  emailVerified: boolean("emailVerified").default(false),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  emailVerificationToken: varchar("emailVerificationToken", { length: 64 }),
  emailVerificationExpires: timestamp("emailVerificationExpires"),
  notificationPreferences: json("notificationPreferences").$type<{
    emailDocuments: boolean;
    emailRfis: boolean;
    emailAlerts: boolean;
    emailReports: boolean;
    inAppDocuments: boolean;
    inAppRfis: boolean;
    inAppAlerts: boolean;
    digestFrequency: "realtime" | "daily" | "weekly";
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Organizations for multi-tenancy
// Hard tenant isolation - all data queries must be scoped by organizationId
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  
  // Subdomain slug for tenant routing (e.g., "acme" -> acme.kiisha.io)
  slug: varchar("slug", { length: 50 }).unique(),
  
  // Branding
  description: text("description"),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 7 }), // Hex color
  
  // Security settings
  require2FA: boolean("require2FA").default(false).notNull(),
  allowedEmailDomains: json("allowedEmailDomains").$type<string[]>(), // Domain allowlist for signup
  signupMode: mysqlEnum("signupMode", ["invite_only", "domain_allowlist", "open"]).default("invite_only").notNull(),
  
  // Status
  status: mysqlEnum("status", ["active", "suspended", "archived"]).default("active").notNull(),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// Organization memberships with roles
// Supports pre-approval: admin creates membership before user signs up
export const organizationMembers = mysqlTable("organizationMembers", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId"), // Nullable for pre-approved memberships (linked after signup)
  
  // Pre-approval fields
  preApprovedEmail: varchar("preApprovedEmail", { length: 320 }), // Email pre-approved before signup
  preApprovedPhone: varchar("preApprovedPhone", { length: 20 }), // Phone pre-approved
  
  // Role and status
  role: mysqlEnum("role", ["admin", "editor", "reviewer", "investor_viewer"]).default("editor").notNull(),
  status: mysqlEnum("status", ["pending", "active", "suspended", "removed"]).default("pending").notNull(),
  
  // Invite tracking
  invitedBy: int("invitedBy"), // Admin who created the membership
  invitedAt: timestamp("invitedAt"),
  acceptedAt: timestamp("acceptedAt"), // When user completed signup
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMember = typeof organizationMembers.$inferInsert;

// Portfolios - collections of projects
export const portfolios = mysqlTable("portfolios", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  region: varchar("region", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;

// Project memberships with roles
export const projectMembers = mysqlTable("projectMembers", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["admin", "editor", "reviewer", "investor_viewer"]).default("editor").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = typeof projectMembers.$inferInsert;

// Projects - THE PRIMARY ASSET ENTITY (investable project-level units)
// Asset = Project/Site-level investable unit (e.g., "UMZA Oil Mill Solar+BESS")
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  organizationId: int("organizationId"),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),
  
  // Location
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Nigeria"),
  city: varchar("city", { length: 100 }),
  latitude: decimal("latitude", { precision: 10, scale: 6 }),
  longitude: decimal("longitude", { precision: 10, scale: 6 }),
  address: text("address"),
  timezone: varchar("timezone", { length: 50 }).default("Africa/Lagos"),
  
  // Technology & Capacity
  technology: mysqlEnum("technology", ["PV", "BESS", "PV+BESS", "Wind", "Minigrid", "C&I"]).default("PV"),
  capacityMw: decimal("capacityMw", { precision: 10, scale: 2 }),
  capacityMwh: decimal("capacityMwh", { precision: 10, scale: 2 }),
  
  // Lifecycle Status
  status: mysqlEnum("status", ["prospecting", "development", "construction", "operational", "decommissioned"]).default("development"),
  stage: mysqlEnum("stage", [
    "origination", "feasibility", "development", "due_diligence", 
    "ntp", "construction", "commissioning", "cod", "operations"
  ]).default("feasibility"),
  
  // Asset Classification (project-level classification for filtering and requirements)
  assetClassification: mysqlEnum("assetClassification", [
    "residential", "small_commercial", "large_commercial", "industrial",
    "mini_grid", "mesh_grid", "interconnected_mini_grids", "grid_connected"
  ]),
  gridConnectionType: mysqlEnum("gridConnectionType", [
    "grid_tied", "islanded", "islandable", "weak_grid", "no_grid"
  ]),
  configurationProfile: mysqlEnum("configurationProfile", [
    "solar_only", "solar_bess", "solar_genset", "solar_bess_genset", 
    "bess_only", "genset_only", "hybrid"
  ]),
  // Coupling Topology: Electrical coupling architecture for hybrid assets
  // AC_COUPLED: AC bus coupling (inverters connect at AC side)
  // DC_COUPLED: DC bus coupling (components share DC bus before inversion)
  // HYBRID_COUPLED: Mixed AC and DC coupling
  couplingTopology: mysqlEnum("couplingTopology", [
    "AC_COUPLED", "DC_COUPLED", "HYBRID_COUPLED", "UNKNOWN", "NOT_APPLICABLE"
  ]),
  // Distribution Topology: Network shape for minigrids/mesh grids only
  // Only relevant for assetClassification: mini_grid, mesh_grid, interconnected_mini_grids
  distributionTopology: mysqlEnum("distributionTopology", [
    "RADIAL", "RING", "MESH", "STAR", "TREE", "UNKNOWN", "NOT_APPLICABLE"
  ]),
  // Legacy field - kept for backward compatibility, will be migrated
  networkTopology: mysqlEnum("networkTopology", ["radial", "ring", "mesh", "star", "unknown"]),
  
  // Off-taker / Customer
  offtakerName: varchar("offtakerName", { length: 255 }),
  offtakerType: mysqlEnum("offtakerType", [
    "industrial", "commercial", "utility", "community", "residential_aggregate"
  ]),
  contractType: mysqlEnum("contractType", ["ppa", "lease", "esco", "direct_sale", "captive"]),
  
  // Financial
  projectValueUsd: decimal("projectValueUsd", { precision: 14, scale: 2 }),
  tariffUsdKwh: decimal("tariffUsdKwh", { precision: 8, scale: 4 }),
  
  // Dates
  codDate: date("codDate"),
  ppaStartDate: date("ppaStartDate"),
  ppaEndDate: date("ppaEndDate"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// Document categories
export const documentCategories = mysqlTable("documentCategories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  sortOrder: int("sortOrder").default(0),
});

export type DocumentCategory = typeof documentCategories.$inferSelect;

// Document types within categories
export const documentTypes = mysqlTable("documentTypes", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  description: text("description"),
  required: boolean("required").default(false),
  sortOrder: int("sortOrder").default(0),
});

export type DocumentType = typeof documentTypes.$inferSelect;

// Documents
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  documentTypeId: int("documentTypeId").notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 500 }),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"),
  status: mysqlEnum("status", ["verified", "pending", "missing", "na", "rejected", "unverified"]).default("unverified"),
  version: int("version").default(1),
  uploadedById: int("uploadedById"),
  notes: text("notes"),
  tags: json("tags").$type<string[]>(),
  aiCategorySuggestion: varchar("aiCategorySuggestion", { length: 255 }),
  aiCategoryConfidence: decimal("aiCategoryConfidence", { precision: 3, scale: 2 }),
  isInternalOnly: boolean("isInternalOnly").default(false),
  
  // Soft-delete / immutability fields
  visibilityState: mysqlEnum("visibilityState", ["active", "archived", "superseded"]).default("active").notNull(),
  archivedAt: timestamp("archivedAt"),
  archivedBy: int("archivedBy"),
  archiveReason: text("archiveReason"),
  supersededById: int("supersededById"), // Document that supersedes this one
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// Document versions for tracking history
export const documentVersions = mysqlTable("documentVersions", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  version: int("version").notNull(),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 500 }),
  uploadedById: int("uploadedById"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentVersion = typeof documentVersions.$inferSelect;

// Reviewer groups for document approvals
export const reviewerGroups = mysqlTable("reviewerGroups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: mysqlEnum("code", ["legal", "technical", "finance"]).notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0),
});

export type ReviewerGroup = typeof reviewerGroups.$inferSelect;

// Document reviewer assignments and approvals
export const documentReviews = mysqlTable("documentReviews", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  reviewerGroupId: int("reviewerGroupId").notNull(),
  reviewerId: int("reviewerId"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "needs_revision"]).default("pending").notNull(),
  notes: text("notes"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DocumentReview = typeof documentReviews.$inferSelect;
export type InsertDocumentReview = typeof documentReviews.$inferInsert;

// RFIs / Action Items
export const rfis = mysqlTable("rfis", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  code: varchar("code", { length: 50 }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  notes: text("notes"),
  category: varchar("category", { length: 100 }),
  tags: json("tags").$type<string[]>(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium"),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open"),
  itemType: mysqlEnum("itemType", ["rfi", "task", "risk", "issue"]).default("rfi"),
  assigneeId: int("assigneeId"),
  submittedById: int("submittedById"),
  dueDate: date("dueDate"),
  resolvedAt: timestamp("resolvedAt"),
  isInternalOnly: boolean("isInternalOnly").default(false),
  
  // Soft-delete / immutability fields
  visibilityState: mysqlEnum("visibilityState", ["active", "archived", "superseded"]).default("active").notNull(),
  archivedAt: timestamp("archivedAt"),
  archivedBy: int("archivedBy"),
  archiveReason: text("archiveReason"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Rfi = typeof rfis.$inferSelect;
export type InsertRfi = typeof rfis.$inferInsert;

// RFI Comments
export const rfiComments = mysqlTable("rfiComments", {
  id: int("id").autoincrement().primaryKey(),
  rfiId: int("rfiId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  isInternalOnly: boolean("isInternalOnly").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RfiComment = typeof rfiComments.$inferSelect;
export type InsertRfiComment = typeof rfiComments.$inferInsert;

// RFI linked documents
export const rfiDocuments = mysqlTable("rfiDocuments", {
  id: int("id").autoincrement().primaryKey(),
  rfiId: int("rfiId").notNull(),
  documentId: int("documentId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
}, (table) => ({
  rfiDocumentUnique: uniqueIndex("rfi_document_unique").on(table.rfiId, table.documentId),
}));

export type RfiDocument = typeof rfiDocuments.$inferSelect;

// RFI linked checklist items
export const rfiChecklistLinks = mysqlTable("rfiChecklistLinks", {
  id: int("id").autoincrement().primaryKey(),
  rfiId: int("rfiId").notNull(),
  checklistItemId: int("checklistItemId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
}, (table) => ({
  rfiChecklistUnique: uniqueIndex("rfi_checklist_unique").on(table.rfiId, table.checklistItemId),
}));

export type RfiChecklistLink = typeof rfiChecklistLinks.$inferSelect;

// RFI linked schedule items
export const rfiScheduleLinks = mysqlTable("rfiScheduleLinks", {
  id: int("id").autoincrement().primaryKey(),
  rfiId: int("rfiId").notNull(),
  scheduleItemId: int("scheduleItemId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
}, (table) => ({
  rfiScheduleUnique: uniqueIndex("rfi_schedule_unique").on(table.rfiId, table.scheduleItemId),
}));

export type RfiScheduleLink = typeof rfiScheduleLinks.$inferSelect;

// Asset details - key-value store for project attributes
export const assetDetails = mysqlTable("assetDetails", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  fieldName: varchar("fieldName", { length: 255 }).notNull(),
  fieldValue: text("fieldValue"),
  unit: varchar("unit", { length: 50 }),
  isAiExtracted: boolean("isAiExtracted").default(false),
  aiConfidence: decimal("aiConfidence", { precision: 3, scale: 2 }),
  sourceDocumentId: int("sourceDocumentId"),
  sourcePage: int("sourcePage"),
  sourceTextSnippet: text("sourceTextSnippet"),
  extractedAt: timestamp("extractedAt"),
  isVerified: boolean("isVerified").default(false),
  verifiedById: int("verifiedById"),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssetDetail = typeof assetDetails.$inferSelect;
export type InsertAssetDetail = typeof assetDetails.$inferInsert;

// Schedule phases
export const schedulePhases = mysqlTable("schedulePhases", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  sortOrder: int("sortOrder").default(0),
});

export type SchedulePhase = typeof schedulePhases.$inferSelect;

// Schedule items
export const scheduleItems = mysqlTable("scheduleItems", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  phaseId: int("phaseId").notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  startDate: date("startDate"),
  endDate: date("endDate"),
  targetEndDate: date("targetEndDate"),
  duration: int("duration"),
  progress: int("progress").default(0),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed", "overdue", "blocked"]).default("not_started"),
  dependencies: json("dependencies").$type<number[]>(),
  assigneeId: int("assigneeId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduleItem = typeof scheduleItems.$inferSelect;
export type InsertScheduleItem = typeof scheduleItems.$inferInsert;

// AI Extractions - for document detail extraction with full traceability
export const aiExtractions = mysqlTable("aiExtractions", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  fieldName: varchar("fieldName", { length: 255 }).notNull(),
  extractedValue: text("extractedValue"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  sourcePage: int("sourcePage"),
  sourceTextSnippet: text("sourceTextSnippet"),
  boundingBox: json("boundingBox").$type<{ page: number; x: number; y: number; width: number; height: number }>(),
  status: mysqlEnum("status", ["unverified", "pending", "accepted", "rejected"]).default("unverified"),
  extractedAt: timestamp("extractedAt").defaultNow().notNull(),
  reviewedById: int("reviewedById"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiExtraction = typeof aiExtractions.$inferSelect;
export type InsertAiExtraction = typeof aiExtractions.$inferInsert;

// Transaction / Closing Checklist
export const closingChecklists = mysqlTable("closingChecklists", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  transactionType: mysqlEnum("transactionType", ["acquisition", "financing", "sale", "development"]).default("acquisition"),
  targetCloseDate: date("targetCloseDate"),
  status: mysqlEnum("status", ["draft", "active", "completed", "cancelled"]).default("draft"),
  createdById: int("createdById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClosingChecklist = typeof closingChecklists.$inferSelect;
export type InsertClosingChecklist = typeof closingChecklists.$inferInsert;

// Closing Checklist Items
export const closingChecklistItems = mysqlTable("closingChecklistItems", {
  id: int("id").autoincrement().primaryKey(),
  checklistId: int("checklistId").notNull(),
  category: varchar("category", { length: 100 }),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  ownerId: int("ownerId"),
  status: mysqlEnum("status", ["not_started", "in_progress", "pending_review", "completed", "blocked", "na"]).default("not_started"),
  dueDate: date("dueDate"),
  completedAt: timestamp("completedAt"),
  comments: text("comments"),
  sortOrder: int("sortOrder").default(0),
  isRequired: boolean("isRequired").default(true),
  
  // Soft-delete / immutability fields
  visibilityState: mysqlEnum("visibilityState", ["active", "archived", "superseded"]).default("active").notNull(),
  archivedAt: timestamp("archivedAt"),
  archivedBy: int("archivedBy"),
  archiveReason: text("archiveReason"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClosingChecklistItem = typeof closingChecklistItems.$inferSelect;
export type InsertClosingChecklistItem = typeof closingChecklistItems.$inferInsert;

// Checklist item linked documents
export const checklistItemDocuments = mysqlTable("checklistItemDocuments", {
  id: int("id").autoincrement().primaryKey(),
  checklistItemId: int("checklistItemId").notNull(),
  documentId: int("documentId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
}, (table) => ({
  checklistDocumentUnique: uniqueIndex("checklist_document_unique").on(table.checklistItemId, table.documentId),
}));

export type ChecklistItemDocument = typeof checklistItemDocuments.$inferSelect;

// Alerts / Notifications
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  projectId: int("projectId"),
  type: mysqlEnum("type", ["document", "rfi", "schedule", "checklist", "approval", "system"]).default("system"),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  linkType: varchar("linkType", { length: 50 }),
  linkId: int("linkId"),
  isRead: boolean("isRead").default(false),
  isDismissed: boolean("isDismissed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

// Diligence tracking
export const diligenceProgress = mysqlTable("diligenceProgress", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  category: mysqlEnum("category", ["technical", "commercial", "legal"]).notNull(),
  totalItems: int("totalItems").default(0),
  completedItems: int("completedItems").default(0),
  verifiedItems: int("verifiedItems").default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DiligenceProgress = typeof diligenceProgress.$inferSelect;

// Audit log for traceability
export const auditLog = mysqlTable("auditLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  entityId: int("entityId"),
  oldValue: json("oldValue"),
  newValue: json("newValue"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;


// ═══════════════════════════════════════════════════════════════
// PRINCIPLE 1: INGEST ANYTHING (Universal Capture)
// ═══════════════════════════════════════════════════════════════

// Ingested files - universal file storage
export const ingestedFiles = mysqlTable("ingestedFiles", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  projectId: int("projectId"),
  siteId: int("siteId"),
  originalFilename: varchar("originalFilename", { length: 500 }).notNull(),
  fileType: mysqlEnum("fileType", ["pdf", "docx", "xlsx", "image", "audio", "video", "email", "whatsapp", "other"]).notNull(),
  fileSizeBytes: int("fileSizeBytes"),
  mimeType: varchar("mimeType", { length: 100 }),
  storageUrl: text("storageUrl").notNull(),
  storageKey: varchar("storageKey", { length: 500 }),
  sourceChannel: mysqlEnum("sourceChannel", ["upload", "email", "whatsapp", "api"]).default("upload").notNull(),
  sourceMetadata: json("sourceMetadata").$type<{ sender?: string; timestamp?: string; threadId?: string; subject?: string }>(),
  ingestedAt: timestamp("ingestedAt").defaultNow().notNull(),
  ingestedById: int("ingestedById"),
  processingStatus: mysqlEnum("processingStatus", ["pending", "processing", "completed", "failed"]).default("pending"),
  processingError: text("processingError"),
  // Phase 4: PDF Viewer additions
  previewGenerated: boolean("previewGenerated").default(false),
  previewUrl: text("previewUrl"),
  pageCount: int("pageCount"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IngestedFile = typeof ingestedFiles.$inferSelect;
export type InsertIngestedFile = typeof ingestedFiles.$inferInsert;

// Extracted content from files
export const extractedContent = mysqlTable("extractedContent", {
  id: int("id").autoincrement().primaryKey(),
  fileId: int("fileId").notNull(),
  contentType: mysqlEnum("contentType", ["full_text", "page_text", "cell_data", "transcription", "ocr", "table_data"]).notNull(),
  pageNumber: int("pageNumber"),
  sheetName: varchar("sheetName", { length: 255 }),
  content: text("content"),
  structuredData: json("structuredData"),
  confidenceScore: decimal("confidenceScore", { precision: 3, scale: 2 }),
  extractionMethod: mysqlEnum("extractionMethod", ["native", "ocr", "transcription", "llm", "parser"]).default("native"),
  extractedAt: timestamp("extractedAt").defaultNow().notNull(),
  rawExtractionOutput: json("rawExtractionOutput"),
});

export type ExtractedContent = typeof extractedContent.$inferSelect;
export type InsertExtractedContent = typeof extractedContent.$inferInsert;

// ═══════════════════════════════════════════════════════════════
// PRINCIPLE 2: UNDERSTAND EVERYTHING (Parse & Extract & Connect)
// ═══════════════════════════════════════════════════════════════

// Canonical entities (the "truth" records)
export const entities = mysqlTable("entities", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  entityType: mysqlEnum("entityType", ["site", "company", "person", "equipment", "contract", "permit"]).notNull(),
  canonicalName: varchar("canonicalName", { length: 500 }).notNull(),
  attributes: json("attributes").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Entity = typeof entities.$inferSelect;
export type InsertEntity = typeof entities.$inferInsert;

// Entity mentions found in documents
export const entityMentions = mysqlTable("entityMentions", {
  id: int("id").autoincrement().primaryKey(),
  entityId: int("entityId"), // NULL if unresolved
  fileId: int("fileId").notNull(),
  mentionText: varchar("mentionText", { length: 500 }).notNull(),
  mentionType: mysqlEnum("mentionType", ["name", "alias", "reference", "abbreviation"]).default("name"),
  sourcePage: int("sourcePage"),
  sourceLocation: varchar("sourceLocation", { length: 255 }),
  contextSnippet: text("contextSnippet"),
  confidenceScore: decimal("confidenceScore", { precision: 3, scale: 2 }),
  resolutionStatus: mysqlEnum("resolutionStatus", ["unresolved", "auto_resolved", "human_verified"]).default("unresolved"),
  resolvedById: int("resolvedById"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EntityMention = typeof entityMentions.$inferSelect;
export type InsertEntityMention = typeof entityMentions.$inferInsert;

// Entity aliases for fuzzy matching
export const entityAliases = mysqlTable("entityAliases", {
  id: int("id").autoincrement().primaryKey(),
  entityId: int("entityId").notNull(),
  alias: varchar("alias", { length: 500 }).notNull(),
  aliasType: mysqlEnum("aliasType", ["abbreviation", "nickname", "alternate_spelling", "typo", "translation"]).default("abbreviation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EntityAlias = typeof entityAliases.$inferSelect;
export type InsertEntityAlias = typeof entityAliases.$inferInsert;

// Cross-reference checks (assumption vs actual)
export const crossReferences = mysqlTable("crossReferences", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  projectId: int("projectId"),
  referenceType: mysqlEnum("referenceType", ["assumption_vs_actual", "duplicate_value", "covenant_check", "discrepancy"]).notNull(),
  sourceAFileId: int("sourceAFileId"),
  sourceAField: varchar("sourceAField", { length: 255 }),
  sourceAValue: text("sourceAValue"),
  sourceBFileId: int("sourceBFileId"),
  sourceBField: varchar("sourceBField", { length: 255 }),
  sourceBValue: text("sourceBValue"),
  discrepancyDetected: boolean("discrepancyDetected").default(false),
  discrepancyNote: text("discrepancyNote"),
  status: mysqlEnum("status", ["pending_review", "reviewed", "resolved", "ignored"]).default("pending_review"),
  reviewedById: int("reviewedById"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrossReference = typeof crossReferences.$inferSelect;
export type InsertCrossReference = typeof crossReferences.$inferInsert;

// ═══════════════════════════════════════════════════════════════
// PRINCIPLE 3: ANCHOR & VERIFY (VATR - Verified Asset Technical Record)
// ═══════════════════════════════════════════════════════════════

// VATR: Core asset record with all 6 clusters
export const vatrAssets = mysqlTable("vatrAssets", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  projectId: int("projectId"),
  siteId: int("siteId"),
  vatrVersion: int("vatrVersion").default(1),
  
  // CLASSIFICATION CLUSTER
  assetClassification: mysqlEnum("assetClassification", [
    "residential",
    "small_commercial",
    "large_commercial",
    "industrial",
    "mini_grid",
    "mesh_grid",
    "interconnected_mini_grids",
    "grid_connected"
  ]).default("grid_connected"),
  gridConnectionType: mysqlEnum("gridConnectionType", [
    "off_grid",
    "grid_connected",
    "grid_tied_with_backup",
    "mini_grid",
    "interconnected_mini_grid",
    "mesh_grid"
  ]).default("grid_connected"),
  networkTopology: mysqlEnum("networkTopology", [
    "radial",
    "ring",
    "mesh",
    "star",
    "unknown"
  ]).default("unknown"),
  
  // Component configuration (multi-select with specs)
  components: json("components").$type<{
    type: "solar_pv" | "bess" | "diesel_generator" | "gas_generator" | "wind" | "hydro" | "biomass" | "grid_metering" | "inverter" | "ems_controller";
    manufacturer?: string;
    model?: string;
    capacityKw?: number;
    quantity?: number;
    specs?: Record<string, unknown>;
  }[]>(),
  
  // Computed configuration profile
  configurationProfile: mysqlEnum("configurationProfile", [
    "PV_ONLY",
    "PV_BESS",
    "PV_DG",
    "PV_BESS_DG",
    "BESS_ONLY",
    "DG_ONLY",
    "WIND_ONLY",
    "WIND_BESS",
    "HYDRO_ONLY",
    "MINIGRID_PV_BESS",
    "MINIGRID_PV_BESS_DG",
    "HYBRID_MULTI",
    "OTHER"
  ]).default("OTHER"),
  
  // Template override (admin can override auto-matched template)
  requirementTemplateId: int("requirementTemplateId"),
  viewTemplateId: int("viewTemplateId"),
  
  // IDENTITY CLUSTER
  assetName: varchar("assetName", { length: 500 }).notNull(),
  assetType: mysqlEnum("assetType", ["solar_pv", "bess", "genset", "minigrid", "hybrid", "wind", "hydro"]).default("solar_pv"),
  ownerEntityId: int("ownerEntityId"),
  locationLat: decimal("locationLat", { precision: 10, scale: 6 }),
  locationLng: decimal("locationLng", { precision: 10, scale: 6 }),
  locationAddress: text("locationAddress"),
  capacityKw: decimal("capacityKw", { precision: 12, scale: 2 }),
  technology: varchar("technology", { length: 255 }),
  installer: varchar("installer", { length: 255 }),
  commissioningDate: date("commissioningDate"),
  
  // TECHNICAL CLUSTER
  equipmentSpecs: json("equipmentSpecs").$type<Record<string, unknown>>(),
  sldDocumentId: int("sldDocumentId"),
  performanceBaseline: json("performanceBaseline").$type<Record<string, unknown>>(),
  degradationCurve: json("degradationCurve").$type<Record<string, unknown>>(),
  
  // OPERATIONAL CLUSTER
  currentAvailabilityPct: decimal("currentAvailabilityPct", { precision: 5, scale: 2 }),
  lastMaintenanceDate: date("lastMaintenanceDate"),
  operationalStatus: mysqlEnum("operationalStatus", ["operational", "maintenance", "offline", "decommissioned"]).default("operational"),
  
  // FINANCIAL CLUSTER
  tariffStructure: json("tariffStructure").$type<Record<string, unknown>>(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  
  // COMPLIANCE CLUSTER
  complianceStatus: mysqlEnum("complianceStatus", ["compliant", "at_risk", "non_compliant", "pending_review"]).default("pending_review"),
  nextAuditDate: date("nextAuditDate"),
  
  // COMMERCIAL CLUSTER
  offtakeType: mysqlEnum("offtakeType", ["ppa", "lease", "esco", "retail", "wholesale"]).default("ppa"),
  contractEndDate: date("contractEndDate"),
  counterpartyEntityId: int("counterpartyEntityId"),
  
  // VATR INTEGRITY
  contentHash: varchar("contentHash", { length: 64 }), // SHA-256
  previousVersionId: int("previousVersionId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdById: int("createdById"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VatrAsset = typeof vatrAssets.$inferSelect;
export type InsertVatrAsset = typeof vatrAssets.$inferInsert;

// VATR linked documents (source provenance)
export const vatrSourceDocuments = mysqlTable("vatrSourceDocuments", {
  id: int("id").autoincrement().primaryKey(),
  vatrAssetId: int("vatrAssetId").notNull(),
  documentId: int("documentId").notNull(),
  cluster: mysqlEnum("cluster", ["identity", "technical", "operational", "financial", "compliance", "commercial"]).notNull(),
  fieldName: varchar("fieldName", { length: 255 }),
  extractedValue: text("extractedValue"),
  sourcePage: int("sourcePage"),
  sourceSnippet: text("sourceSnippet"),
  linkCreatedAt: timestamp("linkCreatedAt").defaultNow().notNull(),
});

export type VatrSourceDocument = typeof vatrSourceDocuments.$inferSelect;
export type InsertVatrSourceDocument = typeof vatrSourceDocuments.$inferInsert;

// Immutable VATR audit log
export const vatrAuditLog = mysqlTable("vatrAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  vatrAssetId: int("vatrAssetId").notNull(),
  action: mysqlEnum("action", ["created", "updated", "viewed", "exported", "verified"]).notNull(),
  actorId: int("actorId").notNull(),
  actorRole: varchar("actorRole", { length: 100 }),
  actionTimestamp: timestamp("actionTimestamp").defaultNow().notNull(),
  beforeHash: varchar("beforeHash", { length: 64 }),
  afterHash: varchar("afterHash", { length: 64 }),
  changesJson: json("changesJson"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
});

export type VatrAuditLogEntry = typeof vatrAuditLog.$inferSelect;
export type InsertVatrAuditLogEntry = typeof vatrAuditLog.$inferInsert;

// VATR Verification records
export const vatrVerifications = mysqlTable("vatrVerifications", {
  id: int("id").autoincrement().primaryKey(),
  vatrAssetId: int("vatrAssetId").notNull(),
  verificationType: mysqlEnum("verificationType", ["hash_check", "human_review", "third_party_audit"]).notNull(),
  verifiedById: int("verifiedById"),
  verifiedAt: timestamp("verifiedAt").defaultNow().notNull(),
  verificationResult: mysqlEnum("verificationResult", ["passed", "failed", "pending"]).default("pending"),
  notes: text("notes"),
  certificateUrl: text("certificateUrl"),
});

export type VatrVerification = typeof vatrVerifications.$inferSelect;
export type InsertVatrVerification = typeof vatrVerifications.$inferInsert;

// ═══════════════════════════════════════════════════════════════
// PRINCIPLE 4: ACTIVATE (Power Operations)
// ═══════════════════════════════════════════════════════════════

// Generated reports
export const generatedReports = mysqlTable("generatedReports", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  projectId: int("projectId"),
  reportType: mysqlEnum("reportType", ["investor_summary", "monthly_performance", "due_diligence", "compliance", "custom"]).notNull(),
  reportName: varchar("reportName", { length: 500 }).notNull(),
  templateId: int("templateId"),
  parameters: json("parameters").$type<Record<string, unknown>>(),
  status: mysqlEnum("status", ["generating", "completed", "failed"]).default("generating"),
  fileUrl: text("fileUrl"),
  generatedAt: timestamp("generatedAt"),
  generatedById: int("generatedById"),
  vatrAssetsIncluded: json("vatrAssetsIncluded").$type<number[]>(),
  dataSnapshotHash: varchar("dataSnapshotHash", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GeneratedReport = typeof generatedReports.$inferSelect;
export type InsertGeneratedReport = typeof generatedReports.$inferInsert;

// Compliance tracking
export const complianceItems = mysqlTable("complianceItems", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  projectId: int("projectId"),
  vatrAssetId: int("vatrAssetId"),
  itemType: mysqlEnum("itemType", ["permit", "contract", "obligation", "deadline", "license", "insurance"]).notNull(),
  itemName: varchar("itemName", { length: 500 }).notNull(),
  sourceDocumentId: int("sourceDocumentId"),
  dueDate: date("dueDate"),
  renewalDate: date("renewalDate"),
  alertDaysBefore: int("alertDaysBefore").default(30),
  status: mysqlEnum("status", ["active", "expiring_soon", "expired", "renewed", "na"]).default("active"),
  responsiblePartyId: int("responsiblePartyId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComplianceItem = typeof complianceItems.$inferSelect;
export type InsertComplianceItem = typeof complianceItems.$inferInsert;

// Compliance alerts
export const complianceAlerts = mysqlTable("complianceAlerts", {
  id: int("id").autoincrement().primaryKey(),
  complianceItemId: int("complianceItemId").notNull(),
  alertType: mysqlEnum("alertType", ["expiring_soon", "expired", "missing_document", "renewal_due"]).notNull(),
  triggeredAt: timestamp("triggeredAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["open", "acknowledged", "resolved"]).default("open"),
  acknowledgedById: int("acknowledgedById"),
  acknowledgedAt: timestamp("acknowledgedAt"),
  resolutionNote: text("resolutionNote"),
});

export type ComplianceAlert = typeof complianceAlerts.$inferSelect;
export type InsertComplianceAlert = typeof complianceAlerts.$inferInsert;

// Data rooms
export const dataRooms = mysqlTable("dataRooms", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  projectId: int("projectId"),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  accessType: mysqlEnum("accessType", ["private", "link_only", "public"]).default("private"),
  accessToken: varchar("accessToken", { length: 64 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdById: int("createdById"),
});

export type DataRoom = typeof dataRooms.$inferSelect;
export type InsertDataRoom = typeof dataRooms.$inferInsert;

// Data room contents
export const dataRoomItems = mysqlTable("dataRoomItems", {
  id: int("id").autoincrement().primaryKey(),
  dataRoomId: int("dataRoomId").notNull(),
  category: mysqlEnum("category", ["corporate", "technical", "financial", "legal", "commercial", "operational"]).default("technical"),
  documentId: int("documentId"),
  vatrAssetId: int("vatrAssetId"),
  itemName: varchar("itemName", { length: 500 }),
  sortOrder: int("sortOrder").default(0),
  verificationStatus: mysqlEnum("verificationStatus", ["verified", "pending", "unverified"]).default("unverified"),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type DataRoomItem = typeof dataRoomItems.$inferSelect;
export type InsertDataRoomItem = typeof dataRoomItems.$inferInsert;

// Data room access log
export const dataRoomAccessLog = mysqlTable("dataRoomAccessLog", {
  id: int("id").autoincrement().primaryKey(),
  dataRoomId: int("dataRoomId").notNull(),
  accessorEmail: varchar("accessorEmail", { length: 320 }),
  accessorIp: varchar("accessorIp", { length: 45 }),
  accessedAt: timestamp("accessedAt").defaultNow().notNull(),
  documentsViewed: json("documentsViewed").$type<number[]>(),
  downloadCount: int("downloadCount").default(0),
});

export type DataRoomAccessLogEntry = typeof dataRoomAccessLog.$inferSelect;
export type InsertDataRoomAccessLogEntry = typeof dataRoomAccessLog.$inferInsert;

// ═══════════════════════════════════════════════════════════════
// PRINCIPLE 5: MULTI-CHANNEL INTERFACE
// ═══════════════════════════════════════════════════════════════

// WhatsApp integration config
export const whatsappConfigs = mysqlTable("whatsappConfigs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  projectId: int("projectId"),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  webhookSecret: varchar("webhookSecret", { length: 255 }),
  defaultSiteId: int("defaultSiteId"),
  autoCategorize: boolean("autoCategorize").default(true),
  active: boolean("active").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WhatsappConfig = typeof whatsappConfigs.$inferSelect;
export type InsertWhatsappConfig = typeof whatsappConfigs.$inferInsert;

// WhatsApp messages received
export const whatsappMessages = mysqlTable("whatsappMessages", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  projectId: int("projectId"),
  siteId: int("siteId"),
  configId: int("configId"),
  sessionId: int("sessionId"), // Link to conversationSessions
  waMessageId: varchar("waMessageId", { length: 100 }).unique(),
  senderPhone: varchar("senderPhone", { length: 20 }),
  senderName: varchar("senderName", { length: 255 }),
  recipientPhone: varchar("recipientPhone", { length: 20 }),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).default("inbound"),
  messageType: mysqlEnum("messageType", ["text", "image", "audio", "video", "document"]).default("text"),
  messageContent: text("messageContent"),
  mediaUrl: text("mediaUrl"),
  category: mysqlEnum("category", ["field_report", "issue", "document", "general"]).default("general"),
  ingestedFileId: int("ingestedFileId"),
  timestamp: timestamp("timestamp").defaultNow(), // Message timestamp for ordering
  receivedAt: timestamp("receivedAt"),
  processedAt: timestamp("processedAt"),
  processingStatus: mysqlEnum("processingStatus", ["pending", "processing", "completed", "failed", "sent"]).default("pending"),
  linkedWorkspaceItemId: int("linkedWorkspaceItemId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = typeof whatsappMessages.$inferInsert;

// Email integration config
export const emailConfigs = mysqlTable("emailConfigs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  projectId: int("projectId"),
  inboundAddress: varchar("inboundAddress", { length: 320 }).unique(),
  forwardFromAddresses: json("forwardFromAddresses").$type<string[]>(),
  defaultSiteId: int("defaultSiteId"),
  autoCategorize: boolean("autoCategorize").default(true),
  active: boolean("active").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailConfig = typeof emailConfigs.$inferSelect;
export type InsertEmailConfig = typeof emailConfigs.$inferInsert;

// API keys for external access
export const apiKeys = mysqlTable("apiKeys", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("keyHash", { length: 255 }).notNull(),
  keyPrefix: varchar("keyPrefix", { length: 8 }),
  scopes: json("scopes").$type<string[]>(),
  rateLimitPerHour: int("rateLimitPerHour").default(1000),
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdById: int("createdById"),
  revokedAt: timestamp("revokedAt"),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

// API request log
export const apiRequestLog = mysqlTable("apiRequestLog", {
  id: int("id").autoincrement().primaryKey(),
  apiKeyId: int("apiKeyId"),
  endpoint: varchar("endpoint", { length: 500 }),
  method: varchar("method", { length: 10 }),
  statusCode: int("statusCode"),
  requestTimestamp: timestamp("requestTimestamp").defaultNow().notNull(),
  responseTimeMs: int("responseTimeMs"),
  ipAddress: varchar("ipAddress", { length: 45 }),
});

export type ApiRequestLogEntry = typeof apiRequestLog.$inferSelect;
export type InsertApiRequestLogEntry = typeof apiRequestLog.$inferInsert;


// ═══════════════════════════════════════════════════════════════
// PHASE 4: PDF VIEWER & DOCUMENT ANALYTICS
// ═══════════════════════════════════════════════════════════════

// Document view events for analytics
export const documentViewEvents = mysqlTable("documentViewEvents", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  userId: int("userId").notNull(),
  pageViewed: int("pageViewed"),
  viewDurationSeconds: int("viewDurationSeconds"),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});

export type DocumentViewEvent = typeof documentViewEvents.$inferSelect;
export type InsertDocumentViewEvent = typeof documentViewEvents.$inferInsert;

// ═══════════════════════════════════════════════════════════════
// PHASE 4: BULK ENTITY RESOLUTION
// ═══════════════════════════════════════════════════════════════

// Entity resolution jobs for batch processing
export const entityResolutionJobs = mysqlTable("entityResolutionJobs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending"),
  totalMentions: int("totalMentions"),
  resolvedCount: int("resolvedCount").default(0),
  createdCount: int("createdCount").default(0),
  ignoredCount: int("ignoredCount").default(0),
  errorCount: int("errorCount").default(0),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdById: int("createdById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EntityResolutionJob = typeof entityResolutionJobs.$inferSelect;
export type InsertEntityResolutionJob = typeof entityResolutionJobs.$inferInsert;

// Entity resolution history for audit trail
export const entityResolutionHistory = mysqlTable("entityResolutionHistory", {
  id: int("id").autoincrement().primaryKey(),
  mentionId: int("mentionId").notNull(),
  action: mysqlEnum("action", ["linked", "created", "ignored", "unlinked"]).notNull(),
  previousEntityId: int("previousEntityId"),
  newEntityId: int("newEntityId"),
  resolutionMethod: mysqlEnum("resolutionMethod", ["manual", "bulk", "auto_rule", "ai_suggested"]).default("manual"),
  confidenceScore: decimal("confidenceScore", { precision: 3, scale: 2 }),
  resolvedById: int("resolvedById"),
  resolvedAt: timestamp("resolvedAt").defaultNow().notNull(),
});

export type EntityResolutionHistoryEntry = typeof entityResolutionHistory.$inferSelect;
export type InsertEntityResolutionHistoryEntry = typeof entityResolutionHistory.$inferInsert;

// Auto-resolution rules
export const entityResolutionRules = mysqlTable("entityResolutionRules", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  ruleName: varchar("ruleName", { length: 255 }).notNull(),
  matchType: mysqlEnum("matchType", ["exact_alias", "fuzzy_name", "regex"]).notNull(),
  matchPattern: text("matchPattern"),
  targetEntityId: int("targetEntityId"),
  autoResolve: boolean("autoResolve").default(false),
  minConfidence: decimal("minConfidence", { precision: 3, scale: 2 }),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EntityResolutionRule = typeof entityResolutionRules.$inferSelect;
export type InsertEntityResolutionRule = typeof entityResolutionRules.$inferInsert;

// ═══════════════════════════════════════════════════════════════
// PHASE 4: WHATSAPP BUSINESS API ENHANCEMENTS
// ═══════════════════════════════════════════════════════════════

// WhatsApp sender mappings for auto-routing
export const whatsappSenderMappings = mysqlTable("whatsappSenderMappings", {
  id: int("id").autoincrement().primaryKey(),
  configId: int("configId").notNull(),
  senderPhone: varchar("senderPhone", { length: 20 }).notNull(),
  senderName: varchar("senderName", { length: 255 }),
  projectId: int("projectId"),
  siteId: int("siteId"),
  defaultCategory: mysqlEnum("defaultCategory", ["field_report", "issue", "document", "general"]).default("general"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WhatsappSenderMapping = typeof whatsappSenderMappings.$inferSelect;
export type InsertWhatsappSenderMapping = typeof whatsappSenderMappings.$inferInsert;

// WhatsApp message templates
export const whatsappTemplates = mysqlTable("whatsappTemplates", {
  id: int("id").autoincrement().primaryKey(),
  configId: int("configId").notNull(),
  templateName: varchar("templateName", { length: 255 }).notNull(),
  templateType: mysqlEnum("templateType", ["text", "media", "interactive"]).default("text"),
  content: json("content"),
  metaTemplateId: varchar("metaTemplateId", { length: 100 }),
  status: mysqlEnum("status", ["draft", "pending_approval", "approved", "rejected"]).default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;
export type InsertWhatsappTemplate = typeof whatsappTemplates.$inferInsert;

// ═══════════════════════════════════════════════════════════════
// PHASE 4: OPERATIONS MONITORING OS
// ═══════════════════════════════════════════════════════════════

// Data connectors (AMMP, Victron, SolarEdge, etc.)
export const connectors = mysqlTable("connectors", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  name: varchar("name", { length: 255 }).notNull(),
  connectorType: mysqlEnum("connectorType", ["ammp", "victron", "solaredge", "sma", "huawei", "fronius", "enphase", "demo", "custom_api", "csv_import"]).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "error", "configuring"]).default("configuring"),
  lastSyncAt: timestamp("lastSyncAt"),
  syncFrequencyMinutes: int("syncFrequencyMinutes").default(15),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Connector = typeof connectors.$inferSelect;
export type InsertConnector = typeof connectors.$inferInsert;

// Connector credentials (encrypted)
export const connectorCredentials = mysqlTable("connectorCredentials", {
  id: int("id").autoincrement().primaryKey(),
  connectorId: int("connectorId").notNull(),
  credentialType: varchar("credentialType", { length: 50 }).notNull(), // api_key, oauth_token, username, password, etc.
  credentialValueEncrypted: text("credentialValueEncrypted").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConnectorCredential = typeof connectorCredentials.$inferSelect;
export type InsertConnectorCredential = typeof connectorCredentials.$inferInsert;

// Metric definitions (what metrics are tracked)
export const metricDefinitions = mysqlTable("metricDefinitions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 100 }).notNull(), // e.g., "pv_power", "battery_soc", "grid_frequency"
  unit: varchar("unit", { length: 50 }), // kW, %, Hz, V, A, kWh
  dataType: mysqlEnum("dataType", ["number", "boolean", "string", "enum"]).default("number"),
  aggregationMethod: mysqlEnum("aggregationMethod", ["avg", "sum", "min", "max", "last", "count"]).default("avg"),
  description: text("description"),
  category: mysqlEnum("category", ["power", "energy", "voltage", "current", "frequency", "temperature", "soc", "status", "environmental", "financial"]).default("power"),
  isStandard: boolean("isStandard").default(false), // Standard metrics vs custom
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MetricDefinition = typeof metricDefinitions.$inferSelect;
export type InsertMetricDefinition = typeof metricDefinitions.$inferInsert;

// Devices (inverters, batteries, meters, etc.)
export const devices = mysqlTable("devices", {
  id: int("id").autoincrement().primaryKey(),
  siteId: int("siteId").notNull(),
  connectorId: int("connectorId"),
  externalId: varchar("externalId", { length: 255 }), // ID from the external system
  name: varchar("name", { length: 255 }).notNull(),
  deviceType: mysqlEnum("deviceType", ["inverter", "battery", "meter", "weather_station", "genset", "charge_controller", "combiner_box", "transformer", "other"]).notNull(),
  manufacturer: varchar("manufacturer", { length: 100 }),
  model: varchar("model", { length: 100 }),
  serialNumber: varchar("serialNumber", { length: 100 }),
  capacityKw: decimal("capacityKw", { precision: 10, scale: 2 }),
  capacityKwh: decimal("capacityKwh", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["online", "offline", "warning", "error", "maintenance"]).default("offline"),
  lastSeenAt: timestamp("lastSeenAt"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

// Raw measurements (time-series data - high volume)
export const rawMeasurements = mysqlTable("rawMeasurements", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: int("deviceId").notNull(),
  metricId: int("metricId").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  valueNumeric: decimal("valueNumeric", { precision: 18, scale: 6 }),
  valueString: varchar("valueString", { length: 255 }),
  quality: mysqlEnum("quality", ["good", "uncertain", "bad", "interpolated"]).default("good"),
  sourceConnectorId: int("sourceConnectorId"),
  ingestedAt: timestamp("ingestedAt").defaultNow().notNull(),
});

export type RawMeasurement = typeof rawMeasurements.$inferSelect;
export type InsertRawMeasurement = typeof rawMeasurements.$inferInsert;

// Normalized measurements (aggregated/cleaned data)
export const normalizedMeasurements = mysqlTable("normalizedMeasurements", {
  id: int("id").autoincrement().primaryKey(),
  siteId: int("siteId").notNull(),
  deviceId: int("deviceId"),
  metricId: int("metricId").notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  periodType: mysqlEnum("periodType", ["minute", "hour", "day", "week", "month"]).notNull(),
  valueAvg: decimal("valueAvg", { precision: 18, scale: 6 }),
  valueMin: decimal("valueMin", { precision: 18, scale: 6 }),
  valueMax: decimal("valueMax", { precision: 18, scale: 6 }),
  valueSum: decimal("valueSum", { precision: 18, scale: 6 }),
  sampleCount: int("sampleCount"),
  dataQuality: decimal("dataQuality", { precision: 3, scale: 2 }), // 0-1 quality score
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NormalizedMeasurement = typeof normalizedMeasurements.$inferSelect;
export type InsertNormalizedMeasurement = typeof normalizedMeasurements.$inferInsert;

// Derived metrics (calculated values like PR, availability, etc.)
export const derivedMetrics = mysqlTable("derivedMetrics", {
  id: int("id").autoincrement().primaryKey(),
  siteId: int("siteId").notNull(),
  metricCode: varchar("metricCode", { length: 100 }).notNull(), // e.g., "performance_ratio", "availability"
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  periodType: mysqlEnum("periodType", ["hour", "day", "week", "month", "year"]).notNull(),
  value: decimal("value", { precision: 18, scale: 6 }),
  calculationMethod: varchar("calculationMethod", { length: 100 }),
  inputMetrics: json("inputMetrics").$type<{ metricId: number; value: number }[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DerivedMetric = typeof derivedMetrics.$inferSelect;
export type InsertDerivedMetric = typeof derivedMetrics.$inferInsert;

// Data lineage tracking
export const dataLineage = mysqlTable("dataLineage", {
  id: int("id").autoincrement().primaryKey(),
  targetTable: varchar("targetTable", { length: 100 }).notNull(),
  targetId: int("targetId").notNull(),
  sourceTable: varchar("sourceTable", { length: 100 }).notNull(),
  sourceId: int("sourceId").notNull(),
  transformationType: varchar("transformationType", { length: 100 }), // aggregation, calculation, normalization
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DataLineageEntry = typeof dataLineage.$inferSelect;
export type InsertDataLineageEntry = typeof dataLineage.$inferInsert;

// Alert rules
export const alertRules = mysqlTable("alertRules", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  siteId: int("siteId"),
  deviceId: int("deviceId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  metricId: int("metricId"),
  condition: mysqlEnum("condition", ["gt", "gte", "lt", "lte", "eq", "neq", "offline", "change_rate"]).notNull(),
  threshold: decimal("threshold", { precision: 18, scale: 6 }),
  thresholdUnit: varchar("thresholdUnit", { length: 50 }),
  evaluationWindowMinutes: int("evaluationWindowMinutes").default(5),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low", "info"]).default("medium"),
  notificationChannels: json("notificationChannels").$type<string[]>(), // email, slack, webhook
  enabled: boolean("enabled").default(true),
  cooldownMinutes: int("cooldownMinutes").default(60),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = typeof alertRules.$inferInsert;

// Alert events (triggered alerts)
export const alertEvents = mysqlTable("alertEvents", {
  id: int("id").autoincrement().primaryKey(),
  alertRuleId: int("alertRuleId").notNull(),
  siteId: int("siteId"),
  deviceId: int("deviceId"),
  triggeredAt: timestamp("triggeredAt").notNull(),
  triggerValue: decimal("triggerValue", { precision: 18, scale: 6 }),
  status: mysqlEnum("status", ["open", "acknowledged", "resolved", "suppressed"]).default("open"),
  acknowledgedById: int("acknowledgedById"),
  acknowledgedAt: timestamp("acknowledgedAt"),
  resolvedAt: timestamp("resolvedAt"),
  resolutionNote: text("resolutionNote"),
  notificationsSent: json("notificationsSent").$type<{ channel: string; sentAt: string; status: string }[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertEvent = typeof alertEvents.$inferSelect;
export type InsertAlertEvent = typeof alertEvents.$inferInsert;

// Stakeholder portals (read-only views for investors/clients)
export const stakeholderPortals = mysqlTable("stakeholderPortals", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique(),
  brandingConfig: json("brandingConfig").$type<{
    logo?: string;
    primaryColor?: string;
    companyName?: string;
  }>(),
  allowedSiteIds: json("allowedSiteIds").$type<number[]>(),
  allowedMetrics: json("allowedMetrics").$type<string[]>(),
  accessType: mysqlEnum("accessType", ["password", "token", "sso"]).default("password"),
  passwordHash: varchar("passwordHash", { length: 255 }),
  accessToken: varchar("accessToken", { length: 64 }),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StakeholderPortal = typeof stakeholderPortals.$inferSelect;
export type InsertStakeholderPortal = typeof stakeholderPortals.$inferInsert;

// Operations reports
export const operationsReports = mysqlTable("operationsReports", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  siteId: int("siteId"),
  reportType: mysqlEnum("reportType", ["daily_summary", "weekly_summary", "monthly_performance", "quarterly_review", "annual_report", "incident_report", "custom"]).notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  title: varchar("title", { length: 500 }),
  status: mysqlEnum("status", ["generating", "completed", "failed"]).default("generating"),
  storageUrl: text("storageUrl"),
  generatedAt: timestamp("generatedAt"),
  generatedById: int("generatedById"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OperationsReport = typeof operationsReports.$inferSelect;
export type InsertOperationsReport = typeof operationsReports.$inferInsert;


// Search history for global search
export const searchHistory = mysqlTable("searchHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  query: varchar("query", { length: 500 }).notNull(),
  resultType: mysqlEnum("resultType", ["document", "project", "workspace_item", "all"]).default("all"),
  resultCount: int("resultCount").default(0),
  selectedResultId: int("selectedResultId"),
  selectedResultType: varchar("selectedResultType", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = typeof searchHistory.$inferInsert;

// Team invitations for onboarding
export const teamInvitations = mysqlTable("teamInvitations", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["admin", "editor", "reviewer", "investor_viewer"]).default("editor").notNull(),
  invitedById: int("invitedById").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "expired", "cancelled"]).default("pending").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type InsertTeamInvitation = typeof teamInvitations.$inferInsert;

// Real-time events for WebSocket
export const realtimeEvents = mysqlTable("realtimeEvents", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  projectId: int("projectId"),
  eventType: mysqlEnum("eventType", [
    "document_uploaded", "document_verified", "document_rejected",
    "rfi_created", "rfi_updated", "rfi_resolved",
    "alert_triggered", "alert_acknowledged", "alert_resolved",
    "checklist_item_completed", "checklist_completed",
    "user_joined", "user_left"
  ]).notNull(),
  payload: json("payload").$type<Record<string, unknown>>(),
  actorId: int("actorId"),
  targetId: int("targetId"),
  targetType: varchar("targetType", { length: 50 }),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RealtimeEvent = typeof realtimeEvents.$inferSelect;
export type InsertRealtimeEvent = typeof realtimeEvents.$inferInsert;

// User activity log for profile page
export const userActivityLog = mysqlTable("userActivityLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resourceType", { length: 50 }),
  resourceId: int("resourceId"),
  resourceName: varchar("resourceName", { length: 255 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserActivityLog = typeof userActivityLog.$inferSelect;
export type InsertUserActivityLog = typeof userActivityLog.$inferInsert;


// Comments for team collaboration
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  /** Type of resource being commented on */
  resourceType: mysqlEnum("resourceType", ["document", "workspace_item", "checklist_item", "project"]).notNull(),
  /** ID of the resource being commented on */
  resourceId: int("resourceId").notNull(),
  /** User who created the comment */
  userId: int("userId").notNull(),
  /** Comment content (supports markdown) */
  content: text("content").notNull(),
  /** Parent comment ID for threaded replies */
  parentId: int("parentId"),
  /** Internal comments are hidden from investor_viewer role */
  isInternal: boolean("isInternal").default(false).notNull(),
  /** Whether the comment has been edited */
  isEdited: boolean("isEdited").default(false).notNull(),
  /** Whether the comment thread is resolved (only applies to top-level comments) */
  isResolved: boolean("isResolved").default(false).notNull(),
  /** Timestamp when the thread was resolved */
  resolvedAt: timestamp("resolvedAt"),
  /** User who resolved the thread */
  resolvedById: int("resolvedById"),
  /** Soft-delete: whether the comment has been deleted */
  isDeleted: boolean("isDeleted").default(false).notNull(),
  /** Timestamp when the comment was deleted */
  deletedAt: timestamp("deletedAt"),
  /** User who deleted the comment */
  deletedBy: int("deletedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// Mentions in comments for notifications
export const commentMentions = mysqlTable("commentMentions", {
  id: int("id").autoincrement().primaryKey(),
  /** Comment containing the mention */
  commentId: int("commentId").notNull(),
  /** User who was mentioned */
  mentionedUserId: int("mentionedUserId").notNull(),
  /** Whether the mentioned user has seen this */
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommentMention = typeof commentMentions.$inferSelect;
export type InsertCommentMention = typeof commentMentions.$inferInsert;


// ============ VATR HIERARCHICAL DATA MODEL ============

// Sites - physical locations within projects
export const sites = mysqlTable("sites", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  portfolioId: int("portfolioId"),
  organizationId: int("organizationId"),
  
  // Identity
  name: varchar("name", { length: 255 }).notNull(),
  siteCode: varchar("siteCode", { length: 50 }), // e.g., "LGS-001"
  description: text("description"),
  
  // Location
  address: text("address"),
  city: varchar("city", { length: 100 }),
  stateProvince: varchar("stateProvince", { length: 100 }),
  country: varchar("country", { length: 100 }).notNull().default("Nigeria"),
  latitude: decimal("latitude", { precision: 10, scale: 6 }),
  longitude: decimal("longitude", { precision: 10, scale: 6 }),
  timezone: varchar("timezone", { length: 50 }).default("Africa/Lagos"),
  
  // Classification
  siteType: mysqlEnum("siteType", ["ground_mount", "rooftop", "carport", "floating", "minigrid"]).default("ground_mount"),
  landType: mysqlEnum("landType", ["owned", "leased", "easement"]).default("leased"),
  gridConnection: mysqlEnum("gridConnection", ["grid_tied", "off_grid", "hybrid"]).default("grid_tied"),
  
  // Capacity (aggregated from systems)
  capacityKw: decimal("capacityKw", { precision: 12, scale: 2 }),
  capacityKwh: decimal("capacityKwh", { precision: 12, scale: 2 }),
  
  // Status
  status: mysqlEnum("status", ["active", "inactive", "decommissioned"]).default("active"),
  operationalStatus: mysqlEnum("operationalStatus", ["online", "offline", "maintenance", "commissioning"]).default("commissioning"),
  codDate: date("codDate"),
  
  // Profile completeness
  profileCompletenessPct: decimal("profileCompletenessPct", { precision: 5, scale: 2 }).default("0"),
  lastProfileUpdate: timestamp("lastProfileUpdate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Site = typeof sites.$inferSelect;
export type InsertSite = typeof sites.$inferInsert;

// Systems - functional groupings within a site (PV, BESS, Genset, etc.)
export const systems = mysqlTable("systems", {
  id: int("id").autoincrement().primaryKey(),
  siteId: int("siteId").notNull(),
  organizationId: int("organizationId"),
  
  name: varchar("name", { length: 255 }).notNull(),
  systemType: mysqlEnum("systemType", ["pv", "bess", "genset", "hybrid", "wind", "hydro"]).notNull(),
  topology: mysqlEnum("topology", ["dc_coupled", "ac_coupled", "standalone"]).default("standalone"),
  
  // Capacity
  capacityKw: decimal("capacityKw", { precision: 12, scale: 2 }),
  capacityKwh: decimal("capacityKwh", { precision: 12, scale: 2 }),
  
  // Configuration
  configuration: json("configuration").$type<Record<string, unknown>>(),
  
  // Status
  status: mysqlEnum("status", ["active", "inactive", "maintenance"]).default("active"),
  commissionedAt: timestamp("commissionedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type System = typeof systems.$inferSelect;
export type InsertSystem = typeof systems.$inferInsert;

// Equipment/Components - individual equipment units within a project (THE VATR ANCHOR)
// NOTE: In KIISHA terminology, "Asset" = Project-level investable unit (see projects table)
// This table contains equipment/components (inverters, batteries, panels, etc.) that belong to projects
export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  
  // Hierarchy links
  systemId: int("systemId").notNull(),
  siteId: int("siteId").notNull(),
  projectId: int("projectId"),
  organizationId: int("organizationId"),
  
  // VATR Identity
  vatrId: varchar("vatrId", { length: 100 }).unique(), // Human-readable: "VATR-LGS001-INV-001"
  assetType: mysqlEnum("assetType", [
    "inverter", "panel", "meter", "battery", "transformer", 
    "combiner_box", "tracker", "monitoring", "genset", "switchgear", "cable", "other"
  ]).notNull(),
  assetCategory: mysqlEnum("assetCategory", [
    "generation", "storage", "distribution", "monitoring", "auxiliary"
  ]).notNull(),
  
  // Asset Classification (for filtering and requirements matching)
  assetClassification: mysqlEnum("assetClassification", [
    "residential", "small_commercial", "large_commercial", "industrial",
    "mini_grid", "mesh_grid", "interconnected_mini_grids", "grid_connected"
  ]),
  gridConnectionType: mysqlEnum("gridConnectionType", [
    "off_grid", "grid_connected", "grid_tied_with_backup", "mini_grid", "interconnected_mini_grid", "mesh_grid"
  ]),
  networkTopology: mysqlEnum("networkTopology", ["radial", "ring", "mesh", "star", "unknown"]),
  configurationProfile: mysqlEnum("configurationProfile", [
    "pv_only", "pv_bess", "pv_dg", "pv_bess_dg", "bess_only", "dg_only",
    "minigrid_pv_bess", "minigrid_pv_bess_dg", "mesh_pv_bess", "mesh_pv_bess_dg", "hybrid_custom"
  ]),
  componentsJson: json("componentsJson"), // Array of component types with specs
  
  // Identification
  name: varchar("name", { length: 255 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 255 }),
  model: varchar("model", { length: 255 }),
  serialNumber: varchar("serialNumber", { length: 255 }),
  assetTag: varchar("assetTag", { length: 100 }), // internal tracking tag
  
  // Specifications
  nominalCapacityKw: decimal("nominalCapacityKw", { precision: 12, scale: 2 }),
  nominalCapacityKwh: decimal("nominalCapacityKwh", { precision: 12, scale: 2 }),
  voltageRating: decimal("voltageRating", { precision: 10, scale: 2 }),
  currentRating: decimal("currentRating", { precision: 10, scale: 2 }),
  efficiencyRating: decimal("efficiencyRating", { precision: 5, scale: 2 }),
  
  // Physical
  locationOnSite: varchar("locationOnSite", { length: 255 }), // "Array A, String 3"
  gpsLatitude: decimal("gpsLatitude", { precision: 10, scale: 6 }),
  gpsLongitude: decimal("gpsLongitude", { precision: 10, scale: 6 }),
  installationDate: date("installationDate"),
  
  // Lifecycle
  status: mysqlEnum("status", ["active", "inactive", "failed", "replaced", "decommissioned"]).default("active"),
  condition: mysqlEnum("condition", ["excellent", "good", "fair", "poor", "failed"]).default("good"),
  lastInspectionDate: date("lastInspectionDate"),
  nextMaintenanceDate: date("nextMaintenanceDate"),
  
  // Warranty
  warrantyStartDate: date("warrantyStartDate"),
  warrantyEndDate: date("warrantyEndDate"),
  warrantyProvider: varchar("warrantyProvider", { length: 255 }),
  warrantyDocumentId: int("warrantyDocumentId"),
  
  // Financial
  purchasePrice: decimal("purchasePrice", { precision: 12, scale: 2 }),
  purchaseCurrency: varchar("purchaseCurrency", { length: 3 }).default("USD"),
  purchaseDate: date("purchaseDate"),
  supplier: varchar("supplier", { length: 255 }),
  depreciationMethod: varchar("depreciationMethod", { length: 50 }),
  usefulLifeYears: int("usefulLifeYears"),
  
  // VATR Integrity
  currentVersion: int("currentVersion").default(1),
  contentHash: varchar("contentHash", { length: 64 }), // SHA-256
  previousVersionId: int("previousVersionId"),
  
  // Profile completeness
  profileCompletenessPct: decimal("profileCompletenessPct", { precision: 5, scale: 2 }).default("0"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdById: int("createdById"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedById: int("updatedById"),
});

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;

// Asset components - sub-parts of assets
export const assetComponents = mysqlTable("assetComponents", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull(),
  organizationId: int("organizationId"),
  
  name: varchar("name", { length: 255 }).notNull(),
  componentType: mysqlEnum("componentType", [
    "fan", "capacitor", "fuse", "connector", "display", "sensor", "relay", "other"
  ]).notNull(),
  manufacturer: varchar("manufacturer", { length: 255 }),
  model: varchar("model", { length: 255 }),
  serialNumber: varchar("serialNumber", { length: 255 }),
  
  status: mysqlEnum("status", ["active", "inactive", "failed", "replaced"]).default("active"),
  installationDate: date("installationDate"),
  replacementDate: date("replacementDate"),
  
  specifications: json("specifications").$type<Record<string, unknown>>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssetComponent = typeof assetComponents.$inferSelect;
export type InsertAssetComponent = typeof assetComponents.$inferInsert;

// Versioned asset attributes - every data point is versioned
export const assetAttributes = mysqlTable("assetAttributes", {
  id: int("id").autoincrement().primaryKey(),
  
  // What this attribute belongs to
  assetId: int("assetId").notNull(),
  componentId: int("componentId"), // optional, if component-level
  organizationId: int("organizationId"),
  
  // Attribute definition
  attributeKey: varchar("attributeKey", { length: 100 }).notNull(), // e.g., "efficiency_rating", "firmware_version"
  attributeCategory: mysqlEnum("attributeCategory", [
    "identity", "technical", "operational", "financial", "compliance"
  ]).notNull(),
  
  // Value (current)
  valueText: text("valueText"),
  valueNumeric: decimal("valueNumeric", { precision: 20, scale: 6 }),
  valueBoolean: boolean("valueBoolean"),
  valueDate: date("valueDate"),
  valueJson: json("valueJson").$type<Record<string, unknown>>(),
  unit: varchar("unit", { length: 20 }), // kW, %, V, A, etc.
  
  // Version control
  version: int("version").default(1),
  previousVersionId: int("previousVersionId"),
  isCurrent: boolean("isCurrent").default(true),
  
  // Provenance (WHERE did this come from?)
  sourceType: mysqlEnum("sourceType", [
    "document", "api", "manual", "ai_extraction", "iot", "work_order"
  ]).notNull(),
  sourceId: int("sourceId"), // reference to source (document_id, connector_id, etc.)
  sourcePage: int("sourcePage"),
  sourceSnippet: text("sourceSnippet"),
  sourceConfidence: decimal("sourceConfidence", { precision: 3, scale: 2 }), // 0-1
  
  // Verification
  verificationStatus: mysqlEnum("verificationStatus", [
    "unverified", "verified", "rejected"
  ]).default("unverified"),
  verifiedById: int("verifiedById"),
  verifiedAt: timestamp("verifiedAt"),
  rejectionReason: text("rejectionReason"),
  
  // Cryptographic proof
  contentHash: varchar("contentHash", { length: 64 }).notNull(), // SHA-256
  timestampAnchor: timestamp("timestampAnchor").defaultNow(),
  
  // AI assessment
  aiAssessed: boolean("aiAssessed").default(false),
  aiAssessmentResult: json("aiAssessmentResult").$type<Record<string, unknown>>(),
  aiRoutedFrom: varchar("aiRoutedFrom", { length: 100 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdById: int("createdById"),
  supersededAt: timestamp("supersededAt"),
  supersededById: int("supersededById"),
  
  // Soft-delete / immutability fields
  visibilityState: mysqlEnum("visibilityState", ["active", "archived", "superseded"]).default("active").notNull(),
  archivedAt: timestamp("archivedAt"),
  archivedBy: int("archivedBy"),
  archiveReason: text("archiveReason"),
});

export type AssetAttribute = typeof assetAttributes.$inferSelect;
export type InsertAssetAttribute = typeof assetAttributes.$inferInsert;

// Attribute change log - immutable audit trail
export const attributeChangeLog = mysqlTable("attributeChangeLog", {
  id: int("id").autoincrement().primaryKey(),
  attributeId: int("attributeId").notNull(),
  assetId: int("assetId").notNull(),
  
  changeType: mysqlEnum("changeType", ["created", "updated", "deleted", "verified", "rejected"]).notNull(),
  oldValueHash: varchar("oldValueHash", { length: 64 }),
  newValueHash: varchar("newValueHash", { length: 64 }),
  
  oldSnapshot: json("oldSnapshot").$type<Record<string, unknown>>(),
  newSnapshot: json("newSnapshot").$type<Record<string, unknown>>(),
  
  changedById: int("changedById"),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
  changeReason: text("changeReason"),
});

export type AttributeChangeLog = typeof attributeChangeLog.$inferSelect;
export type InsertAttributeChangeLog = typeof attributeChangeLog.$inferInsert;


// ============ CMMS (Computerized Maintenance Management System) ============

// Maintenance schedules - recurring maintenance plans
export const maintenanceSchedules = mysqlTable("maintenanceSchedules", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  
  // Scope (can be site, system, or asset level)
  scopeType: mysqlEnum("scopeType", ["site", "system", "asset"]).notNull(),
  scopeId: int("scopeId").notNull(), // references sites/systems/assets
  
  // Schedule definition
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  maintenanceType: mysqlEnum("maintenanceType", [
    "preventive", "predictive", "condition_based"
  ]).notNull(),
  taskCategory: mysqlEnum("taskCategory", [
    "inspection", "cleaning", "calibration", "replacement", "testing", "repair"
  ]),
  
  // Frequency
  frequencyType: mysqlEnum("frequencyType", [
    "calendar", "runtime", "cycles", "condition"
  ]).notNull(),
  frequencyValue: int("frequencyValue"), // e.g., 30 for "every 30 days"
  frequencyUnit: mysqlEnum("frequencyUnit", [
    "days", "weeks", "months", "years", "hours", "cycles"
  ]),
  
  // Condition-based triggers
  triggerMetric: varchar("triggerMetric", { length: 100 }),
  triggerThreshold: decimal("triggerThreshold", { precision: 12, scale: 2 }),
  triggerOperator: mysqlEnum("triggerOperator", ["gt", "lt", "eq"]),
  
  // Task details
  estimatedDurationHours: decimal("estimatedDurationHours", { precision: 6, scale: 2 }),
  requiredSkills: json("requiredSkills").$type<string[]>(),
  requiredParts: json("requiredParts").$type<Array<{partNumber: string; quantity: number; description: string}>>(),
  safetyRequirements: json("safetyRequirements").$type<string[]>(),
  procedureDocumentId: int("procedureDocumentId"),
  
  // Assignment
  defaultAssigneeId: int("defaultAssigneeId"),
  defaultTeam: varchar("defaultTeam", { length: 100 }),
  
  // Status
  status: mysqlEnum("status", ["active", "paused", "archived"]).default("active"),
  lastGeneratedAt: timestamp("lastGeneratedAt"),
  nextDueDate: date("nextDueDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdById: int("createdById"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;
export type InsertMaintenanceSchedule = typeof maintenanceSchedules.$inferInsert;

// Work orders - individual maintenance tasks
export const workOrders = mysqlTable("workOrders", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  
  // Identity
  workOrderNumber: varchar("workOrderNumber", { length: 50 }).unique().notNull(), // WO-2026-00001
  
  // Source
  sourceType: mysqlEnum("sourceType", [
    "scheduled", "reactive", "inspection", "alert"
  ]).notNull(),
  scheduleId: int("scheduleId"),
  alertId: int("alertId"),
  
  // Scope
  siteId: int("siteId").notNull(),
  systemId: int("systemId"),
  assetId: int("assetId"),
  
  // Details
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  workType: mysqlEnum("workType", [
    "preventive", "corrective", "emergency", "inspection"
  ]).notNull(),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).notNull(),
  
  // Assignment
  assignedToId: int("assignedToId"),
  assignedTeam: varchar("assignedTeam", { length: 100 }),
  
  // Scheduling
  scheduledStart: timestamp("scheduledStart"),
  scheduledEnd: timestamp("scheduledEnd"),
  actualStart: timestamp("actualStart"),
  actualEnd: timestamp("actualEnd"),
  
  // Effort
  estimatedHours: decimal("estimatedHours", { precision: 6, scale: 2 }),
  actualHours: decimal("actualHours", { precision: 6, scale: 2 }),
  
  // Status workflow
  status: mysqlEnum("status", [
    "open", "assigned", "in_progress", "on_hold", "completed", "cancelled"
  ]).default("open"),
  statusReason: text("statusReason"),
  
  // Completion
  completionNotes: text("completionNotes"),
  completionChecklist: json("completionChecklist").$type<Array<{item: string; completed: boolean; notes?: string}>>(),
  followUpRequired: boolean("followUpRequired").default(false),
  followUpWorkOrderId: int("followUpWorkOrderId"),
  
  // Cost tracking
  laborCost: decimal("laborCost", { precision: 12, scale: 2 }),
  partsCost: decimal("partsCost", { precision: 12, scale: 2 }),
  otherCost: decimal("otherCost", { precision: 12, scale: 2 }),
  
  // VATR integration
  assetAttributesUpdated: json("assetAttributesUpdated").$type<number[]>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdById: int("createdById"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = typeof workOrders.$inferInsert;

// Work order tasks - sub-tasks within a work order
export const workOrderTasks = mysqlTable("workOrderTasks", {
  id: int("id").autoincrement().primaryKey(),
  workOrderId: int("workOrderId").notNull(),
  
  taskNumber: int("taskNumber").notNull(),
  description: text("description").notNull(),
  
  // Target
  assetId: int("assetId"),
  componentId: int("componentId"),
  
  // Status
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "skipped"]).default("pending"),
  completedAt: timestamp("completedAt"),
  completedById: int("completedById"),
  
  // Result
  result: mysqlEnum("result", ["pass", "fail", "na"]),
  resultNotes: text("resultNotes"),
  measurements: json("measurements").$type<Record<string, unknown>>(),
  
  // Attribute updates triggered
  attributeUpdates: json("attributeUpdates").$type<Array<{attributeKey: string; oldValue: unknown; newValue: unknown}>>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkOrderTask = typeof workOrderTasks.$inferSelect;
export type InsertWorkOrderTask = typeof workOrderTasks.$inferInsert;

// Spare parts inventory
export const spareParts = mysqlTable("spareParts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  
  // Identity
  partNumber: varchar("partNumber", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "electrical", "mechanical", "consumable", "safety", "other"
  ]),
  
  // Compatibility
  compatibleAssetTypes: json("compatibleAssetTypes").$type<string[]>(),
  compatibleManufacturers: json("compatibleManufacturers").$type<string[]>(),
  compatibleModels: json("compatibleModels").$type<string[]>(),
  
  // Inventory
  quantityOnHand: int("quantityOnHand").default(0),
  minimumStock: int("minimumStock").default(0),
  reorderPoint: int("reorderPoint").default(0),
  reorderQuantity: int("reorderQuantity"),
  
  // Location
  storageLocation: varchar("storageLocation", { length: 255 }),
  siteId: int("siteId"), // if stored at a specific site
  
  // Cost
  unitCost: decimal("unitCost", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  
  // Supplier
  preferredSupplier: varchar("preferredSupplier", { length: 255 }),
  leadTimeDays: int("leadTimeDays"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SparePart = typeof spareParts.$inferSelect;
export type InsertSparePart = typeof spareParts.$inferInsert;

// Parts usage - consumption tracking
export const partsUsage = mysqlTable("partsUsage", {
  id: int("id").autoincrement().primaryKey(),
  partId: int("partId").notNull(),
  workOrderId: int("workOrderId"),
  assetId: int("assetId"),
  
  quantity: int("quantity").notNull(),
  usageType: mysqlEnum("usageType", ["consumed", "returned", "damaged"]).default("consumed"),
  
  usedById: int("usedById"),
  usedAt: timestamp("usedAt").defaultNow().notNull(),
  notes: text("notes"),
});

export type PartsUsage = typeof partsUsage.$inferSelect;
export type InsertPartsUsage = typeof partsUsage.$inferInsert;


// ═══════════════════════════════════════════════════════════════
// PHASE 9: UNIVERSAL ARTIFACT ARCHITECTURE
// ═══════════════════════════════════════════════════════════════

// Core artifacts table - universal container for ALL input types
export const artifacts = mysqlTable("artifacts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  
  // Artifact identity
  artifactType: mysqlEnum("artifactType", [
    "document", "image", "audio", "video", "message", "meeting", "contract"
  ]).notNull(),
  artifactSubtype: varchar("artifactSubtype", { length: 100 }),
  artifactCode: varchar("artifactCode", { length: 50 }).unique(), // ART-2026-00001
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  
  // Raw storage (immutable)
  originalFilename: varchar("originalFilename", { length: 500 }),
  originalFileUrl: text("originalFileUrl").notNull(),
  originalFileHash: varchar("originalFileHash", { length: 64 }).notNull(), // SHA-256
  originalFileSizeBytes: bigint("originalFileSizeBytes", { mode: "number" }),
  originalMimeType: varchar("originalMimeType", { length: 100 }),
  rawMetadata: json("rawMetadata").$type<Record<string, unknown>>(),
  
  // Ingestion context
  ingestionChannel: mysqlEnum("ingestionChannel", [
    "upload", "email", "whatsapp", "api", "meeting_bot", "iot", "manual"
  ]).notNull().default("upload"),
  ingestionSourceId: varchar("ingestionSourceId", { length: 255 }),
  ingestionSourceMetadata: json("ingestionSourceMetadata").$type<Record<string, unknown>>(),
  
  // Sender info
  senderType: mysqlEnum("senderType", ["user", "external_contact", "system", "api"]),
  senderId: int("senderId"),
  senderExternalContactId: int("senderExternalContactId"),
  senderIdentifier: varchar("senderIdentifier", { length: 255 }),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  
  // Context links (hierarchy)
  portfolioId: int("portfolioId"),
  projectId: int("projectId"),
  siteId: int("siteId"),
  systemId: int("systemId"),
  assetId: int("assetId"),
  
  // Lifecycle stage context
  lifecycleStage: mysqlEnum("lifecycleStage", [
    "origination", "development", "due_diligence", "construction", "commissioning", "operations"
  ]),
  
  // Processing status
  processingStatus: mysqlEnum("processingStatus", [
    "pending", "preprocessing", "processed", "ai_analyzing", "ai_complete", "failed"
  ]).default("pending"),
  preprocessingStatus: mysqlEnum("preprocessingStatus", [
    "pending", "cleaning", "transcribing", "complete", "failed"
  ]),
  preprocessingResultUrl: text("preprocessingResultUrl"),
  
  // AI analysis status
  aiAnalysisStatus: mysqlEnum("aiAnalysisStatus", [
    "pending", "queued", "analyzing", "complete", "failed"
  ]).default("pending"),
  aiAnalysisStartedAt: timestamp("aiAnalysisStartedAt"),
  aiAnalysisCompletedAt: timestamp("aiAnalysisCompletedAt"),
  aiAnalysisRunId: varchar("aiAnalysisRunId", { length: 36 }),
  
  // Categorization
  aiSuggestedCategory: varchar("aiSuggestedCategory", { length: 100 }),
  aiSuggestedSubcategory: varchar("aiSuggestedSubcategory", { length: 100 }),
  aiCategoryConfidence: decimal("aiCategoryConfidence", { precision: 5, scale: 4 }),
  confirmedCategory: varchar("confirmedCategory", { length: 100 }),
  confirmedSubcategory: varchar("confirmedSubcategory", { length: 100 }),
  categorizedBy: int("categorizedBy"),
  categorizedAt: timestamp("categorizedAt"),
  tags: json("tags").$type<string[]>(),
  
  // Verification status
  verificationStatus: mysqlEnum("verificationStatus", [
    "unverified", "ai_verified", "human_verified", "rejected"
  ]).default("unverified"),
  verifiedBy: int("verifiedBy"),
  verifiedAt: timestamp("verifiedAt"),
  verificationNotes: text("verificationNotes"),
  
  // Versioning
  version: int("version").default(1),
  previousVersionId: int("previousVersionId"),
  isCurrentVersion: boolean("isCurrentVersion").default(true),
  supersededAt: timestamp("supersededAt"),
  supersededBy: int("supersededBy"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
});

export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = typeof artifacts.$inferInsert;

// Image-specific extension table
export const artifactImages = mysqlTable("artifactImages", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: int("artifactId").notNull(),
  
  // Image classification
  imageKind: mysqlEnum("imageKind", [
    "site_photo", "equipment_nameplate", "invoice_scan", "permit_scan", 
    "safety_issue", "progress_photo", "thermal_image", "drone_capture", 
    "screenshot", "drawing", "diagram", "other"
  ]).notNull(),
  
  // Capture metadata
  takenAt: timestamp("takenAt"),
  cameraMake: varchar("cameraMake", { length: 100 }),
  cameraModel: varchar("cameraModel", { length: 100 }),
  
  // Location
  gpsLatitude: decimal("gpsLatitude", { precision: 10, scale: 7 }),
  gpsLongitude: decimal("gpsLongitude", { precision: 10, scale: 7 }),
  gpsAltitude: decimal("gpsAltitude", { precision: 10, scale: 2 }),
  locationDescription: varchar("locationDescription", { length: 255 }),
  
  // Image properties
  widthPx: int("widthPx"),
  heightPx: int("heightPx"),
  orientation: varchar("orientation", { length: 50 }),
  
  // OCR for nameplates/documents
  containsText: boolean("containsText").default(false),
  ocrText: text("ocrText"),
  ocrConfidence: decimal("ocrConfidence", { precision: 5, scale: 4 }),
  
  // Equipment photos
  equipmentAssetId: int("equipmentAssetId"),
  equipmentCondition: mysqlEnum("equipmentCondition", ["good", "fair", "poor", "damaged"]),
  
  // Progress photos
  constructionPhase: varchar("constructionPhase", { length: 100 }),
  milestoneReference: varchar("milestoneReference", { length: 100 }),
  
  // Thermal images
  thermalMinTemp: decimal("thermalMinTemp", { precision: 6, scale: 2 }),
  thermalMaxTemp: decimal("thermalMaxTemp", { precision: 6, scale: 2 }),
  thermalAnomalyDetected: boolean("thermalAnomalyDetected"),
  
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArtifactImage = typeof artifactImages.$inferSelect;
export type InsertArtifactImage = typeof artifactImages.$inferInsert;

// Audio-specific extension table
export const artifactAudio = mysqlTable("artifactAudio", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: int("artifactId").notNull(),
  
  // Audio metadata
  durationSeconds: int("durationSeconds"),
  sampleRate: int("sampleRate"),
  channels: int("channels"),
  bitrate: int("bitrate"),
  
  // Recording context
  recordedAt: timestamp("recordedAt"),
  recordingType: mysqlEnum("recordingType", ["voice_note", "call", "meeting", "site_ambient"]),
  
  // Participants
  participants: json("participants").$type<Array<{
    name: string;
    role?: string;
    speakerId?: string;
  }>>(),
  
  // Processing results
  audioPreprocessingStatus: mysqlEnum("audioPreprocessingStatus", [
    "pending", "noise_reduction", "diarization", "complete"
  ]).default("pending"),
  cleanedAudioUrl: text("cleanedAudioUrl"),
  noiseReductionApplied: boolean("noiseReductionApplied").default(false),
  diarizationApplied: boolean("diarizationApplied").default(false),
  speakerCount: int("speakerCount"),
  
  // Transcript
  transcriptStatus: mysqlEnum("transcriptStatus", ["pending", "processing", "complete", "failed"]).default("pending"),
  transcriptText: text("transcriptText"),
  transcriptSegments: json("transcriptSegments").$type<Array<{
    startS: number;
    endS: number;
    speaker?: string;
    text: string;
    confidence?: number;
  }>>(),
  transcriptLanguage: varchar("transcriptLanguage", { length: 10 }),
  transcriptConfidence: decimal("transcriptConfidence", { precision: 5, scale: 4 }),
  
  aiExtractionComplete: boolean("aiExtractionComplete").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArtifactAudio = typeof artifactAudio.$inferSelect;
export type InsertArtifactAudio = typeof artifactAudio.$inferInsert;

// Video-specific extension table
export const artifactVideo = mysqlTable("artifactVideo", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: int("artifactId").notNull(),
  
  // Video metadata
  durationSeconds: int("durationSeconds"),
  widthPx: int("widthPx"),
  heightPx: int("heightPx"),
  frameRate: decimal("frameRate", { precision: 6, scale: 2 }),
  codec: varchar("codec", { length: 50 }),
  
  // Recording context
  recordedAt: timestamp("recordedAt"),
  videoType: mysqlEnum("videoType", [
    "site_walkthrough", "inspection", "meeting", "drone", "training", "other"
  ]),
  
  // Location
  gpsLatitude: decimal("gpsLatitude", { precision: 10, scale: 7 }),
  gpsLongitude: decimal("gpsLongitude", { precision: 10, scale: 7 }),
  
  // Processing
  thumbnailUrl: text("thumbnailUrl"),
  previewGifUrl: text("previewGifUrl"),
  
  // Transcript
  hasAudio: boolean("hasAudio").default(true),
  transcriptText: text("transcriptText"),
  transcriptSegments: json("transcriptSegments").$type<Array<{
    startS: number;
    endS: number;
    speaker?: string;
    text: string;
  }>>(),
  
  // Key frames
  keyFrames: json("keyFrames").$type<Array<{
    timestampS: number;
    frameUrl: string;
    description?: string;
  }>>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArtifactVideo = typeof artifactVideo.$inferSelect;
export type InsertArtifactVideo = typeof artifactVideo.$inferInsert;

// Message-specific extension table (WhatsApp, Email, etc.)
export const artifactMessages = mysqlTable("artifactMessages", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: int("artifactId").notNull(),
  
  // Message metadata
  messageType: mysqlEnum("messageType", ["whatsapp", "email", "telegram", "sms", "slack"]).notNull(),
  messageIdExternal: varchar("messageIdExternal", { length: 255 }),
  
  // Threading
  threadId: varchar("threadId", { length: 255 }),
  inReplyToId: varchar("inReplyToId", { length: 255 }),
  threadPosition: int("threadPosition"),
  
  // Sender/recipients
  fromAddress: varchar("fromAddress", { length: 255 }),
  fromName: varchar("fromName", { length: 255 }),
  toAddresses: json("toAddresses").$type<string[]>(),
  ccAddresses: json("ccAddresses").$type<string[]>(),
  
  // Content
  subject: varchar("subject", { length: 500 }),
  bodyText: text("bodyText"),
  bodyHtml: text("bodyHtml"),
  
  // Attachments
  hasAttachments: boolean("hasAttachments").default(false),
  attachmentCount: int("attachmentCount").default(0),
  attachmentArtifactIds: json("attachmentArtifactIds").$type<number[]>(),
  
  // Message-specific
  sentAt: timestamp("sentAt"),
  receivedAt: timestamp("receivedAt"),
  isInbound: boolean("isInbound").default(true),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArtifactMessage = typeof artifactMessages.$inferSelect;
export type InsertArtifactMessage = typeof artifactMessages.$inferInsert;

// Meeting-specific extension table
export const artifactMeetings = mysqlTable("artifactMeetings", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: int("artifactId").notNull(),
  
  // Meeting metadata
  meetingType: mysqlEnum("meetingType", [
    "internal", "external", "site_visit", "due_diligence", "board", "investor", "other"
  ]).notNull(),
  meetingTitle: varchar("meetingTitle", { length: 500 }),
  
  // Timing
  scheduledStart: timestamp("scheduledStart"),
  scheduledEnd: timestamp("scheduledEnd"),
  actualStart: timestamp("actualStart"),
  actualEnd: timestamp("actualEnd"),
  durationMinutes: int("durationMinutes"),
  
  // Location
  location: varchar("location", { length: 255 }),
  isVirtual: boolean("isVirtual").default(true),
  meetingPlatform: varchar("meetingPlatform", { length: 50 }),
  meetingLink: text("meetingLink"),
  
  // Participants
  participants: json("participants").$type<Array<{
    name: string;
    email?: string;
    role?: string;
    company?: string;
    attended: boolean;
    speakerId?: string;
  }>>(),
  organizerName: varchar("organizerName", { length: 255 }),
  organizerEmail: varchar("organizerEmail", { length: 255 }),
  
  // Content
  agenda: text("agenda"),
  transcriptText: text("transcriptText"),
  transcriptSegments: json("transcriptSegments").$type<Array<{
    startS: number;
    endS: number;
    speaker: string;
    text: string;
  }>>(),
  summary: text("summary"),
  
  // Extracted items
  actionItems: json("actionItems").$type<Array<{
    description: string;
    assignee?: string;
    dueDate?: string;
    priority?: string;
    status?: string;
  }>>(),
  decisions: json("decisions").$type<Array<{
    description: string;
    madeBy?: string;
    timestamp?: number;
  }>>(),
  keyTopics: json("keyTopics").$type<string[]>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArtifactMeeting = typeof artifactMeetings.$inferSelect;
export type InsertArtifactMeeting = typeof artifactMeetings.$inferInsert;

// Contract-specific extension table
export const artifactContracts = mysqlTable("artifactContracts", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: int("artifactId").notNull(),
  
  // Contract identity
  contractType: mysqlEnum("contractType", [
    "ppa", "lease", "epc", "om", "financing", "offtake", "interconnection", "insurance", "other"
  ]).notNull(),
  contractNumber: varchar("contractNumber", { length: 100 }),
  contractTitle: varchar("contractTitle", { length: 500 }),
  
  // Parties
  parties: json("parties").$type<Array<{
    name: string;
    role: string;
    type?: string;
    address?: string;
  }>>(),
  counterpartyName: varchar("counterpartyName", { length: 255 }),
  counterpartyType: varchar("counterpartyType", { length: 100 }),
  
  // Dates
  effectiveDate: date("effectiveDate"),
  expiryDate: date("expiryDate"),
  termYears: int("termYears"),
  renewalTerms: text("renewalTerms"),
  
  // Financial terms
  contractValue: decimal("contractValue", { precision: 18, scale: 2 }),
  currency: varchar("currency", { length: 3 }),
  paymentTerms: text("paymentTerms"),
  
  // PPA specific
  ppaCapacityKw: decimal("ppaCapacityKw", { precision: 12, scale: 2 }),
  ppaTariffRate: decimal("ppaTariffRate", { precision: 10, scale: 4 }),
  ppaTariffEscalation: decimal("ppaTariffEscalation", { precision: 5, scale: 2 }),
  
  // Lease specific
  leaseAreaSqm: decimal("leaseAreaSqm", { precision: 12, scale: 2 }),
  leaseAnnualRent: decimal("leaseAnnualRent", { precision: 18, scale: 2 }),
  leaseEscalationPct: decimal("leaseEscalationPct", { precision: 5, scale: 2 }),
  
  // Status
  contractStatus: mysqlEnum("contractStatus", [
    "draft", "negotiating", "executed", "active", "expired", "terminated"
  ]).default("draft"),
  executionDate: date("executionDate"),
  executedBy: varchar("executedBy", { length: 255 }),
  
  // Amendments
  amendmentCount: int("amendmentCount").default(0),
  latestAmendmentDate: date("latestAmendmentDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArtifactContract = typeof artifactContracts.$inferSelect;
export type InsertArtifactContract = typeof artifactContracts.$inferInsert;

// Contract obligations/covenants
export const contractObligations = mysqlTable("contractObligations", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  artifactId: int("artifactId").notNull(),
  
  obligationType: mysqlEnum("obligationType", [
    "payment", "reporting", "insurance", "maintenance", "compliance", "notification", "other"
  ]).notNull(),
  
  obligor: varchar("obligor", { length: 255 }).notNull(),
  obligorRole: varchar("obligorRole", { length: 100 }),
  
  description: text("description").notNull(),
  
  // Timing
  frequency: mysqlEnum("frequency", ["one_time", "monthly", "quarterly", "annually", "ongoing"]),
  dueDate: date("dueDate"),
  dueDayOfPeriod: int("dueDayOfPeriod"),
  
  // Compliance tracking
  complianceStatus: mysqlEnum("complianceStatus", [
    "pending", "compliant", "non_compliant", "waived"
  ]).default("pending"),
  lastComplianceCheck: date("lastComplianceCheck"),
  nextDueDate: date("nextDueDate"),
  
  // Source in contract
  sourceSection: varchar("sourceSection", { length: 50 }),
  sourcePage: int("sourcePage"),
  sourceText: text("sourceText"),
  
  // Linked workspace item
  workspaceItemId: int("workspaceItemId"),
  
  // Alerts
  alertDaysBefore: int("alertDaysBefore").default(30),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractObligation = typeof contractObligations.$inferSelect;
export type InsertContractObligation = typeof contractObligations.$inferInsert;

// Contract amendments
export const contractAmendments = mysqlTable("contractAmendments", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  amendmentArtifactId: int("amendmentArtifactId").notNull(),
  
  amendmentNumber: int("amendmentNumber").notNull(),
  amendmentDate: date("amendmentDate").notNull(),
  effectiveDate: date("effectiveDate"),
  
  description: text("description"),
  changesSummary: json("changesSummary").$type<Array<{
    field: string;
    oldValue: string;
    newValue: string;
  }>>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractAmendment = typeof contractAmendments.$inferSelect;
export type InsertContractAmendment = typeof contractAmendments.$inferInsert;

// AI extraction outputs from artifacts
export const artifactExtractions = mysqlTable("artifactExtractions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Source
  artifactId: int("artifactId").notNull(),
  artifactVersion: int("artifactVersion"),
  
  // Extraction run
  extractionRunId: varchar("extractionRunId", { length: 36 }).notNull(),
  extractionModel: varchar("extractionModel", { length: 50 }),
  extractionPromptVersion: varchar("extractionPromptVersion", { length: 20 }),
  extractedAt: timestamp("extractedAt").defaultNow().notNull(),
  
  // What was extracted
  fieldKey: varchar("fieldKey", { length: 100 }).notNull(),
  fieldCategory: mysqlEnum("fieldCategory", [
    "identity", "technical", "commercial", "legal", "financial", "operational", "compliance"
  ]).notNull(),
  
  // Value (polymorphic)
  extractedValueText: text("extractedValueText"),
  extractedValueNumeric: decimal("extractedValueNumeric", { precision: 18, scale: 4 }),
  extractedValueDate: date("extractedValueDate"),
  extractedValueBoolean: boolean("extractedValueBoolean"),
  extractedValueJson: json("extractedValueJson").$type<unknown>(),
  unit: varchar("unit", { length: 50 }),
  
  // Source location
  sourceType: mysqlEnum("sourceType", ["page", "timestamp", "segment", "cell"]),
  sourcePage: int("sourcePage"),
  sourceTimestampStart: decimal("sourceTimestampStart", { precision: 10, scale: 2 }),
  sourceTimestampEnd: decimal("sourceTimestampEnd", { precision: 10, scale: 2 }),
  sourceCellReference: varchar("sourceCellReference", { length: 20 }),
  sourceSnippet: text("sourceSnippet"),
  
  // Confidence
  confidence: decimal("confidence", { precision: 5, scale: 4 }).notNull(),
  extractionNotes: text("extractionNotes"),
  
  // Verification
  verificationStatus: mysqlEnum("verificationStatus", [
    "unverified", "verified", "rejected", "corrected"
  ]).default("unverified"),
  verifiedBy: int("verifiedBy"),
  verifiedAt: timestamp("verifiedAt"),
  verificationNotes: text("verificationNotes"),
  
  // Correction tracking
  wasCorrected: boolean("wasCorrected").default(false),
  originalValueIfCorrected: json("originalValueIfCorrected").$type<unknown>(),
  
  // Destination (where applied)
  appliedToEntityType: varchar("appliedToEntityType", { length: 50 }),
  appliedToEntityId: int("appliedToEntityId"),
  appliedToAttributeKey: varchar("appliedToAttributeKey", { length: 100 }),
  appliedAttributeId: int("appliedAttributeId"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArtifactExtraction = typeof artifactExtractions.$inferSelect;
export type InsertArtifactExtraction = typeof artifactExtractions.$inferInsert;

// Entity mentions found in artifacts
export const artifactEntityMentions = mysqlTable("artifactEntityMentions", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: int("artifactId").notNull(),
  extractionRunId: varchar("extractionRunId", { length: 36 }),
  
  // What was mentioned
  mentionText: varchar("mentionText", { length: 500 }).notNull(),
  mentionType: mysqlEnum("mentionType", [
    "site", "asset", "company", "person", "location", "date", "amount", "other"
  ]).notNull(),
  
  // Source location
  sourcePage: int("sourcePage"),
  sourceTimestampStart: decimal("sourceTimestampStart", { precision: 10, scale: 2 }),
  sourceTimestampEnd: decimal("sourceTimestampEnd", { precision: 10, scale: 2 }),
  sourceSnippet: text("sourceSnippet"),
  
  // Resolution
  resolvedEntityType: varchar("resolvedEntityType", { length: 50 }),
  resolvedEntityId: int("resolvedEntityId"),
  resolutionConfidence: decimal("resolutionConfidence", { precision: 5, scale: 4 }),
  resolutionStatus: mysqlEnum("resolutionStatus", [
    "unresolved", "auto_resolved", "manual_resolved", "ignored"
  ]).default("unresolved"),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArtifactEntityMention = typeof artifactEntityMentions.$inferSelect;
export type InsertArtifactEntityMention = typeof artifactEntityMentions.$inferInsert;

// ═══════════════════════════════════════════════════════════════
// ASSET LIFECYCLE STAGES
// ═══════════════════════════════════════════════════════════════

// Lifecycle stage definitions
export const lifecycleStages = mysqlTable("lifecycleStages", {
  id: int("id").autoincrement().primaryKey(),
  
  stageKey: varchar("stageKey", { length: 50 }).notNull().unique(),
  stageName: varchar("stageName", { length: 100 }).notNull(),
  stageOrder: int("stageOrder").notNull(),
  description: text("description"),
  
  // Typical duration
  typicalDurationMonths: int("typicalDurationMonths"),
  
  // Required milestones for stage completion
  milestones: json("milestones").$type<Array<{
    milestone: string;
    description: string;
    required: boolean;
  }>>(),
  
  // Required attributes for stage exit
  requiredAttributes: json("requiredAttributes").$type<Array<{
    attributeKey: string;
    category: string;
    requiredForExit: boolean;
  }>>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LifecycleStage = typeof lifecycleStages.$inferSelect;
export type InsertLifecycleStage = typeof lifecycleStages.$inferInsert;

// Stage-specific attribute definitions
export const stageAttributeDefinitions = mysqlTable("stageAttributeDefinitions", {
  id: int("id").autoincrement().primaryKey(),
  
  lifecycleStage: varchar("lifecycleStage", { length: 50 }).notNull(),
  attributeKey: varchar("attributeKey", { length: 100 }).notNull(),
  attributeCategory: mysqlEnum("attributeCategory", [
    "identity", "technical", "commercial", "financial", "compliance", "operational"
  ]).notNull(),
  
  displayName: varchar("displayName", { length: 255 }).notNull(),
  description: text("description"),
  
  // Data type
  dataType: mysqlEnum("dataType", ["text", "number", "date", "boolean", "json", "file"]).notNull(),
  unit: varchar("unit", { length: 50 }),
  
  // Validation
  required: boolean("required").default(false),
  requiredForStageExit: boolean("requiredForStageExit").default(false),
  validationRules: json("validationRules").$type<{
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  }>(),
  
  // Display
  displayOrder: int("displayOrder"),
  displayGroup: varchar("displayGroup", { length: 100 }),
  
  // Source hints
  typicalSources: json("typicalSources").$type<string[]>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StageAttributeDefinition = typeof stageAttributeDefinitions.$inferSelect;
export type InsertStageAttributeDefinition = typeof stageAttributeDefinitions.$inferInsert;

// Asset lifecycle tracking (which stage an asset is in)
export const assetLifecycleTracking = mysqlTable("assetLifecycleTracking", {
  id: int("id").autoincrement().primaryKey(),
  
  // Can track at different levels
  projectId: int("projectId"),
  siteId: int("siteId"),
  assetId: int("assetId"),
  
  currentStage: varchar("currentStage", { length: 50 }).notNull(),
  stageEnteredAt: timestamp("stageEnteredAt").notNull(),
  expectedStageExitAt: timestamp("expectedStageExitAt"),
  
  // Completeness tracking
  stageCompleteness: decimal("stageCompleteness", { precision: 5, scale: 2 }).default("0"),
  milestonesCompleted: int("milestonesCompleted").default(0),
  milestonesTotal: int("milestonesTotal").default(0),
  attributesCompleted: int("attributesCompleted").default(0),
  attributesRequired: int("attributesRequired").default(0),
  
  // Status
  isBlocked: boolean("isBlocked").default(false),
  blockedReason: text("blockedReason"),
  
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
});

export type AssetLifecycleTracking = typeof assetLifecycleTracking.$inferSelect;
export type InsertAssetLifecycleTracking = typeof assetLifecycleTracking.$inferInsert;

// Stage milestone completions
export const stageMilestoneCompletions = mysqlTable("stageMilestoneCompletions", {
  id: int("id").autoincrement().primaryKey(),
  
  lifecycleTrackingId: int("lifecycleTrackingId").notNull(),
  milestoneKey: varchar("milestoneKey", { length: 100 }).notNull(),
  
  completedAt: timestamp("completedAt").notNull(),
  completedBy: int("completedBy"),
  
  // Evidence
  evidenceArtifactIds: json("evidenceArtifactIds").$type<number[]>(),
  notes: text("notes"),
  
  // Verification
  verified: boolean("verified").default(false),
  verifiedBy: int("verifiedBy"),
  verifiedAt: timestamp("verifiedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StageMilestoneCompletion = typeof stageMilestoneCompletions.$inferSelect;
export type InsertStageMilestoneCompletion = typeof stageMilestoneCompletions.$inferInsert;

// Stage transition history
export const stageTransitionHistory = mysqlTable("stageTransitionHistory", {
  id: int("id").autoincrement().primaryKey(),
  
  lifecycleTrackingId: int("lifecycleTrackingId").notNull(),
  
  fromStage: varchar("fromStage", { length: 50 }),
  toStage: varchar("toStage", { length: 50 }).notNull(),
  
  transitionedAt: timestamp("transitionedAt").notNull(),
  transitionedBy: int("transitionedBy"),
  
  // Metrics at transition
  daysInPreviousStage: int("daysInPreviousStage"),
  completenessAtTransition: decimal("completenessAtTransition", { precision: 5, scale: 2 }),
  
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StageTransitionHistory = typeof stageTransitionHistory.$inferSelect;
export type InsertStageTransitionHistory = typeof stageTransitionHistory.$inferInsert;


// ============ PROVIDER INTEGRATIONS ============

// Organization integrations - stores provider configurations per org
export const orgIntegrations = mysqlTable("orgIntegrations", {
  id: int("id").autoincrement().primaryKey(),
  
  organizationId: int("organizationId").notNull(),
  
  // Integration type and provider
  integrationType: mysqlEnum("integrationType", [
    "storage", "llm", "email_ingest", "whatsapp", "notify", "observability", "maps"
  ]).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(), // e.g., 's3', 'openai', 'sendgrid'
  
  // Status
  status: mysqlEnum("status", ["not_configured", "connected", "error", "disabled"]).default("not_configured").notNull(),
  
  // Non-secret configuration (JSON)
  config: json("config").$type<Record<string, unknown>>(),
  
  // Reference to encrypted secrets (stored separately)
  secretRef: varchar("secretRef", { length: 255 }),
  
  // Connection metadata
  connectedBy: int("connectedBy"),
  connectedAt: timestamp("connectedAt"),
  lastTestAt: timestamp("lastTestAt"),
  lastTestSuccess: boolean("lastTestSuccess"),
  lastError: text("lastError"),
  
  // Webhook configuration (for inbound integrations)
  webhookUrl: text("webhookUrl"),
  webhookSecret: varchar("webhookSecret", { length: 255 }),
  verifyToken: varchar("verifyToken", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrgIntegration = typeof orgIntegrations.$inferSelect;
export type InsertOrgIntegration = typeof orgIntegrations.$inferInsert;

// Integration events - audit log for integration activities
export const integrationEvents = mysqlTable("integrationEvents", {
  id: int("id").autoincrement().primaryKey(),
  
  organizationId: int("organizationId").notNull(),
  integrationId: int("integrationId").notNull(),
  
  eventType: mysqlEnum("eventType", [
    "connected", "disconnected", "config_changed", "test_success", "test_failed",
    "webhook_received", "token_refreshed", "error", "secret_rotated"
  ]).notNull(),
  
  eventData: json("eventData").$type<Record<string, unknown>>(),
  
  userId: int("userId"), // Who triggered the event (null for system events)
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IntegrationEvent = typeof integrationEvents.$inferSelect;
export type InsertIntegrationEvent = typeof integrationEvents.$inferInsert;

// Integration secrets - encrypted storage for API keys, tokens, etc.
export const integrationSecrets = mysqlTable("integrationSecrets", {
  id: int("id").autoincrement().primaryKey(),
  
  organizationId: int("organizationId").notNull(),
  integrationId: int("integrationId").notNull(),
  
  // Secret identification
  secretKey: varchar("secretKey", { length: 100 }).notNull(), // e.g., 'apiKey', 'accessToken'
  
  // Encrypted value (using AES-256-GCM)
  encryptedValue: text("encryptedValue").notNull(),
  iv: varchar("iv", { length: 32 }).notNull(), // Initialization vector
  authTag: varchar("authTag", { length: 32 }).notNull(), // Authentication tag
  
  // Key versioning for rotation
  keyVersion: int("keyVersion").default(1).notNull(),
  
  // Metadata
  lastRotatedAt: timestamp("lastRotatedAt"),
  expiresAt: timestamp("expiresAt"), // For tokens with expiry
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IntegrationSecret = typeof integrationSecrets.$inferSelect;
export type InsertIntegrationSecret = typeof integrationSecrets.$inferInsert;

// Organization feature flags - org-level overrides for feature flags
export const orgFeatureFlags = mysqlTable("orgFeatureFlags", {
  id: int("id").autoincrement().primaryKey(),
  
  organizationId: int("organizationId").notNull(),
  
  flagKey: varchar("flagKey", { length: 100 }).notNull(),
  enabled: boolean("enabled").notNull(),
  
  // Optional: project-level override
  projectId: int("projectId"),
  
  // Metadata
  enabledBy: int("enabledBy"),
  enabledAt: timestamp("enabledAt"),
  reason: text("reason"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrgFeatureFlag = typeof orgFeatureFlags.$inferSelect;
export type InsertOrgFeatureFlag = typeof orgFeatureFlags.$inferInsert;

// Webhook events log - for debugging and monitoring inbound webhooks
export const webhookEventsLog = mysqlTable("webhookEventsLog", {
  id: int("id").autoincrement().primaryKey(),
  
  organizationId: int("organizationId").notNull(),
  integrationId: int("integrationId").notNull(),
  
  // Request details
  method: varchar("method", { length: 10 }).notNull(),
  path: text("path").notNull(),
  headers: json("headers").$type<Record<string, string>>(),
  body: text("body"), // Raw body (truncated if too large)
  
  // Processing result
  signatureValid: boolean("signatureValid"),
  processed: boolean("processed").default(false),
  processedAt: timestamp("processedAt"),
  errorMessage: text("errorMessage"),
  
  // Idempotency
  idempotencyKey: varchar("idempotencyKey", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WebhookEventLog = typeof webhookEventsLog.$inferSelect;
export type InsertWebhookEventLog = typeof webhookEventsLog.$inferInsert;


// ============ DATA IMMUTABILITY + VIEW SCOPING ============

// Visibility state enum for soft-delete
export const visibilityStateEnum = mysqlEnum("visibilityState", ["active", "archived", "superseded"]);

// View Scopes - defines a projection (Portfolio View, Data Room, Report Pack, Checklist, etc.)
export const viewScopes = mysqlTable("viewScopes", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  viewType: mysqlEnum("viewType", ["portfolio", "dataroom", "report", "checklist", "custom"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: int("ownerId").notNull(),
  
  // Scope configuration
  projectId: int("projectId"), // Optional - if scoped to a specific project
  config: json("config").$type<{
    filters?: Record<string, unknown>;
    sortOrder?: string;
    columns?: string[];
  }>(),
  
  // Sharing
  isPublic: boolean("isPublic").default(false),
  sharedWith: json("sharedWith").$type<number[]>(), // User IDs
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ViewScope = typeof viewScopes.$inferSelect;
export type InsertViewScope = typeof viewScopes.$inferInsert;

// View Items - tracks which entities are included/excluded in a view
export const viewItems = mysqlTable("viewItems", {
  id: int("id").autoincrement().primaryKey(),
  viewId: int("viewId").notNull(),
  
  // Entity reference
  entityType: mysqlEnum("entityType", ["asset", "project", "document", "field", "evidence", "task", "rfi", "checklist_item"]).notNull(),
  entityId: int("entityId").notNull(),
  
  // Inclusion state
  inclusionState: mysqlEnum("inclusionState", ["included", "excluded", "suggested"]).default("included").notNull(),
  
  // Audit
  reason: text("reason"),
  updatedBy: int("updatedBy").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  viewEntityUnique: uniqueIndex("view_entity_unique").on(table.viewId, table.entityType, table.entityId),
}));

export type ViewItem = typeof viewItems.$inferSelect;
export type InsertViewItem = typeof viewItems.$inferInsert;

// View Field Overrides - controls visibility of specific fields in a view
export const viewFieldOverrides = mysqlTable("viewFieldOverrides", {
  id: int("id").autoincrement().primaryKey(),
  viewId: int("viewId").notNull(),
  
  // Field reference
  assetId: int("assetId").notNull(),
  fieldKey: varchar("fieldKey", { length: 255 }).notNull(), // or extracted_field_id
  
  // Override state
  state: mysqlEnum("state", ["show", "hide", "show_latest_only", "show_specific_version", "pin_version"]).default("show").notNull(),
  specificVersionId: int("specificVersionId"), // If show_specific_version
  
  // Audit
  reason: text("reason"),
  updatedBy: int("updatedBy").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  viewFieldUnique: uniqueIndex("view_field_unique").on(table.viewId, table.assetId, table.fieldKey),
}));

export type ViewFieldOverride = typeof viewFieldOverrides.$inferSelect;
export type InsertViewFieldOverride = typeof viewFieldOverrides.$inferInsert;

// Asset Field History Ledger - tracks all changes to asset data points
export const assetFieldHistory = mysqlTable("assetFieldHistory", {
  id: int("id").autoincrement().primaryKey(),
  
  // Reference
  assetId: int("assetId").notNull(),
  fieldKey: varchar("fieldKey", { length: 255 }).notNull(),
  
  // Values
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  
  // Change metadata
  changeType: mysqlEnum("changeType", [
    "ai_extracted",
    "manual_edit", 
    "verified",
    "suppressed_in_view",
    "restored_in_view",
    "superseded",
    "archived",
    "unarchived"
  ]).notNull(),
  
  // Source provenance (for AI/document-based changes)
  sourceFileId: int("sourceFileId"),
  sourcePage: int("sourcePage"),
  sourceSnippet: text("sourceSnippet"),
  confidence: decimal("confidence", { precision: 5, scale: 4 }), // 0.0000 to 1.0000
  
  // Verification
  verifiedBy: int("verifiedBy"),
  verifiedAt: timestamp("verifiedAt"),
  
  // Audit
  changedBy: int("changedBy").notNull(),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
  reason: text("reason"),
  
  // View context (if change was view-specific)
  viewId: int("viewId"),
});

export type AssetFieldHistory = typeof assetFieldHistory.$inferSelect;
export type InsertAssetFieldHistory = typeof assetFieldHistory.$inferInsert;

// Document Archive History - tracks document archival/restoration
export const documentArchiveHistory = mysqlTable("documentArchiveHistory", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  
  action: mysqlEnum("action", ["archived", "unarchived", "superseded"]).notNull(),
  reason: text("reason"),
  
  // Supersession
  supersededById: int("supersededById"), // New document that supersedes this one
  
  // Audit
  performedBy: int("performedBy").notNull(),
  performedAt: timestamp("performedAt").defaultNow().notNull(),
});

export type DocumentArchiveHistory = typeof documentArchiveHistory.$inferSelect;
export type InsertDocumentArchiveHistory = typeof documentArchiveHistory.$inferInsert;

// Export Manifests - tracks what was exported and when
export const exportManifests = mysqlTable("exportManifests", {
  id: int("id").autoincrement().primaryKey(),
  
  // View reference
  viewId: int("viewId"),
  viewType: varchar("viewType", { length: 50 }),
  
  // Export details
  exportType: mysqlEnum("exportType", ["csv", "excel", "pdf", "due_diligence_pack", "json"]).notNull(),
  exportedBy: int("exportedBy").notNull(),
  exportedAt: timestamp("exportedAt").defaultNow().notNull(),
  includeHidden: boolean("includeHidden").default(false),
  filters: json("filters").$type<Record<string, unknown>>(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending"),
  
  // Content manifest
  itemsExported: json("itemsExported").$type<{
    entityType: string;
    entityId: number;
    version?: number;
  }[]>(),
  
  // VATR provenance references
  provenanceRefs: json("provenanceRefs").$type<{
    fieldKey: string;
    sourceDocId: number;
    sourcePage: number;
    confidence: number;
  }[]>(),
  
  // File reference
  fileUrl: text("fileUrl"),
  fileSize: int("fileSize"),
  
  // Signoff (for external exports)
  requiresSignoff: boolean("requiresSignoff").default(false),
  signedOffBy: int("signedOffBy"),
  signedOffAt: timestamp("signedOffAt"),
});

export type ExportManifest = typeof exportManifests.$inferSelect;
export type InsertExportManifest = typeof exportManifests.$inferInsert;


// ============================================
// ASSET REQUIREMENT TEMPLATES (Configuration-Driven)
// ============================================

// Asset Requirement Templates - defines required docs, fields, checklist items per classification/profile
export const assetRequirementTemplates = mysqlTable("assetRequirementTemplates", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"), // null = global template
  
  // Matching criteria
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  assetClassification: mysqlEnum("assetClassification", [
    "residential",
    "small_commercial",
    "large_commercial",
    "industrial",
    "mini_grid",
    "mesh_grid",
    "interconnected_mini_grids",
    "grid_connected"
  ]),
  configurationProfile: mysqlEnum("configurationProfile", [
    "PV_ONLY",
    "PV_BESS",
    "PV_DG",
    "PV_BESS_DG",
    "BESS_ONLY",
    "DG_ONLY",
    "WIND_ONLY",
    "WIND_BESS",
    "HYDRO_ONLY",
    "MINIGRID_PV_BESS",
    "MINIGRID_PV_BESS_DG",
    "HYBRID_MULTI",
    "OTHER"
  ]),
  stage: varchar("stage", { length: 100 }), // development, construction, operational, etc.
  
  // Required items
  requiredDocumentTypes: json("requiredDocumentTypes").$type<{
    typeCode: string;
    typeName: string;
    required: boolean;
    description?: string;
  }[]>(),
  
  requiredFields: json("requiredFields").$type<{
    fieldKey: string;
    fieldName: string;
    required: boolean;
    dataType: "string" | "number" | "date" | "boolean" | "json";
    description?: string;
  }[]>(),
  
  requiredChecklistItems: json("requiredChecklistItems").$type<{
    itemCode: string;
    itemName: string;
    required: boolean;
    category?: string;
    description?: string;
  }[]>(),
  
  requiredMonitoringDatapoints: json("requiredMonitoringDatapoints").$type<{
    metricCode: string;
    metricName: string;
    required: boolean;
    unit?: string;
    frequency?: string;
  }[]>(),
  
  // Scoring weights
  completenessWeights: json("completenessWeights").$type<{
    documents: number;
    fields: number;
    checklist: number;
    monitoring: number;
  }>(),
  
  // Metadata
  isActive: boolean("isActive").default(true),
  priority: int("priority").default(0), // higher = preferred match
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssetRequirementTemplate = typeof assetRequirementTemplates.$inferSelect;
export type InsertAssetRequirementTemplate = typeof assetRequirementTemplates.$inferInsert;

// Asset View Templates - defines default UI columns, dashboards, diligence sections
export const assetViewTemplates = mysqlTable("assetViewTemplates", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"), // null = global template
  
  // Matching criteria
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  assetClassification: mysqlEnum("assetClassification", [
    "residential",
    "small_commercial",
    "large_commercial",
    "industrial",
    "mini_grid",
    "mesh_grid",
    "interconnected_mini_grids",
    "grid_connected"
  ]),
  configurationProfile: mysqlEnum("configurationProfile", [
    "PV_ONLY",
    "PV_BESS",
    "PV_DG",
    "PV_BESS_DG",
    "BESS_ONLY",
    "DG_ONLY",
    "WIND_ONLY",
    "WIND_BESS",
    "HYDRO_ONLY",
    "MINIGRID_PV_BESS",
    "MINIGRID_PV_BESS_DG",
    "HYBRID_MULTI",
    "OTHER"
  ]),
  
  // View configuration
  detailsTableColumns: json("detailsTableColumns").$type<{
    fieldKey: string;
    label: string;
    width?: number;
    sortable?: boolean;
    visible?: boolean;
    order: number;
  }[]>(),
  
  dashboardWidgets: json("dashboardWidgets").$type<{
    widgetType: string;
    title: string;
    dataSource: string;
    position: { x: number; y: number; w: number; h: number };
    config?: Record<string, unknown>;
  }[]>(),
  
  diligenceSections: json("diligenceSections").$type<{
    sectionCode: string;
    sectionName: string;
    order: number;
    subsections?: {
      code: string;
      name: string;
      order: number;
    }[];
  }[]>(),
  
  dataRoomCategories: json("dataRoomCategories").$type<{
    categoryCode: string;
    categoryName: string;
    order: number;
    documentTypes?: string[];
  }[]>(),
  
  // Metadata
  isActive: boolean("isActive").default(true),
  priority: int("priority").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssetViewTemplate = typeof assetViewTemplates.$inferSelect;
export type InsertAssetViewTemplate = typeof assetViewTemplates.$inferInsert;

// Asset Template Assignments - tracks which template is assigned to which asset
export const assetTemplateAssignments = mysqlTable("assetTemplateAssignments", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull(),
  
  // Template references
  requirementTemplateId: int("requirementTemplateId"),
  viewTemplateId: int("viewTemplateId"),
  
  // Assignment metadata
  assignmentType: mysqlEnum("assignmentType", ["auto_matched", "admin_override"]).default("auto_matched"),
  matchScore: decimal("matchScore", { precision: 5, scale: 2 }), // confidence of auto-match
  overrideReason: text("overrideReason"),
  
  assignedBy: int("assignedBy"),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

export type AssetTemplateAssignment = typeof assetTemplateAssignments.$inferSelect;
export type InsertAssetTemplateAssignment = typeof assetTemplateAssignments.$inferInsert;


// ═══════════════════════════════════════════════════════════════
// VIEW SCOPING - Saved views for filtering assets
// ═══════════════════════════════════════════════════════════════

// Portfolio Views - saved filter configurations
export const portfolioViews = mysqlTable("portfolioViews", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  portfolioId: int("portfolioId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Filter criteria (stored as JSON for flexibility)
  filterCriteria: json("filterCriteria").$type<{
    countries?: string[];
    statuses?: string[];
    assetClassifications?: string[];
    gridConnectionTypes?: string[];
    configurationProfiles?: string[];
    couplingTopologies?: string[];
    distributionTopologies?: string[];
    capacityMinMw?: number;
    capacityMaxMw?: number;
  }>(),
  
  // View type
  viewType: mysqlEnum("viewType", ["dynamic", "static"]).default("dynamic").notNull(),
  // dynamic = uses filterCriteria to query assets
  // static = uses viewAssets junction table for explicit asset list
  
  // Access control
  isPublic: boolean("isPublic").default(false),
  createdById: int("createdById"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortfolioView = typeof portfolioViews.$inferSelect;
export type InsertPortfolioView = typeof portfolioViews.$inferInsert;

// View Assets - junction table for static views (explicit asset membership)
export const viewAssets = mysqlTable("viewAssets", {
  id: int("id").autoincrement().primaryKey(),
  viewId: int("viewId").notNull(),
  projectId: int("projectId").notNull(), // References projects table (Asset)
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  addedById: int("addedById"),
});

export type ViewAsset = typeof viewAssets.$inferSelect;
export type InsertViewAsset = typeof viewAssets.$inferInsert;


// =============================================================================
// CONVERSATIONAL AGENT TABLES (WhatsApp + Email)
// =============================================================================

// User Identifiers - Unified identity model for all channels
// Replaces channel-specific tables (whatsappSenderMappings, emailSenderMappings)
// All channel identifiers resolve to the canonical User record
export const userIdentifiers = mysqlTable("userIdentifiers", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identity type and value
  type: mysqlEnum("type", ["whatsapp_phone", "email", "phone", "slack_id"]).notNull(),
  value: varchar("value", { length: 320 }).notNull(), // Email can be up to 320 chars
  
  // Link to canonical user
  userId: int("userId").notNull(), // FK to users table
  organizationId: int("organizationId"), // Optional org scope
  
  // Verification status
  status: mysqlEnum("status", ["pending", "verified", "revoked"]).default("pending").notNull(),
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: int("verifiedBy"), // Admin who verified
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  revokedAt: timestamp("revokedAt"),
  revokedBy: int("revokedBy"),
  revokedReason: text("revokedReason"),
});

export type UserIdentifier = typeof userIdentifiers.$inferSelect;
export type InsertUserIdentifier = typeof userIdentifiers.$inferInsert;

// Unclaimed Inbound - Quarantine for unknown senders
// Stores messages from unrecognized identifiers for admin triage
export const unclaimedInbound = mysqlTable("unclaimedInbound", {
  id: int("id").autoincrement().primaryKey(),
  
  // Source identification
  channel: mysqlEnum("channel", ["whatsapp", "email", "sms", "api"]).notNull(),
  senderIdentifier: varchar("senderIdentifier", { length: 320 }).notNull(), // Phone or email
  senderDisplayName: varchar("senderDisplayName", { length: 255 }), // If available
  
  // Message content
  messageType: mysqlEnum("messageType", ["text", "image", "document", "audio", "video", "location", "contact"]).default("text"),
  textContent: text("textContent"),
  mediaStorageKey: varchar("mediaStorageKey", { length: 500 }), // If we downloaded media
  mediaContentType: varchar("mediaContentType", { length: 100 }),
  mediaFilename: varchar("mediaFilename", { length: 255 }),
  
  // Raw payload for debugging
  rawPayload: json("rawPayload"),
  
  // Triage status
  status: mysqlEnum("status", ["pending", "claimed", "rejected", "expired"]).default("pending").notNull(),
  claimedByUserId: int("claimedByUserId"), // If admin links it to a user
  claimedAt: timestamp("claimedAt"),
  claimedByAdminId: int("claimedByAdminId"), // Admin who performed the claim
  rejectedReason: text("rejectedReason"),
  
  // Guessed organization (from email domain, etc.) - for admin notification
  guessedOrganizationId: int("guessedOrganizationId"),
  
  // Audit
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // Auto-delete after N days if unclaimed
});

export type UnclaimedInbound = typeof unclaimedInbound.$inferSelect;
export type InsertUnclaimedInbound = typeof unclaimedInbound.$inferInsert;

// Conversation Sessions - Lightweight context pointers for conversational AI
// Per Patch B: Store ONLY pointers + timestamps, NOT full AI memory blobs
// LLM context is assembled from message history + these pointers
export const conversationSessions = mysqlTable("conversationSessions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Session identity
  userId: int("userId").notNull(), // FK to users table
  organizationId: int("organizationId"), // REQUIRED: Org scope for this session (Phase 33)
  channel: mysqlEnum("channel", ["whatsapp", "email", "web_chat"]).notNull(),
  channelIdentifier: varchar("channelIdentifier", { length: 320 }), // Phone/email for this session
  channelThreadId: varchar("channelThreadId", { length: 100 }), // WhatsApp conversation id / email thread id
  
  // Context pointers (lightweight - just IDs)
  lastReferencedProjectId: int("lastReferencedProjectId"),
  lastReferencedSiteId: int("lastReferencedSiteId"),
  lastReferencedAssetId: int("lastReferencedAssetId"),
  lastReferencedDocumentId: int("lastReferencedDocumentId"),
  activeDataroomId: int("activeDataroomId"),
  activeViewScopeId: int("activeViewScopeId"),
  
  // Pending confirmation state (for safety rails)
  pendingAction: mysqlEnum("pendingAction", [
    "none",
    "confirm_export",
    "confirm_share_dataroom",
    "confirm_delete",
    "confirm_verify",
    "confirm_permission_change",
    "confirm_link_attachment"
  ]).default("none"),
  pendingActionPayload: json("pendingActionPayload"), // Serialized action details
  pendingActionExpiresAt: timestamp("pendingActionExpiresAt"),
  
  // Activity tracking
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  messageCount: int("messageCount").default(0),
  
  // Session lifecycle
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConversationSession = typeof conversationSessions.$inferSelect;
export type InsertConversationSession = typeof conversationSessions.$inferInsert;

// Attachment Links - Primary and secondary links for inbound attachments (Patch D)
// Each attachment has ONE primary link (asset OR project OR site)
// May have multiple secondary links (dataroom row, checklist row, view scope)
export const attachmentLinks = mysqlTable("attachmentLinks", {
  id: int("id").autoincrement().primaryKey(),
  
  // Source attachment (from ingestedFiles or artifacts)
  ingestedFileId: int("ingestedFileId"),
  artifactId: int("artifactId"),
  
  // Link type
  linkType: mysqlEnum("linkType", ["primary", "secondary"]).notNull(),
  
  // Target entity (only ONE of these should be set for primary links)
  projectId: int("projectId"),
  siteId: int("siteId"),
  assetId: int("assetId"), // Equipment/component
  
  // Secondary link targets
  dataroomId: int("dataroomId"),
  dataroomItemId: int("dataroomItemId"),
  checklistItemId: int("checklistItemId"),
  viewScopeId: int("viewScopeId"),
  
  // Link metadata
  linkedBy: mysqlEnum("linkedBy", ["ai_suggestion", "user_confirmed", "admin_assigned", "auto_rule"]).notNull(),
  aiConfidence: decimal("aiConfidence", { precision: 5, scale: 4 }), // 0.0000 to 1.0000
  linkedByUserId: int("linkedByUserId"),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AttachmentLink = typeof attachmentLinks.$inferSelect;
export type InsertAttachmentLink = typeof attachmentLinks.$inferInsert;


// Email verification tokens for email change flow
export const emailVerifications = mysqlTable("emailVerifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  newEmail: varchar("newEmail", { length: 320 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailVerification = typeof emailVerifications.$inferSelect;
export type InsertEmailVerification = typeof emailVerifications.$inferInsert;


// Background job queue for async processing
export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", [
    "document_ingestion",
    "ai_extraction", 
    "email_send",
    "notification_send",
    "report_generation",
    "data_export",
    "file_processing",
    "webhook_delivery"
  ]).notNull(),
  status: mysqlEnum("status", ["queued", "processing", "completed", "failed", "cancelled"]).default("queued").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "critical"]).default("normal").notNull(),
  payload: json("payload").$type<Record<string, unknown>>().notNull(),
  result: json("result").$type<Record<string, unknown>>(),
  error: text("error"),
  attempts: int("attempts").default(0).notNull(),
  maxAttempts: int("maxAttempts").default(3).notNull(),
  // Correlation IDs for tracing
  correlationId: varchar("correlationId", { length: 64 }),
  parentJobId: int("parentJobId"),
  // User context
  userId: int("userId"),
  organizationId: int("organizationId"),
  // Timing
  scheduledFor: timestamp("scheduledFor"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  failedAt: timestamp("failedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

// Job execution logs for debugging and auditing
export const jobLogs = mysqlTable("jobLogs", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  level: mysqlEnum("level", ["debug", "info", "warn", "error"]).default("info").notNull(),
  message: text("message").notNull(),
  data: json("data").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JobLog = typeof jobLogs.$inferSelect;
export type InsertJobLog = typeof jobLogs.$inferInsert;

// File upload tracking for storage hardening
export const fileUploads = mysqlTable("fileUploads", {
  id: int("id").autoincrement().primaryKey(),
  // Source tracking
  source: mysqlEnum("source", ["web", "whatsapp", "email", "api"]).notNull(),
  sourceId: varchar("sourceId", { length: 255 }), // Message ID, email ID, etc.
  // File info
  originalFilename: varchar("originalFilename", { length: 500 }).notNull(),
  mimeType: varchar("mimeType", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull(),
  fileExtension: varchar("fileExtension", { length: 50 }),
  // Storage info
  storageKey: varchar("storageKey", { length: 500 }).notNull(),
  storageUrl: text("storageUrl"),
  // Processing status
  status: mysqlEnum("status", ["uploading", "uploaded", "processing", "processed", "failed"]).default("uploading").notNull(),
  processingJobId: int("processingJobId"),
  // Validation
  isValidType: boolean("isValidType").default(true),
  isValidSize: boolean("isValidSize").default(true),
  validationErrors: json("validationErrors").$type<string[]>(),
  // Linking
  linkedEntityType: varchar("linkedEntityType", { length: 50 }), // document, asset, project, etc.
  linkedEntityId: int("linkedEntityId"),
  // Context
  userId: int("userId"),
  organizationId: int("organizationId"),
  projectId: int("projectId"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = typeof fileUploads.$inferInsert;


// ============ VIEW PREFERENCES (VATR + Views Contract) ============
// Stores user's default view preferences with precedence support
// Precedence: user > team > department > organization default

export const userViewPreferences = mysqlTable("userViewPreferences", {
  id: int("id").autoincrement().primaryKey(),
  
  // Scope (determines precedence level)
  scopeType: mysqlEnum("scopeType", ["user", "team", "department", "organization"]).notNull(),
  scopeId: int("scopeId").notNull(), // userId, teamId, deptId, or orgId
  
  // Context (what area this preference applies to)
  context: mysqlEnum("context", ["dashboard", "portfolio", "dataroom", "checklist", "report"]).notNull(),
  
  // The default view for this scope+context
  defaultViewId: int("defaultViewId").notNull(), // References portfolioViews.id
  
  // Audit
  setBy: int("setBy").notNull(), // User who set this preference
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  scopeContextUnique: uniqueIndex("scope_context_unique").on(table.scopeType, table.scopeId, table.context),
}));

export type UserViewPreference = typeof userViewPreferences.$inferSelect;
export type InsertUserViewPreference = typeof userViewPreferences.$inferInsert;


// ============ VIEW MANAGEMENT SYSTEM ============
// Comprehensive view sharing, templates, analytics, and hierarchical access control

// Teams for organizational hierarchy
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  departmentId: int("departmentId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  managerId: int("managerId"), // Team manager
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

// Departments for organizational hierarchy
export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  headId: int("headId"), // Department head
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

// Team memberships
export const teamMembers = mysqlTable("teamMembers", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["member", "lead", "superuser"]).default("member").notNull(),
  // R1 Tie-break fields
  isPrimary: boolean("isPrimary").default(false).notNull(), // Explicit primary team flag
  priority: int("priority").default(0).notNull(), // Higher number = higher priority
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(), // For most recent tie-break
}, (table) => ({
  teamUserUnique: uniqueIndex("team_user_unique").on(table.teamId, table.userId),
}));

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// Department memberships
export const departmentMembers = mysqlTable("departmentMembers", {
  id: int("id").autoincrement().primaryKey(),
  departmentId: int("departmentId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["member", "lead", "superuser"]).default("member").notNull(),
  // R1 Tie-break fields
  isPrimary: boolean("isPrimary").default(false).notNull(), // Explicit primary department flag
  priority: int("priority").default(0).notNull(), // Higher number = higher priority
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(), // For most recent tie-break
}, (table) => ({
  deptUserUnique: uniqueIndex("dept_user_unique").on(table.departmentId, table.userId),
}));

export type DepartmentMember = typeof departmentMembers.$inferSelect;
export type InsertDepartmentMember = typeof departmentMembers.$inferInsert;

// Organization superuser assignments (separate from org membership role)
export const organizationSuperusers = mysqlTable("organizationSuperusers", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId").notNull(),
  grantedBy: int("grantedBy").notNull(),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
}, (table) => ({
  orgUserUnique: uniqueIndex("org_superuser_unique").on(table.organizationId, table.userId),
}));

export type OrganizationSuperuser = typeof organizationSuperusers.$inferSelect;
export type InsertOrganizationSuperuser = typeof organizationSuperusers.$inferInsert;

// View Shares - who has access to which views
export const viewShares = mysqlTable("viewShares", {
  id: int("id").autoincrement().primaryKey(),
  viewId: int("viewId").notNull(), // References portfolioViews.id
  
  // Who is this shared with
  sharedWithType: mysqlEnum("sharedWithType", ["user", "team", "department", "organization"]).notNull(),
  sharedWithId: int("sharedWithId").notNull(), // userId, teamId, deptId, or orgId
  
  // Permission level
  permissionLevel: mysqlEnum("permissionLevel", ["view_only", "edit", "admin"]).default("view_only").notNull(),
  
  // Audit
  sharedBy: int("sharedBy").notNull(),
  sharedAt: timestamp("sharedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // Optional expiration
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  revokedBy: int("revokedBy"),
  revokedAt: timestamp("revokedAt"),
}, (table) => ({
  viewShareUnique: uniqueIndex("view_share_unique").on(table.viewId, table.sharedWithType, table.sharedWithId),
}));

export type ViewShare = typeof viewShares.$inferSelect;
export type InsertViewShare = typeof viewShares.$inferInsert;

// View Templates - pre-built view configurations
export const viewTemplates = mysqlTable("viewTemplates", {
  id: int("id").autoincrement().primaryKey(),
  
  // Template metadata
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "due_diligence",
    "investor_reporting",
    "compliance",
    "operations",
    "financial",
    "custom"
  ]).notNull(),
  
  // Template configuration (same structure as portfolioViews.filterCriteria)
  filterCriteria: json("filterCriteria").$type<{
    countries?: string[];
    statuses?: string[];
    assetClassifications?: string[];
    gridConnectionTypes?: string[];
    configurationProfiles?: string[];
    couplingTopologies?: string[];
    distributionTopologies?: string[];
    capacityMinMw?: number;
    capacityMaxMw?: number;
  }>(),
  
  // Display settings
  defaultColumns: json("defaultColumns").$type<string[]>(),
  sortOrder: varchar("sortOrder", { length: 100 }),
  
  // System vs custom
  isSystem: boolean("isSystem").default(false).notNull(), // System templates cannot be deleted
  organizationId: int("organizationId"), // null = global template
  
  // Audit
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ViewTemplate = typeof viewTemplates.$inferSelect;
export type InsertViewTemplate = typeof viewTemplates.$inferInsert;

// View Analytics - track view usage
export const viewAnalytics = mysqlTable("viewAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  viewId: int("viewId").notNull(),
  userId: int("userId").notNull(),
  
  // Access tracking
  accessedAt: timestamp("accessedAt").defaultNow().notNull(),
  durationSeconds: int("durationSeconds"), // How long they spent on the view
  
  // Actions taken
  actionType: mysqlEnum("actionType", [
    "view",
    "filter_change",
    "export",
    "share",
    "edit",
    "apply_template"
  ]).default("view").notNull(),
  actionDetails: json("actionDetails").$type<Record<string, unknown>>(),
  
  // Context
  sessionId: varchar("sessionId", { length: 64 }),
  userAgent: text("userAgent"),
});

export type ViewAnalytic = typeof viewAnalytics.$inferSelect;
export type InsertViewAnalytic = typeof viewAnalytics.$inferInsert;

// View Pushes - views pushed by managers/superusers to subordinates
export const viewPushes = mysqlTable("viewPushes", {
  id: int("id").autoincrement().primaryKey(),
  viewId: int("viewId").notNull(),
  
  // Who pushed it
  pushedBy: int("pushedBy").notNull(),
  pushedByRole: mysqlEnum("pushedByRole", [
    "manager",
    "team_superuser",
    "department_superuser",
    "organization_superuser",
    "admin"
  ]).notNull(),
  
  // Target scope
  targetScope: mysqlEnum("targetScope", ["user", "team", "department", "organization"]).notNull(),
  targetScopeId: int("targetScopeId").notNull(), // userId, teamId, deptId, or orgId
  
  // Push settings
  isPinned: boolean("isPinned").default(false).notNull(), // Appears at top of list
  isRequired: boolean("isRequired").default(false).notNull(), // Cannot be hidden by user
  displayOrder: int("displayOrder").default(0), // Order among pushed views
  
  // Message to recipients
  pushMessage: text("pushMessage"),
  
  // Audit
  pushedAt: timestamp("pushedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // Optional expiration
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  deactivatedBy: int("deactivatedBy"),
  deactivatedAt: timestamp("deactivatedAt"),
}, (table) => ({
  viewPushUnique: uniqueIndex("view_push_unique").on(table.viewId, table.targetScope, table.targetScopeId),
}));

export type ViewPush = typeof viewPushes.$inferSelect;
export type InsertViewPush = typeof viewPushes.$inferInsert;

// View Hides - views hidden by users or superusers
export const viewHides = mysqlTable("viewHides", {
  id: int("id").autoincrement().primaryKey(),
  viewId: int("viewId").notNull(),
  
  // Who hid it
  hiddenBy: int("hiddenBy").notNull(),
  hiddenByRole: mysqlEnum("hiddenByRole", [
    "user",
    "team_superuser",
    "department_superuser",
    "organization_superuser",
    "admin"
  ]).notNull(),
  
  // Target scope (who is it hidden for)
  targetScope: mysqlEnum("targetScope", ["user", "team", "department", "organization"]).notNull(),
  targetScopeId: int("targetScopeId").notNull(),
  
  // Reason
  reason: text("reason"),
  
  // Audit
  hiddenAt: timestamp("hiddenAt").defaultNow().notNull(),
  
  // Can be unhidden
  unhiddenBy: int("unhiddenBy"),
  unhiddenAt: timestamp("unhiddenAt"),
  isActive: boolean("isActive").default(true).notNull(),
}, (table) => ({
  viewHideUnique: uniqueIndex("view_hide_unique").on(table.viewId, table.targetScope, table.targetScopeId),
}));

export type ViewHide = typeof viewHides.$inferSelect;
export type InsertViewHide = typeof viewHides.$inferInsert;

// View Management Audit Log - track all view management actions
export const viewManagementAuditLog = mysqlTable("viewManagementAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  
  // What happened
  actionType: mysqlEnum("actionType", [
    "share",
    "unshare",
    "push",
    "unpush",
    "hide",
    "unhide",
    "delete",
    "permission_change"
  ]).notNull(),
  
  // Who did it
  actorId: int("actorId").notNull(),
  actorRole: varchar("actorRole", { length: 50 }).notNull(),
  
  // What view
  viewId: int("viewId").notNull(),
  
  // Target
  targetType: varchar("targetType", { length: 50 }),
  targetId: int("targetId"),
  
  // Details
  previousState: json("previousState").$type<Record<string, unknown>>(),
  newState: json("newState").$type<Record<string, unknown>>(),
  
  // Audit
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
});

export type ViewManagementAuditLogEntry = typeof viewManagementAuditLog.$inferSelect;
export type InsertViewManagementAuditLogEntry = typeof viewManagementAuditLog.$inferInsert;


// ============================================
// REQUESTS + SCOPED SUBMISSIONS SYSTEM
// ============================================

// Request Templates - reusable request definitions
export const requestTemplates = mysqlTable("request_templates", {
  id: int("id").primaryKey().autoincrement(),
  issuerOrgId: int("issuer_org_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // Tender, Regulatory Return, Grant Report, Diligence, etc.
  description: text("description"),
  requirementsSchemaId: int("requirements_schema_id"),
  defaultWorkflowId: int("default_workflow_id"),
  defaultIssuerViewId: int("default_issuer_view_id"),
  createdByUserId: int("created_by_user_id").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, active, archived
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
});
export type RequestTemplate = typeof requestTemplates.$inferSelect;
export type InsertRequestTemplate = typeof requestTemplates.$inferInsert;

// Requirements Schemas - versioned field/doc requirements
export const requirementsSchemas = mysqlTable("requirements_schemas", {
  id: int("id").primaryKey().autoincrement(),
  templateId: int("template_id"),
  version: int("version").notNull().default(1),
  schemaJson: json("schema_json").notNull().$type<{
    items: Array<{
      type: "field" | "document" | "computed" | "attestation";
      key: string;
      label: string;
      description?: string;
      required: boolean;
      vatrPathHints?: string[];
      verificationPolicy: "human_required" | "auto_allowed_if_source_verified" | "issuer_must_verify";
      dataType?: "text" | "number" | "date" | "boolean" | "file" | "select";
      options?: string[];
    }>;
  }>(),
  isPublished: boolean("is_published").notNull().default(false),
  createdByUserId: int("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type RequirementsSchema = typeof requirementsSchemas.$inferSelect;
export type InsertRequirementsSchema = typeof requirementsSchemas.$inferInsert;

// Request Instances - launched requests
export const requests = mysqlTable("requests", {
  id: int("id").primaryKey().autoincrement(),
  templateId: int("template_id"),
  issuerOrgId: int("issuer_org_id").notNull(),
  issuerUserId: int("issuer_user_id").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, issued, in_progress, collecting, closed, cancelled
  deadlineAt: timestamp("deadline_at"),
  instructions: text("instructions"),
  issuerPortfolioId: int("issuer_portfolio_id"),
  requirementsSchemaId: int("requirements_schema_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
});
export type Request = typeof requests.$inferSelect;
export type InsertRequest = typeof requests.$inferInsert;

// Request Recipients - invited orgs/users
export const requestRecipients = mysqlTable("request_recipients", {
  id: int("id").primaryKey().autoincrement(),
  requestId: int("request_id").notNull(),
  recipientOrgId: int("recipient_org_id"),
  recipientUserId: int("recipient_user_id"),
  recipientEmail: varchar("recipient_email", { length: 255 }),
  recipientPhone: varchar("recipient_phone", { length: 50 }),
  status: varchar("status", { length: 50 }).notNull().default("invited"), // invited, opened, responding, submitted, declined, expired
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  openedAt: timestamp("opened_at"),
  submittedAt: timestamp("submitted_at"),
  declinedAt: timestamp("declined_at"),
});
export type RequestRecipient = typeof requestRecipients.$inferSelect;
export type InsertRequestRecipient = typeof requestRecipients.$inferInsert;

// Response Workspaces - recipient working area
export const responseWorkspaces = mysqlTable("response_workspaces", {
  id: int("id").primaryKey().autoincrement(),
  requestId: int("request_id").notNull(),
  recipientOrgId: int("recipient_org_id").notNull(),
  createdByUserId: int("created_by_user_id").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("active"), // active, submitted, locked
  responseViewId: int("response_view_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
});
export type ResponseWorkspace = typeof responseWorkspaces.$inferSelect;
export type InsertResponseWorkspace = typeof responseWorkspaces.$inferInsert;

// Workspace Assets - asset selection for response
export const workspaceAssets = mysqlTable("workspace_assets", {
  id: int("id").primaryKey().autoincrement(),
  workspaceId: int("workspace_id").notNull(),
  assetId: int("asset_id").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("included"), // included, removed
  addedAt: timestamp("added_at").defaultNow().notNull(),
  addedByUserId: int("added_by_user_id").notNull(),
});
export type WorkspaceAsset = typeof workspaceAssets.$inferSelect;
export type InsertWorkspaceAsset = typeof workspaceAssets.$inferInsert;

// Workspace Answers - field responses
export const workspaceAnswers = mysqlTable("workspace_answers", {
  id: int("id").primaryKey().autoincrement(),
  workspaceId: int("workspace_id").notNull(),
  requirementKey: varchar("requirement_key", { length: 255 }).notNull(),
  assetId: int("asset_id"),
  answerJson: json("answer_json").notNull(),
  vatrSourcePath: varchar("vatr_source_path", { length: 500 }),
  isVerified: boolean("is_verified").notNull().default(false),
  verifiedByUserId: int("verified_by_user_id"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
});
export type WorkspaceAnswer = typeof workspaceAnswers.$inferSelect;
export type InsertWorkspaceAnswer = typeof workspaceAnswers.$inferInsert;

// Workspace Documents - attached documents
export const workspaceDocuments = mysqlTable("workspace_documents", {
  id: int("id").primaryKey().autoincrement(),
  workspaceId: int("workspace_id").notNull(),
  requirementKey: varchar("requirement_key", { length: 255 }),
  assetId: int("asset_id"),
  documentId: int("document_id"),
  fileUrl: varchar("file_url", { length: 1000 }),
  fileName: varchar("file_name", { length: 255 }),
  fileType: varchar("file_type", { length: 100 }),
  uploadedByUserId: int("uploaded_by_user_id").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});
export type WorkspaceDocument = typeof workspaceDocuments.$inferSelect;
export type InsertWorkspaceDocument = typeof workspaceDocuments.$inferInsert;

// Submissions - immutable snapshot packages
export const submissions = mysqlTable("submissions", {
  id: int("id").primaryKey().autoincrement(),
  requestId: int("request_id").notNull(),
  workspaceId: int("workspace_id").notNull(),
  recipientOrgId: int("recipient_org_id").notNull(),
  submittedByUserId: int("submitted_by_user_id").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("submitted"), // submitted, accepted, needs_clarification, rejected
  snapshotId: int("snapshot_id").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedByUserId: int("reviewed_by_user_id"),
  reviewNotes: text("review_notes"),
});
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

// Snapshots - immutable content with integrity hash
export const snapshots = mysqlTable("snapshots", {
  id: int("id").primaryKey().autoincrement(),
  type: varchar("type", { length: 50 }).notNull().default("submission"),
  contentJson: json("content_json").notNull().$type<{
    assets: Array<{ id: number; name: string }>;
    answers: Array<{ key: string; value: unknown; assetId?: number }>;
    documents: Array<{ key: string; fileUrl: string; fileName: string; assetId?: number }>;
    attestations: Array<{ key: string; attestedBy: number; attestedAt: string }>;
    signOffs: Array<{ role: string; userId: number; signedAt: string; status: string }>;
  }>(),
  contentHash: varchar("content_hash", { length: 64 }).notNull(),
  createdByUserId: int("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Snapshot = typeof snapshots.$inferSelect;
export type InsertSnapshot = typeof snapshots.$inferInsert;

// Scoped Grants - explicit minimal permission grants
export const scopedGrants = mysqlTable("scoped_grants", {
  id: int("id").primaryKey().autoincrement(),
  grantorOrgId: int("grantor_org_id").notNull(),
  granteeOrgId: int("grantee_org_id").notNull(),
  granteeUserId: int("grantee_user_id"),
  scopeType: varchar("scope_type", { length: 50 }).notNull(), // submission, field_set, document_set
  scopeId: int("scope_id").notNull(),
  expiresAt: timestamp("expires_at"),
  isRevoked: boolean("is_revoked").notNull().default(false),
  revokedAt: timestamp("revoked_at"),
  revokedByUserId: int("revoked_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ScopedGrant = typeof scopedGrants.$inferSelect;
export type InsertScopedGrant = typeof scopedGrants.$inferInsert;

// Sign-off Requirements - workflow configuration
export const signOffRequirements = mysqlTable("sign_off_requirements", {
  id: int("id").primaryKey().autoincrement(),
  templateId: int("template_id"),
  requestId: int("request_id"),
  signerRole: varchar("signer_role", { length: 100 }),
  signerUserId: int("signer_user_id"),
  orderIndex: int("order_index").notNull().default(0),
  isParallel: boolean("is_parallel").notNull().default(false),
  conditionJson: json("condition_json").$type<{ field?: string; operator?: string; value?: unknown }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type SignOffRequirement = typeof signOffRequirements.$inferSelect;
export type InsertSignOffRequirement = typeof signOffRequirements.$inferInsert;

// Sign-off Events - actual sign-offs
export const signOffEvents = mysqlTable("sign_off_events", {
  id: int("id").primaryKey().autoincrement(),
  workspaceId: int("workspace_id").notNull(),
  requirementId: int("requirement_id").notNull(),
  signedByUserId: int("signed_by_user_id").notNull(),
  status: varchar("status", { length: 50 }).notNull(), // approved, rejected, delegated
  notes: text("notes"),
  signedAt: timestamp("signed_at").defaultNow().notNull(),
});
export type SignOffEvent = typeof signOffEvents.$inferSelect;
export type InsertSignOffEvent = typeof signOffEvents.$inferInsert;

// Request Clarifications - clarification threads
export const requestClarifications = mysqlTable("request_clarifications", {
  id: int("id").primaryKey().autoincrement(),
  requestId: int("request_id").notNull(),
  submissionId: int("submission_id"),
  fromOrgId: int("from_org_id").notNull(),
  fromUserId: int("from_user_id").notNull(),
  toOrgId: int("to_org_id").notNull(),
  subject: varchar("subject", { length: 500 }),
  message: text("message").notNull(),
  parentId: int("parent_id"),
  status: varchar("status", { length: 50 }).notNull().default("open"), // open, responded, closed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type RequestClarification = typeof requestClarifications.$inferSelect;
export type InsertRequestClarification = typeof requestClarifications.$inferInsert;

// Request Audit Log - comprehensive audit trail
export const requestAuditLog = mysqlTable("request_audit_log", {
  id: int("id").primaryKey().autoincrement(),
  requestId: int("request_id"),
  workspaceId: int("workspace_id"),
  submissionId: int("submission_id"),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  actorUserId: int("actor_user_id").notNull(),
  actorOrgId: int("actor_org_id"),
  targetType: varchar("target_type", { length: 100 }),
  targetId: int("target_id"),
  detailsJson: json("details_json").$type<Record<string, unknown>>(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type RequestAuditLogEntry = typeof requestAuditLog.$inferSelect;
export type InsertRequestAuditLogEntry = typeof requestAuditLog.$inferInsert;


// ============================================================================
// VERSIONED VIEWS + SHARING + MANAGED UPDATES SYSTEM
// ============================================================================

// View Templates (versioned, shareable definitions)
export const viewTemplatesV2 = mysqlTable("view_templates_v2", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: int("org_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  currentVersionId: varchar("current_version_id", { length: 36 }),
  category: varchar("category", { length: 100 }), // e.g., "due_diligence", "compliance", "reporting"
  isPublic: boolean("is_public").default(false), // visible to all org members
  createdByUserId: int("created_by_user_id").notNull(),
  status: varchar("status", { length: 20 }).default("active").$type<"active" | "archived" | "draft">(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type ViewTemplateV2 = typeof viewTemplatesV2.$inferSelect;
export type InsertViewTemplateV2 = typeof viewTemplatesV2.$inferInsert;

// View Template Versions (immutable version history)
export const viewTemplateVersions = mysqlTable("view_template_versions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  templateId: varchar("template_id", { length: 36 }).notNull(),
  versionNumber: int("version_number").notNull(), // 1, 2, 3...
  definitionJson: json("definition_json").notNull().$type<{
    columns: string[];
    filters: Record<string, unknown>;
    grouping?: string[];
    sorting?: { field: string; direction: "asc" | "desc" }[];
    cardMode?: "summary" | "expanded" | "full";
    disclosureMode?: "summary" | "expanded" | "full";
    formRequirements?: Record<string, unknown>;
    layout?: Record<string, unknown>;
  }>(),
  changelog: text("changelog"), // description of changes from previous version
  createdByUserId: int("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ViewTemplateVersion = typeof viewTemplateVersions.$inferSelect;
export type InsertViewTemplateVersion = typeof viewTemplateVersions.$inferInsert;

// View Instances (what users actually use - independent or managed)
export const viewInstances = mysqlTable("view_instances", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: int("org_id").notNull(),
  ownerUserId: int("owner_user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  
  // Where this instance lives (one of these should be set)
  workspaceId: varchar("workspace_id", { length: 36 }),
  boardId: varchar("board_id", { length: 36 }),
  requestId: int("request_id"),
  
  // Source tracking (for shared/managed views)
  sourceTemplateId: varchar("source_template_id", { length: 36 }),
  sourceVersionId: varchar("source_version_id", { length: 36 }),
  
  // The effective definition for this instance
  definitionJson: json("definition_json").notNull().$type<{
    columns: string[];
    filters: Record<string, unknown>;
    grouping?: string[];
    sorting?: { field: string; direction: "asc" | "desc" }[];
    cardMode?: "summary" | "expanded" | "full";
    disclosureMode?: "summary" | "expanded" | "full";
    formRequirements?: Record<string, unknown>;
    layout?: Record<string, unknown>;
  }>(),
  
  // Update mode: independent (forked/cloned) or managed (linked to source)
  updateMode: varchar("update_mode", { length: 20 }).default("independent").$type<"independent" | "managed">(),
  hasLocalEdits: boolean("has_local_edits").default(false),
  localEditsSummary: text("local_edits_summary"), // description of what was changed locally
  
  // Status
  status: varchar("status", { length: 20 }).default("active").$type<"active" | "archived">(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type ViewInstance = typeof viewInstances.$inferSelect;
export type InsertViewInstance = typeof viewInstances.$inferInsert;

// View Update Rollouts (batch updates from template to instances)
export const viewUpdateRollouts = mysqlTable("view_update_rollouts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: int("org_id").notNull(),
  templateId: varchar("template_id", { length: 36 }).notNull(),
  fromVersionId: varchar("from_version_id", { length: 36 }), // null for first rollout
  toVersionId: varchar("to_version_id", { length: 36 }).notNull(),
  
  // Rollout mode
  rolloutMode: varchar("rollout_mode", { length: 20 }).notNull().$type<"force" | "safe" | "opt_in">(),
  
  // Scope definition
  scope: varchar("scope", { length: 30 }).notNull().$type<"org_wide" | "selected_workspaces" | "selected_instances">(),
  scopeWorkspaceIds: json("scope_workspace_ids").$type<string[]>(),
  scopeInstanceIds: json("scope_instance_ids").$type<string[]>(),
  
  // Status
  status: varchar("status", { length: 20 }).default("draft").$type<
    "draft" | "pending_approval" | "approved" | "executing" | "completed" | "canceled"
  >(),
  
  // Approval tracking
  requiresApproval: boolean("requires_approval").default(true),
  createdByUserId: int("created_by_user_id").notNull(),
  approvedByUserId: int("approved_by_user_id"),
  approvalNotes: text("approval_notes"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  executedAt: timestamp("executed_at"),
  completedAt: timestamp("completed_at"),
});
export type ViewUpdateRollout = typeof viewUpdateRollouts.$inferSelect;
export type InsertViewUpdateRollout = typeof viewUpdateRollouts.$inferInsert;

// View Instance Update Receipts (per-instance rollout results)
export const viewInstanceUpdateReceipts = mysqlTable("view_instance_update_receipts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  rolloutId: varchar("rollout_id", { length: 36 }).notNull(),
  instanceId: varchar("instance_id", { length: 36 }).notNull(),
  
  // Status of this instance's update
  status: varchar("status", { length: 20 }).default("pending").$type<
    "pending" | "applied" | "skipped" | "conflict" | "rejected" | "opted_out"
  >(),
  
  // Conflict details (for safe mode)
  conflictDetailsJson: json("conflict_details_json").$type<{
    conflictingFields: string[];
    localValue: unknown;
    newValue: unknown;
    resolution?: "keep_local" | "apply_new" | "fork";
  }[]>(),
  
  // User action (for opt-in mode)
  userAction: varchar("user_action", { length: 20 }).$type<"accepted" | "rejected" | "deferred">(),
  userActionAt: timestamp("user_action_at"),
  userActionByUserId: int("user_action_by_user_id"),
  
  // Previous state (for rollback)
  previousDefinitionJson: json("previous_definition_json"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type ViewInstanceUpdateReceipt = typeof viewInstanceUpdateReceipts.$inferSelect;
export type InsertViewInstanceUpdateReceipt = typeof viewInstanceUpdateReceipts.$inferInsert;

// View Version Audit Log (immutable audit trail)
export const viewVersionAuditLog = mysqlTable("view_version_audit_log", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: int("org_id").notNull(),
  
  // What was affected
  entityType: varchar("entity_type", { length: 50 }).notNull().$type<
    "template" | "version" | "instance" | "rollout" | "receipt"
  >(),
  entityId: varchar("entity_id", { length: 36 }).notNull(),
  
  // What happened
  action: varchar("action", { length: 50 }).notNull().$type<
    "template_created" | "template_updated" | "template_archived" |
    "version_published" |
    "instance_created" | "instance_cloned" | "instance_forked" | "instance_updated" |
    "rollout_created" | "rollout_submitted" | "rollout_approved" | "rollout_rejected" | 
    "rollout_executed" | "rollout_completed" | "rollout_canceled" |
    "update_applied" | "update_skipped" | "update_conflict" | "conflict_resolved"
  >(),
  
  // Who did it
  userId: int("user_id").notNull(),
  
  // Details
  detailsJson: json("details_json").$type<Record<string, unknown>>(),
  
  // Related entities
  relatedTemplateId: varchar("related_template_id", { length: 36 }),
  relatedVersionId: varchar("related_version_id", { length: 36 }),
  relatedInstanceId: varchar("related_instance_id", { length: 36 }),
  relatedRolloutId: varchar("related_rollout_id", { length: 36 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ViewVersionAuditLogEntry = typeof viewVersionAuditLog.$inferSelect;
export type InsertViewVersionAuditLogEntry = typeof viewVersionAuditLog.$inferInsert;


// ═══════════════════════════════════════════════════════════════
// EVIDENCE GROUNDING: 3-Tier Evidence References
// ═══════════════════════════════════════════════════════════════

// Evidence tiers for source highlighting
export const evidenceTierEnum = mysqlEnum("evidenceTier", ["T1_TEXT", "T2_OCR", "T3_ANCHOR"]);

// Canonical evidence references linking VATR fields to source documents
export const evidenceRefs = mysqlTable("evidenceRefs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Link to the field record (can be aiExtraction, vatrSourceDocument, or assetAttribute)
  fieldRecordId: int("fieldRecordId").notNull(),
  fieldRecordType: mysqlEnum("fieldRecordType", ["ai_extraction", "vatr_source", "asset_attribute"]).notNull(),
  
  // Source document location
  documentId: int("documentId").notNull(),
  pageNumber: int("pageNumber"), // nullable only if truly unknown
  
  // Evidence tier (determines highlight behavior)
  tier: evidenceTierEnum.notNull(),
  
  // Snippet (max 240 chars enforced at write time)
  snippet: varchar("snippet", { length: 240 }),
  
  // Bounding box for Tier 1 (native PDF text) and Tier 2 (OCR)
  // Format: { units: "pdf_points"|"page_normalized"|"pixels", origin: "top_left"|"bottom_left", rotation: 0|90|180|270, x, y, w, h }
  bboxJson: json("bboxJson").$type<{
    units: "pdf_points" | "page_normalized" | "pixels";
    origin: "top_left" | "bottom_left";
    rotation: 0 | 90 | 180 | 270;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(),
  
  // Anchor for Tier 3 (fallback text matching)
  // Format: { matchType: "exact"|"regex"|"semantic", query: string, contextBefore?: string, contextAfter?: string, occurrenceHint?: number }
  anchorJson: json("anchorJson").$type<{
    matchType: "exact" | "regex" | "semantic";
    query: string;
    contextBefore?: string;
    contextAfter?: string;
    occurrenceHint?: number;
  } | null>(),
  
  // Confidence score (0..1) for selection tie-breaking
  confidence: decimal("confidence", { precision: 4, scale: 3 }).notNull().default("0.5"),
  
  // Provenance
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdById: int("createdById"),
  
  // Provenance status
  provenanceStatus: mysqlEnum("provenanceStatus", ["resolved", "unresolved", "needs_review"]).default("resolved"),
}, (table) => ({
  // Indices for efficient queries
  fieldRecordIdx: index("evidence_field_record_idx").on(table.fieldRecordId, table.fieldRecordType),
  documentPageIdx: index("evidence_document_page_idx").on(table.documentId, table.pageNumber),
  tierIdx: index("evidence_tier_idx").on(table.tier),
}));

export type EvidenceRef = typeof evidenceRefs.$inferSelect;
export type InsertEvidenceRef = typeof evidenceRefs.$inferInsert;

// Evidence open audit log (no snippet stored for security)
export const evidenceAuditLog = mysqlTable("evidenceAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  
  // Event type
  eventType: mysqlEnum("eventType", ["evidence_opened", "evidence_not_found", "access_denied"]).notNull(),
  
  // Who
  userId: int("userId").notNull(),
  organizationId: int("organizationId"),
  
  // What
  fieldRecordId: int("fieldRecordId").notNull(),
  fieldRecordType: varchar("fieldRecordType", { length: 50 }).notNull(),
  evidenceRefId: int("evidenceRefId"),
  documentId: int("documentId"),
  pageNumber: int("pageNumber"),
  tierUsed: varchar("tierUsed", { length: 20 }),
  
  // Context (no snippet for security)
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EvidenceAuditLogEntry = typeof evidenceAuditLog.$inferSelect;
export type InsertEvidenceAuditLogEntry = typeof evidenceAuditLog.$inferInsert;


// ============ PHASE 32: ORG ISOLATION + SECURE ONBOARDING ============

// Invite Tokens - Admin-generated tokens for controlled access
// Tokens bind: orgId, role, memberships, expiry, max uses
export const inviteTokens = mysqlTable("inviteTokens", {
  id: int("id").autoincrement().primaryKey(),
  
  // Token identification (hashed at rest)
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(), // SHA-256 hash
  
  // Binding configuration
  organizationId: int("organizationId").notNull(),
  role: mysqlEnum("role", ["admin", "editor", "reviewer", "investor_viewer"]).default("editor").notNull(),
  
  // Optional pre-bound memberships
  teamIds: json("teamIds").$type<number[]>(),
  projectIds: json("projectIds").$type<number[]>(),
  defaultViewId: int("defaultViewId"), // Default view preference
  
  // Usage limits
  maxUses: int("maxUses").default(1).notNull(),
  usedCount: int("usedCount").default(0).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  
  // Optional restrictions
  restrictToEmail: varchar("restrictToEmail", { length: 320 }), // If set, only this email can use
  restrictToDomain: varchar("restrictToDomain", { length: 255 }), // If set, only this domain can use
  require2FA: boolean("require2FA").default(false).notNull(),
  
  // Audit
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
  revokedBy: int("revokedBy"),
  revokedReason: text("revokedReason"),
});

export type InviteToken = typeof inviteTokens.$inferSelect;
export type InsertInviteToken = typeof inviteTokens.$inferInsert;

// Invite Token Redemptions - Audit trail for token usage
export const inviteTokenRedemptions = mysqlTable("inviteTokenRedemptions", {
  id: int("id").autoincrement().primaryKey(),
  tokenId: int("tokenId").notNull(),
  userId: int("userId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  redeemedAt: timestamp("redeemedAt").defaultNow().notNull(),
});

export type InviteTokenRedemption = typeof inviteTokenRedemptions.$inferSelect;
export type InsertInviteTokenRedemption = typeof inviteTokenRedemptions.$inferInsert;

// WhatsApp Binding Tokens - Proof-of-control for phone binding
export const whatsappBindingTokens = mysqlTable("whatsappBindingTokens", {
  id: int("id").autoincrement().primaryKey(),
  
  // Token (6-digit code)
  code: varchar("code", { length: 10 }).notNull(),
  
  // User requesting binding
  userId: int("userId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(), // E.164 format
  
  // Status
  status: mysqlEnum("status", ["pending", "verified", "expired", "failed"]).default("pending").notNull(),
  attempts: int("attempts").default(0).notNull(),
  maxAttempts: int("maxAttempts").default(3).notNull(),
  
  // Timing
  expiresAt: timestamp("expiresAt").notNull(),
  verifiedAt: timestamp("verifiedAt"),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WhatsappBindingToken = typeof whatsappBindingTokens.$inferSelect;
export type InsertWhatsappBindingToken = typeof whatsappBindingTokens.$inferInsert;

// Security Audit Log - All security-relevant events
// Immutable, append-only log for compliance and forensics
export const securityAuditLog = mysqlTable("securityAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  
  // Event classification
  eventType: mysqlEnum("eventType", [
    // Authentication
    "login_success", "login_failed", "logout", "session_expired",
    "2fa_enrolled", "2fa_verified", "2fa_failed",
    // Signup/Onboarding
    "signup_started", "email_verified", "signup_completed", "invite_redeemed",
    // Identity binding
    "whatsapp_binding_requested", "whatsapp_binding_verified", "whatsapp_binding_failed",
    "email_change_requested", "email_change_completed",
    "identifier_revoked",
    // Access control
    "org_access_granted", "org_access_revoked", "role_changed",
    "cross_org_access_attempted", "cross_org_access_denied",
    // Superuser
    "elevation_requested", "elevation_granted", "elevation_expired",
    "cross_tenant_read", "cross_tenant_write",
    // Sharing
    "share_token_created", "share_token_revoked", "share_token_accessed",
    // Data access
    "sensitive_data_accessed", "export_requested", "export_completed"
  ]).notNull(),
  
  // Actor
  userId: int("userId"), // May be null for failed logins
  userEmail: varchar("userEmail", { length: 320 }), // For failed logins
  
  // Context
  organizationId: int("organizationId"),
  targetUserId: int("targetUserId"), // If action affects another user
  targetOrganizationId: int("targetOrganizationId"), // For cross-org events
  
  // Details
  details: json("details").$type<Record<string, unknown>>(),
  
  // Request context
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  sessionId: varchar("sessionId", { length: 64 }),
  
  // Elevation context (for superuser actions)
  elevationId: int("elevationId"),
  elevationReason: text("elevationReason"),
  
  // Timestamp (immutable)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SecurityAuditLogEntry = typeof securityAuditLog.$inferSelect;
export type InsertSecurityAuditLogEntry = typeof securityAuditLog.$inferInsert;

// Superuser Elevations - Time-bound elevated access for KIISHA staff
export const superuserElevations = mysqlTable("superuserElevations", {
  id: int("id").autoincrement().primaryKey(),
  
  // Superuser
  userId: int("userId").notNull(),
  
  // Scope
  targetOrganizationId: int("targetOrganizationId"), // If scoped to specific org
  scope: mysqlEnum("scope", ["global", "organization"]).default("organization").notNull(),
  
  // Permissions during elevation
  canRead: boolean("canRead").default(true).notNull(),
  canWrite: boolean("canWrite").default(false).notNull(),
  canExport: boolean("canExport").default(false).notNull(),
  canViewSecrets: boolean("canViewSecrets").default(false).notNull(),
  
  // Reason and approval
  reason: text("reason").notNull(),
  approvedBy: int("approvedBy"), // Another superuser or auto-approved
  customerApproval: boolean("customerApproval").default(false), // Customer explicitly approved
  
  // Time bounds
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  endedAt: timestamp("endedAt"), // Early termination
  
  // Status
  status: mysqlEnum("status", ["active", "expired", "terminated"]).default("active").notNull(),
});

export type SuperuserElevation = typeof superuserElevations.$inferSelect;
export type InsertSuperuserElevation = typeof superuserElevations.$inferInsert;

// Cross-Org Share Tokens - Explicit sharing is the only cross-org window
export const crossOrgShareTokens = mysqlTable("crossOrgShareTokens", {
  id: int("id").autoincrement().primaryKey(),
  
  // Token identification (hashed at rest)
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  
  // Source organization
  sourceOrganizationId: int("sourceOrganizationId").notNull(),
  createdBy: int("createdBy").notNull(),
  
  // Scope - what is being shared
  shareType: mysqlEnum("shareType", ["view", "assets", "documents", "dataroom"]).notNull(),
  
  // Scoped access (JSON for flexibility)
  scopeConfig: json("scopeConfig").$type<{
    viewId?: number;
    assetIds?: number[];
    documentIds?: number[];
    dataroomId?: number;
    allowedFields?: string[]; // RBAC-safe field list
    readOnly?: boolean;
  }>().notNull(),
  
  // Recipient constraints
  recipientOrganizationId: int("recipientOrganizationId"), // If scoped to specific org
  recipientEmail: varchar("recipientEmail", { length: 320 }), // If scoped to specific email
  
  // Usage limits
  maxUses: int("maxUses"),
  usedCount: int("usedCount").default(0).notNull(),
  
  // Time bounds
  expiresAt: timestamp("expiresAt"),
  
  // Status
  status: mysqlEnum("status", ["active", "expired", "revoked"]).default("active").notNull(),
  revokedAt: timestamp("revokedAt"),
  revokedBy: int("revokedBy"),
  revokedReason: text("revokedReason"),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrossOrgShareToken = typeof crossOrgShareTokens.$inferSelect;
export type InsertCrossOrgShareToken = typeof crossOrgShareTokens.$inferInsert;

// Cross-Org Share Token Access Log
export const crossOrgShareAccessLog = mysqlTable("crossOrgShareAccessLog", {
  id: int("id").autoincrement().primaryKey(),
  tokenId: int("tokenId").notNull(),
  
  // Accessor
  userId: int("userId"),
  organizationId: int("organizationId"),
  
  // Access details
  accessType: mysqlEnum("accessType", ["view", "download", "export"]).notNull(),
  resourceType: varchar("resourceType", { length: 50 }),
  resourceId: int("resourceId"),
  
  // Request context
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  // Timestamp
  accessedAt: timestamp("accessedAt").defaultNow().notNull(),
});

export type CrossOrgShareAccessLogEntry = typeof crossOrgShareAccessLog.$inferSelect;
export type InsertCrossOrgShareAccessLogEntry = typeof crossOrgShareAccessLog.$inferInsert;

// KIISHA Lobby Organization - Sandbox for unapproved users
// This is a special system org with no customer data
export const kiishaLobbyConfig = mysqlTable("kiishaLobbyConfig", {
  id: int("id").autoincrement().primaryKey(),
  
  // The lobby org ID (should be org ID 1 or a designated system org)
  lobbyOrganizationId: int("lobbyOrganizationId").notNull().unique(),
  
  // Welcome message shown to lobby users
  welcomeMessage: text("welcomeMessage"),
  
  // Features available in lobby
  allowRequestAccess: boolean("allowRequestAccess").default(true).notNull(),
  allowViewDemo: boolean("allowViewDemo").default(true).notNull(),
  
  // Audit
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KiishaLobbyConfig = typeof kiishaLobbyConfig.$inferSelect;
export type InsertKiishaLobbyConfig = typeof kiishaLobbyConfig.$inferInsert;

// Access Requests - Users in lobby requesting org access
export const accessRequests = mysqlTable("accessRequests", {
  id: int("id").autoincrement().primaryKey(),
  
  // Requester
  userId: int("userId").notNull(),
  userEmail: varchar("userEmail", { length: 320 }).notNull(),
  
  // Target organization (if known)
  targetOrganizationId: int("targetOrganizationId"),
  targetOrganizationName: varchar("targetOrganizationName", { length: 255 }), // Free text if org unknown
  
  // Request details
  requestReason: text("requestReason"),
  requestedRole: mysqlEnum("requestedRole", ["admin", "editor", "reviewer", "investor_viewer"]).default("editor"),
  
  // Status
  status: mysqlEnum("status", ["pending", "approved", "rejected", "expired"]).default("pending").notNull(),
  
  // Resolution
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  resolutionNotes: text("resolutionNotes"),
  
  // If approved, the resulting membership
  resultingMembershipId: int("resultingMembershipId"),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // Auto-expire old requests
});

export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = typeof accessRequests.$inferInsert;

// User Sessions - Track active sessions for security
export const userSessions = mysqlTable("userSessions", {
  id: int("id").autoincrement().primaryKey(),
  
  // User
  userId: int("userId").notNull(),
  
  // Session identification
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  
  // Active organization context
  activeOrganizationId: int("activeOrganizationId"),
  
  // Device/client info
  deviceFingerprint: varchar("deviceFingerprint", { length: 64 }),
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  
  // Timing
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  
  // Status
  status: mysqlEnum("status", ["active", "expired", "revoked"]).default("active").notNull(),
  revokedAt: timestamp("revokedAt"),
  revokedReason: text("revokedReason"),
});

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;


// ============================================================================
// Phase 33: Multi-Org Workspace Switching + Zero-Leak Tenant Isolation
// ============================================================================

// User Workspace Preferences - per-user defaults and channel-specific org bindings
export const userWorkspacePreferences = mysqlTable("userWorkspacePreferences", {
  id: int("id").autoincrement().primaryKey(),
  
  // User
  userId: int("userId").notNull().unique(),
  
  // Default org (used when no channel-specific default exists)
  defaultOrgId: int("defaultOrgId"),
  
  // Primary org (explicit user preference for "main" workspace)
  primaryOrgId: int("primaryOrgId"),
  
  // Last active org on web (for session restoration)
  webLastActiveOrgId: int("webLastActiveOrgId"),
  
  // Channel-specific defaults
  whatsappDefaultOrgId: int("whatsappDefaultOrgId"),
  emailDefaultOrgId: int("emailDefaultOrgId"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserWorkspacePreference = typeof userWorkspacePreferences.$inferSelect;
export type InsertUserWorkspacePreference = typeof userWorkspacePreferences.$inferInsert;

// Workspace Binding Codes - short-lived codes for secure channel binding
// Used for WhatsApp/Email to bind chat to a specific workspace without revealing org names
export const workspaceBindingCodes = mysqlTable("workspaceBindingCodes", {
  id: int("id").autoincrement().primaryKey(),
  
  // Code (6-digit numeric for easy typing)
  code: varchar("code", { length: 10 }).notNull().unique(),
  
  // Target binding
  userId: int("userId").notNull(),
  organizationId: int("organizationId").notNull(),
  
  // Channel this code is for (optional - if null, works for any channel)
  channel: mysqlEnum("channel", ["whatsapp", "email"]),
  
  // Validity
  expiresAt: timestamp("expiresAt").notNull(),
  
  // Usage tracking
  usedAt: timestamp("usedAt"),
  usedFromChannel: mysqlEnum("usedFromChannel", ["whatsapp", "email"]),
  usedFromIdentifier: varchar("usedFromIdentifier", { length: 320 }),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkspaceBindingCode = typeof workspaceBindingCodes.$inferSelect;
export type InsertWorkspaceBindingCode = typeof workspaceBindingCodes.$inferInsert;

// Workspace Switch Audit Log - track all workspace switches for security
export const workspaceSwitchAuditLog = mysqlTable("workspaceSwitchAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  
  // Who switched
  userId: int("userId").notNull(),
  
  // Switch details
  fromOrganizationId: int("fromOrganizationId"),
  toOrganizationId: int("toOrganizationId").notNull(),
  
  // Channel and context
  channel: mysqlEnum("channel", ["web", "whatsapp", "email", "api"]).notNull(),
  switchMethod: mysqlEnum("switchMethod", [
    "login_auto",           // Auto-selected (single org)
    "login_selection",      // User selected at login
    "switcher",             // Used workspace switcher
    "binding_code",         // Used binding code
    "channel_default",      // Channel-specific default
    "session_restore"       // Restored from session
  ]).notNull(),
  
  // Client info
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  // Timestamp
  switchedAt: timestamp("switchedAt").defaultNow().notNull(),
});

export type WorkspaceSwitchAuditEntry = typeof workspaceSwitchAuditLog.$inferSelect;
export type InsertWorkspaceSwitchAuditEntry = typeof workspaceSwitchAuditLog.$inferInsert;


// ═══════════════════════════════════════════════════════════════
// PHASE 34: ORG PREFERENCES & FIELD PACKS
// ═══════════════════════════════════════════════════════════════

/**
 * Org Preferences - tenant-scoped defaults for views, fields, charts
 * One row per organization (or versioned via orgPreferenceVersions)
 */
export const orgPreferences = mysqlTable("orgPreferences", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().unique(),
  
  // Default asset classifications enabled for this org
  defaultAssetClassifications: json("defaultAssetClassifications").$type<string[]>(),
  
  // Default configuration profiles (e.g., Solar+BESS, Solar+Gen, Solar-only)
  defaultConfigurationProfiles: json("defaultConfigurationProfiles").$type<string[]>(),
  
  // Preferred field packs (array of fieldPack IDs)
  preferredFieldPacks: json("preferredFieldPacks").$type<number[]>(),
  
  // Default disclosure mode for views
  defaultDisclosureMode: mysqlEnum("defaultDisclosureMode", ["summary", "expanded", "full"]).default("summary"),
  
  // Default charts configuration
  defaultChartsConfig: json("defaultChartsConfig").$type<{
    allowedChartTypes: string[];
    defaultChartType: string;
    dashboardCharts: Array<{
      chartKey: string;
      chartType: string;
      position: number;
      dataBinding: string;
    }>;
  }>(),
  
  // Optional link to org-specific document hub schema
  defaultDocumentHubSchemaId: int("defaultDocumentHubSchemaId"),
  
  // AI setup status
  aiSetupCompleted: boolean("aiSetupCompleted").default(false),
  aiSetupCompletedAt: timestamp("aiSetupCompletedAt"),
  
  // Audit
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
});
export type OrgPreference = typeof orgPreferences.$inferSelect;
export type InsertOrgPreference = typeof orgPreferences.$inferInsert;

/**
 * Org Preference Versions - for push update safety
 */
export const orgPreferenceVersions = mysqlTable("orgPreferenceVersions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  version: int("version").notNull(),
  
  // Snapshot of preferences at this version
  snapshotJson: json("snapshotJson").$type<OrgPreference>(),
  
  // Change summary
  changeSummary: text("changeSummary"),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy").notNull(),
}, (table) => ({
  orgVersionUnique: uniqueIndex("org_version_unique").on(table.organizationId, table.version),
}));
export type OrgPreferenceVersion = typeof orgPreferenceVersions.$inferSelect;
export type InsertOrgPreferenceVersion = typeof orgPreferenceVersions.$inferInsert;

/**
 * Field Packs - reusable bundles of fields and doc requirements
 * organizationId = null means KIISHA global template (read-only)
 */
export const fieldPacks = mysqlTable("fieldPacks", {
  id: int("id").autoincrement().primaryKey(),
  
  // null = KIISHA global template (read-only), orgId = org-customized pack
  organizationId: int("organizationId"),
  
  // Metadata
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Scope of this pack
  scope: mysqlEnum("scope", ["asset", "project", "site", "portfolio", "dataroom", "rfi"]).notNull(),
  
  // Field definitions
  fields: json("fields").$type<Array<{
    fieldKey: string;
    required: boolean;
    displayLabel: string;
    group: string;
    order: number;
    validationRules?: {
      type: string;
      min?: number;
      max?: number;
      pattern?: string;
    };
    sensitivity?: "public" | "internal" | "confidential" | "restricted";
  }>>(),
  
  // Document requirements
  docRequirements: json("docRequirements").$type<Array<{
    docTypeKey: string;
    required: boolean;
    reviewerGroups: string[];
    allowedFileTypes: string[];
    statusLightsConfig?: {
      green: string;
      yellow: string;
      red: string;
    };
  }>>(),
  
  // Chart configurations
  charts: json("charts").$type<Array<{
    chartKey: string;
    defaultType: string;
    allowedTypes: string[];
    dataBinding: string;
  }>>(),
  
  // Status
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft"),
  
  // If cloned from a template
  clonedFromId: int("clonedFromId"),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
});
export type FieldPack = typeof fieldPacks.$inferSelect;
export type InsertFieldPack = typeof fieldPacks.$inferInsert;

/**
 * AI Setup Proposals - stores AI recommendations for admin review
 */
export const aiSetupProposals = mysqlTable("aiSetupProposals", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  
  // Status
  status: mysqlEnum("status", ["pending", "approved", "rejected", "partially_approved"]).default("pending"),
  
  // Input documents used for generation
  inputDocumentIds: json("inputDocumentIds").$type<number[]>(),
  
  // Questionnaire responses (if provided)
  questionnaireResponses: json("questionnaireResponses").$type<{
    industry?: string;
    techStack?: string[];
    reportingStyle?: string;
    geographies?: string[];
    customResponses?: Record<string, string>;
  }>(),
  
  // AI-generated proposals
  proposedAssetClasses: json("proposedAssetClasses").$type<string[]>(),
  proposedConfigProfiles: json("proposedConfigProfiles").$type<string[]>(),
  proposedFieldPacks: json("proposedFieldPacks").$type<Array<{
    name: string;
    scope: string;
    fields: Array<{
      fieldKey: string;
      required: boolean;
      displayLabel: string;
      group: string;
    }>;
    confidence: number;
    reasoning: string;
  }>>(),
  proposedChartConfig: json("proposedChartConfig").$type<{
    charts: Array<{
      chartKey: string;
      chartType: string;
      dataBinding: string;
    }>;
    confidence: number;
    reasoning: string;
  }>(),
  proposedDocHubCategories: json("proposedDocHubCategories").$type<Array<{
    category: string;
    docTypes: string[];
    confidence: number;
    reasoning: string;
  }>>(),
  
  // Overall confidence and risks
  overallConfidence: decimal("overallConfidence", { precision: 5, scale: 2 }),
  risks: json("risks").$type<string[]>(),
  ambiguities: json("ambiguities").$type<string[]>(),
  
  // Admin review
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  
  // What was approved (subset of proposals)
  approvedItems: json("approvedItems").$type<{
    assetClasses: boolean;
    configProfiles: boolean;
    fieldPackIds: number[];
    chartConfig: boolean;
    docHubCategories: boolean;
  }>(),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AiSetupProposal = typeof aiSetupProposals.$inferSelect;
export type InsertAiSetupProposal = typeof aiSetupProposals.$inferInsert;

/**
 * User View Customizations - per-user customizations within org defaults
 * Separate from userViewPreferences (which handles default view selection)
 */
export const userViewCustomizations = mysqlTable("userViewCustomizations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  organizationId: int("organizationId").notNull(),
  
  // View reference
  viewId: int("viewId").notNull(),
  
  // User's local customizations
  localChartOverrides: json("localChartOverrides").$type<Array<{
    chartKey: string;
    chartType: string;
  }>>(),
  localColumnOrder: json("localColumnOrder").$type<string[]>(),
  localHiddenFields: json("localHiddenFields").$type<string[]>(),
  
  // Push update handling
  lastOrgUpdateVersion: int("lastOrgUpdateVersion"),
  hasLocalChanges: boolean("hasLocalChanges").default(false),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userViewCustomUnique: uniqueIndex("user_view_custom_unique").on(table.userId, table.organizationId, table.viewId),
}));
export type UserViewCustomization = typeof userViewCustomizations.$inferSelect;
export type InsertUserViewCustomization = typeof userViewCustomizations.$inferInsert;

/**
 * Push Update Notifications - tracks update prompts for users
 */
export const pushUpdateNotifications = mysqlTable("pushUpdateNotifications", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  
  // What was updated
  updateType: mysqlEnum("updateType", ["field_pack", "chart_config", "view_template", "doc_hub_schema"]).notNull(),
  updateSourceId: int("updateSourceId").notNull(),
  updateVersion: int("updateVersion").notNull(),
  
  // Update scope
  targetScope: mysqlEnum("targetScope", ["all_users", "team", "department", "specific_users"]).notNull(),
  targetIds: json("targetIds").$type<number[]>(),
  
  // Force update policy
  forceUpdate: boolean("forceUpdate").default(false),
  
  // Approval (if org policy requires)
  requiresApproval: boolean("requiresApproval").default(false),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  
  // Tracking
  notifiedUserIds: json("notifiedUserIds").$type<number[]>(),
  acceptedUserIds: json("acceptedUserIds").$type<number[]>(),
  
  // Audit
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PushUpdateNotification = typeof pushUpdateNotifications.$inferSelect;
export type InsertPushUpdateNotification = typeof pushUpdateNotifications.$inferInsert;


// ============================================================================
// PHASE 35: Authentication-First Access, Session Management, and Workspace Gating
// ============================================================================

/**
 * Server-side sessions table for secure session management
 * Replaces pure JWT-based sessions with server-tracked sessions
 */
export const serverSessions = mysqlTable("serverSessions", {
  id: varchar("id", { length: 64 }).primaryKey(), // Secure random session ID
  userId: int("userId").notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  
  // Revocation
  revokedAt: timestamp("revokedAt"),
  revokedReason: varchar("revokedReason", { length: 255 }),
  revokedBy: int("revokedBy"), // Admin who revoked, null if self or system
  
  // Security metadata (hashed for privacy)
  ipHash: varchar("ipHash", { length: 64 }),
  userAgentHash: varchar("userAgentHash", { length: 64 }),
  
  // MFA status
  mfaSatisfiedAt: timestamp("mfaSatisfiedAt"),
  
  // Token management
  refreshTokenHash: varchar("refreshTokenHash", { length: 64 }),
  csrfSecret: varchar("csrfSecret", { length: 64 }),
  
  // Active workspace context
  activeOrganizationId: int("activeOrganizationId"),
  
  // Device info (for session management UI)
  deviceType: varchar("deviceType", { length: 50 }), // desktop, mobile, tablet
  browserName: varchar("browserName", { length: 50 }),
  osName: varchar("osName", { length: 50 }),
}, (table) => [
  index("serverSessions_userId_idx").on(table.userId),
  index("serverSessions_expiresAt_idx").on(table.expiresAt),
  index("serverSessions_activeOrganizationId_idx").on(table.activeOrganizationId),
]);
export type ServerSession = typeof serverSessions.$inferSelect;
export type InsertServerSession = typeof serverSessions.$inferInsert;

/**
 * User last context for remembering workspace preferences
 */
export const userLastContext = mysqlTable("userLastContext", {
  userId: int("userId").primaryKey(),
  lastOrganizationId: int("lastOrganizationId"),
  lastViewId: int("lastViewId"),
  lastProjectId: int("lastProjectId"),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
});
export type UserLastContext = typeof userLastContext.$inferSelect;
export type InsertUserLastContext = typeof userLastContext.$inferInsert;

/**
 * MFA configuration for users
 */
export const userMfaConfig = mysqlTable("userMfaConfig", {
  userId: int("userId").primaryKey(),
  
  // TOTP configuration
  totpSecret: varchar("totpSecret", { length: 255 }), // Encrypted
  totpEnabled: boolean("totpEnabled").default(false).notNull(),
  totpVerifiedAt: timestamp("totpVerifiedAt"),
  
  // Backup codes (hashed)
  backupCodesHash: json("backupCodesHash").$type<string[]>(),
  backupCodesGeneratedAt: timestamp("backupCodesGeneratedAt"),
  backupCodesUsedCount: int("backupCodesUsedCount").default(0),
  
  // Recovery email (if different from primary)
  recoveryEmail: varchar("recoveryEmail", { length: 255 }),
  recoveryEmailVerified: boolean("recoveryEmailVerified").default(false),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type UserMfaConfig = typeof userMfaConfig.$inferSelect;
export type InsertUserMfaConfig = typeof userMfaConfig.$inferInsert;

/**
 * Auth audit log for security events
 */
export const authAuditLog = mysqlTable("authAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  
  // Event info
  eventType: mysqlEnum("eventType", [
    "login_success",
    "login_failed",
    "logout",
    "mfa_setup",
    "mfa_verified",
    "mfa_failed",
    "mfa_reset",
    "session_created",
    "session_revoked",
    "session_expired",
    "workspace_selected",
    "workspace_switched",
    "password_changed",
    "password_reset_requested",
    "password_reset_completed",
    "account_locked",
    "account_unlocked",
    "identifier_added",
    "identifier_revoked",
  ]).notNull(),
  
  // Actor
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 64 }),
  
  // Context
  organizationId: int("organizationId"),
  targetUserId: int("targetUserId"), // For admin actions on other users
  
  // Security metadata
  ipHash: varchar("ipHash", { length: 64 }),
  userAgentHash: varchar("userAgentHash", { length: 64 }),
  
  // Event details (no sensitive data)
  details: json("details").$type<Record<string, unknown>>(),
  
  // Result
  success: boolean("success").notNull(),
  failureReason: varchar("failureReason", { length: 255 }),
  
  // Timestamp
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("authAuditLog_userId_idx").on(table.userId),
  index("authAuditLog_eventType_idx").on(table.eventType),
  index("authAuditLog_createdAt_idx").on(table.createdAt),
  index("authAuditLog_organizationId_idx").on(table.organizationId),
]);
export type AuthAuditLog = typeof authAuditLog.$inferSelect;
export type InsertAuthAuditLog = typeof authAuditLog.$inferInsert;

/**
 * Login attempt tracking for rate limiting
 */
export const loginAttempts = mysqlTable("loginAttempts", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identifier (email hash for privacy)
  identifierHash: varchar("identifierHash", { length: 64 }).notNull(),
  ipHash: varchar("ipHash", { length: 64 }).notNull(),
  
  // Attempt info
  attemptedAt: timestamp("attemptedAt").defaultNow().notNull(),
  success: boolean("success").notNull(),
  
  // Lockout tracking
  failureCount: int("failureCount").default(0),
  lockedUntil: timestamp("lockedUntil"),
}, (table) => [
  index("loginAttempts_identifierHash_idx").on(table.identifierHash),
  index("loginAttempts_ipHash_idx").on(table.ipHash),
  index("loginAttempts_attemptedAt_idx").on(table.attemptedAt),
]);
export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type InsertLoginAttempt = typeof loginAttempts.$inferInsert;


// ============================================================================
// PHASE 36: OBLIGATIONS + CALENDAR LENS + NOTIFICATIONS
// ============================================================================

/**
 * Obligation types enum
 */
export const obligationTypeEnum = mysqlEnum("obligationType", [
  "RFI_ITEM",
  "APPROVAL_GATE",
  "WORK_ORDER",
  "MAINTENANCE",
  "DOCUMENT_EXPIRY",
  "MILESTONE",
  "REPORT_DEADLINE",
  "COMPLIANCE_REQUIREMENT",
  "CUSTOM"
]);

/**
 * Obligation status enum
 */
export const obligationStatusEnum = mysqlEnum("obligationStatus", [
  "OPEN",
  "IN_PROGRESS",
  "BLOCKED",
  "WAITING_REVIEW",
  "APPROVED",
  "COMPLETED",
  "OVERDUE",
  "CANCELLED"
]);

/**
 * Obligation priority enum
 */
export const obligationPriorityEnum = mysqlEnum("obligationPriority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL"
]);

/**
 * Obligation visibility enum
 */
export const obligationVisibilityEnum = mysqlEnum("obligationVisibility", [
  "INTERNAL_ONLY",
  "ORG_SHARED",
  "EXTERNAL_GRANTED"
]);

/**
 * Obligation source type enum
 */
export const obligationSourceTypeEnum = mysqlEnum("obligationSourceType", [
  "MANUAL",
  "AI_SUGGESTED",
  "TEMPLATE",
  "INGESTED_DOC",
  "INTEGRATION"
]);

/**
 * Canonical obligations table - the single source of truth for all time-based items
 */
export const obligations = mysqlTable("obligations", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  
  // Core fields
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  
  // Type and status
  obligationType: obligationTypeEnum.notNull(),
  status: obligationStatusEnum.default("OPEN").notNull(),
  priority: obligationPriorityEnum.default("MEDIUM").notNull(),
  
  // Time fields
  startAt: timestamp("startAt"),
  dueAt: timestamp("dueAt"),
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  recurrenceRule: varchar("recurrenceRule", { length: 500 }), // RRULE format
  
  // Policy references
  reminderPolicyId: int("reminderPolicyId"),
  escalationPolicyId: int("escalationPolicyId"),
  
  // Visibility and access
  visibility: obligationVisibilityEnum.default("ORG_SHARED").notNull(),
  
  // Source tracking (provenance)
  sourceType: obligationSourceTypeEnum.default("MANUAL").notNull(),
  sourceRef: json("sourceRef").$type<{
    docId?: number;
    formId?: number;
    rfiId?: number;
    workOrderId?: number;
    clauseRef?: string;
    checklistItemId?: number;
    complianceItemId?: number;
  }>(),
  
  // VATR integration
  vatrFieldPointers: json("vatrFieldPointers").$type<{
    clusterId?: string;
    fieldIds?: string[];
    assetId?: number;
  }>(),
  
  // AI suggestion metadata
  aiConfidence: decimal("aiConfidence", { precision: 5, scale: 4 }),
  aiSuggestionAccepted: boolean("aiSuggestionAccepted"),
  aiSuggestionAcceptedAt: timestamp("aiSuggestionAcceptedAt"),
  aiSuggestionAcceptedBy: int("aiSuggestionAcceptedBy"),
  
  // Completion tracking
  completedAt: timestamp("completedAt"),
  completedByUserId: int("completedByUserId"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("obligations_organizationId_idx").on(table.organizationId),
  index("obligations_dueAt_idx").on(table.dueAt),
  index("obligations_status_idx").on(table.status),
  index("obligations_obligationType_idx").on(table.obligationType),
  index("obligations_createdByUserId_idx").on(table.createdByUserId),
  index("obligations_org_status_due_idx").on(table.organizationId, table.status, table.dueAt),
]);
export type Obligation = typeof obligations.$inferSelect;
export type InsertObligation = typeof obligations.$inferInsert;

/**
 * Obligation link entity type enum
 */
export const obligationLinkEntityTypeEnum = mysqlEnum("obligationLinkEntityType", [
  "ASSET",
  "PROJECT",
  "SITE",
  "DATAROOM",
  "RFI",
  "WORKSPACE_VIEW",
  "DOCUMENT",
  "PORTFOLIO"
]);

/**
 * Obligation link type enum
 */
export const obligationLinkTypeEnum = mysqlEnum("obligationLinkType", [
  "PRIMARY",
  "SECONDARY"
]);

/**
 * Obligation links - connects obligations to entities
 */
export const obligationLinks = mysqlTable("obligationLinks", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  obligationId: int("obligationId").notNull(),
  
  // Entity reference
  entityType: obligationLinkEntityTypeEnum.notNull(),
  entityId: int("entityId").notNull(),
  
  // Link type
  linkType: obligationLinkTypeEnum.default("SECONDARY").notNull(),
  
  // Audit
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("obligationLinks_obligationId_idx").on(table.obligationId),
  index("obligationLinks_entityType_entityId_idx").on(table.entityType, table.entityId),
  index("obligationLinks_organizationId_idx").on(table.organizationId),
  // Unique constraint for primary links per entity type
  unique("obligationLinks_primary_unique").on(table.obligationId, table.entityType, table.linkType),
]);
export type ObligationLink = typeof obligationLinks.$inferSelect;
export type InsertObligationLink = typeof obligationLinks.$inferInsert;

/**
 * Obligation assignment role enum
 */
export const obligationAssignmentRoleEnum = mysqlEnum("obligationAssignmentRole", [
  "OWNER",
  "CONTRIBUTOR",
  "REVIEWER",
  "APPROVER"
]);

/**
 * Obligation assignee type enum
 */
export const obligationAssigneeTypeEnum = mysqlEnum("obligationAssigneeType", [
  "USER",
  "TEAM"
]);

/**
 * Obligation assignments - who is responsible for obligations
 */
export const obligationAssignments = mysqlTable("obligationAssignments", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  obligationId: int("obligationId").notNull(),
  
  // Assignee
  assigneeType: obligationAssigneeTypeEnum.notNull(),
  assigneeId: int("assigneeId").notNull(),
  
  // Role
  role: obligationAssignmentRoleEnum.default("CONTRIBUTOR").notNull(),
  
  // Audit
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("obligationAssignments_obligationId_idx").on(table.obligationId),
  index("obligationAssignments_assigneeId_idx").on(table.assigneeId),
  index("obligationAssignments_organizationId_idx").on(table.organizationId),
  unique("obligationAssignments_unique").on(table.obligationId, table.assigneeType, table.assigneeId),
]);
export type ObligationAssignment = typeof obligationAssignments.$inferSelect;
export type InsertObligationAssignment = typeof obligationAssignments.$inferInsert;

/**
 * Obligation audit log - immutable history of all changes
 */
export const obligationAuditLog = mysqlTable("obligationAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  obligationId: int("obligationId").notNull(),
  
  // Action type
  action: mysqlEnum("action", [
    "CREATED",
    "UPDATED",
    "STATUS_CHANGED",
    "ASSIGNED",
    "UNASSIGNED",
    "LINKED",
    "UNLINKED",
    "REMINDER_SENT",
    "ESCALATED",
    "COMPLETED",
    "CANCELLED",
    "AI_SUGGESTION_ACCEPTED",
    "AI_SUGGESTION_REJECTED",
    "EXPORTED",
    "SHARED"
  ]).notNull(),
  
  // Change details
  previousValue: json("previousValue").$type<Record<string, unknown>>(),
  newValue: json("newValue").$type<Record<string, unknown>>(),
  
  // Actor
  userId: int("userId"),
  systemGenerated: boolean("systemGenerated").default(false),
  
  // Context
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: varchar("userAgent", { length: 500 }),
  
  // Timestamp
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("obligationAuditLog_obligationId_idx").on(table.obligationId),
  index("obligationAuditLog_organizationId_idx").on(table.organizationId),
  index("obligationAuditLog_createdAt_idx").on(table.createdAt),
  index("obligationAuditLog_action_idx").on(table.action),
]);
export type ObligationAuditLog = typeof obligationAuditLog.$inferSelect;
export type InsertObligationAuditLog = typeof obligationAuditLog.$inferInsert;

/**
 * Reminder policies - define when and how to send reminders
 */
export const reminderPolicies = mysqlTable("reminderPolicies", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  
  // Policy details
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false),
  isActive: boolean("isActive").default(true),
  
  // Channels to use
  channels: json("channels").$type<{
    inApp: boolean;
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
  }>().notNull(),
  
  // Reminder rules (when to send)
  rules: json("rules").$type<{
    beforeDue?: { days: number; hours?: number }[];
    onDue?: boolean;
    afterDue?: { days: number; hours?: number }[];
  }>().notNull(),
  
  // Quiet hours (don't send during these times)
  quietHours: json("quietHours").$type<{
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
    timezone: string;
    excludeWeekends: boolean;
  }>(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("reminderPolicies_organizationId_idx").on(table.organizationId),
]);
export type ReminderPolicy = typeof reminderPolicies.$inferSelect;
export type InsertReminderPolicy = typeof reminderPolicies.$inferInsert;

/**
 * Escalation policies - define when and how to escalate overdue items
 */
export const escalationPolicies = mysqlTable("escalationPolicies", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  
  // Policy details
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false),
  isActive: boolean("isActive").default(true),
  
  // Escalation rules
  rules: json("rules").$type<{
    triggers: {
      daysOverdue: number;
      notifyRoles: string[];
      notifyUserIds?: number[];
      notifyTeamIds?: number[];
      escalationLevel: number;
    }[];
    maxEscalationLevel: number;
  }>().notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("escalationPolicies_organizationId_idx").on(table.organizationId),
]);
export type EscalationPolicy = typeof escalationPolicies.$inferSelect;
export type InsertEscalationPolicy = typeof escalationPolicies.$inferInsert;

/**
 * Notification events - audit trail for all notifications sent
 */
export const notificationEvents = mysqlTable("notificationEvents", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  
  // Reference to obligation
  obligationId: int("obligationId"),
  
  // Event type
  eventType: mysqlEnum("eventType", [
    "REMINDER",
    "ESCALATION",
    "STATUS_CHANGE",
    "ASSIGNMENT",
    "COMMENT",
    "DUE_TODAY",
    "OVERDUE"
  ]).notNull(),
  
  // Recipient
  recipientUserId: int("recipientUserId").notNull(),
  
  // Channel and delivery
  channel: mysqlEnum("channel", ["in_app", "email", "whatsapp", "sms"]).notNull(),
  templateId: varchar("templateId", { length: 100 }),
  
  // Delivery status
  status: mysqlEnum("status", ["queued", "sent", "delivered", "failed", "bounced"]).default("queued").notNull(),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  failedAt: timestamp("failedAt"),
  failureReason: text("failureReason"),
  
  // Content (for audit, not for rendering)
  contentSnapshot: json("contentSnapshot").$type<{
    subject?: string;
    body?: string;
    templateData?: Record<string, unknown>;
  }>(),
  
  // Correlation
  correlationId: varchar("correlationId", { length: 64 }),
  jobId: int("jobId"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("notificationEvents_organizationId_idx").on(table.organizationId),
  index("notificationEvents_obligationId_idx").on(table.obligationId),
  index("notificationEvents_recipientUserId_idx").on(table.recipientUserId),
  index("notificationEvents_createdAt_idx").on(table.createdAt),
  index("notificationEvents_status_idx").on(table.status),
]);
export type NotificationEvent = typeof notificationEvents.$inferSelect;
export type InsertNotificationEvent = typeof notificationEvents.$inferInsert;

/**
 * External calendar provider enum
 */
export const calendarProviderEnum = mysqlEnum("calendarProvider", [
  "GOOGLE",
  "MICROSOFT",
  "APPLE"
]);

/**
 * External calendar bindings - user's connected calendars
 */
export const externalCalendarBindings = mysqlTable("externalCalendarBindings", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId").notNull(),
  
  // Provider info
  provider: calendarProviderEnum.notNull(),
  
  // OAuth tokens (encrypted)
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  
  // Calendar selection
  calendarId: varchar("calendarId", { length: 500 }).notNull(),
  calendarName: varchar("calendarName", { length: 200 }),
  
  // Status
  status: mysqlEnum("status", ["active", "revoked", "expired", "error"]).default("active").notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  lastError: text("lastError"),
  
  // Sync preferences
  syncEnabled: boolean("syncEnabled").default(true),
  syncObligationTypes: json("syncObligationTypes").$type<string[]>(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("externalCalendarBindings_userId_idx").on(table.userId),
  index("externalCalendarBindings_organizationId_idx").on(table.organizationId),
  unique("externalCalendarBindings_user_provider_unique").on(table.userId, table.provider),
]);
export type ExternalCalendarBinding = typeof externalCalendarBindings.$inferSelect;
export type InsertExternalCalendarBinding = typeof externalCalendarBindings.$inferInsert;

/**
 * External calendar events - tracks synced events
 */
export const externalCalendarEvents = mysqlTable("externalCalendarEvents", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  obligationId: int("obligationId").notNull(),
  userId: int("userId").notNull(),
  bindingId: int("bindingId").notNull(),
  
  // External event reference
  provider: calendarProviderEnum.notNull(),
  externalEventId: varchar("externalEventId", { length: 500 }).notNull(),
  
  // Sync status
  syncStatus: mysqlEnum("syncStatus", ["synced", "pending", "failed", "deleted"]).default("pending").notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  lastSyncError: text("lastSyncError"),
  
  // Version tracking for conflict detection
  localVersion: int("localVersion").default(1),
  externalVersion: varchar("externalVersion", { length: 100 }),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("externalCalendarEvents_obligationId_idx").on(table.obligationId),
  index("externalCalendarEvents_userId_idx").on(table.userId),
  index("externalCalendarEvents_organizationId_idx").on(table.organizationId),
  unique("externalCalendarEvents_obligation_user_unique").on(table.obligationId, table.userId, table.provider),
]);
export type ExternalCalendarEvent = typeof externalCalendarEvents.$inferSelect;
export type InsertExternalCalendarEvent = typeof externalCalendarEvents.$inferInsert;

/**
 * Obligation view overlays - tracks which obligations are visible in which views
 */
export const obligationViewOverlays = mysqlTable("obligationViewOverlays", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  viewId: int("viewId").notNull(),
  obligationId: int("obligationId").notNull(),
  
  // Visibility in this view
  isVisible: boolean("isVisible").default(true),
  removedAt: timestamp("removedAt"),
  removedByUserId: int("removedByUserId"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("obligationViewOverlays_viewId_idx").on(table.viewId),
  index("obligationViewOverlays_obligationId_idx").on(table.obligationId),
  index("obligationViewOverlays_organizationId_idx").on(table.organizationId),
  unique("obligationViewOverlays_view_obligation_unique").on(table.viewId, table.obligationId),
]);
export type ObligationViewOverlay = typeof obligationViewOverlays.$inferSelect;
export type InsertObligationViewOverlay = typeof obligationViewOverlays.$inferInsert;


/**
 * Password reset tokens - for forgot password flow
 */
export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("passwordResetTokens_userId_idx").on(table.userId),
  index("passwordResetTokens_token_idx").on(table.token),
  index("passwordResetTokens_expiresAt_idx").on(table.expiresAt),
]);
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;


// ============================================================================
// PHASE 38: EMAIL TEMPLATES, REQUEST REMINDERS, BULK IMPORT
// ============================================================================

/**
 * Email template type enum
 */
export const emailTemplateTypeEnum = mysqlEnum("emailTemplateType", [
  "request_issued",
  "request_reminder",
  "request_submitted",
  "request_clarification",
  "request_completed",
  "request_overdue",
  "password_reset",
  "welcome",
  "invitation",
  "custom"
]);

/**
 * Organization email templates - customizable email templates per org
 */
export const emailTemplates = mysqlTable("emailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  
  // Template identification
  templateType: emailTemplateTypeEnum.notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Template content
  subject: varchar("subject", { length: 500 }).notNull(),
  bodyHtml: text("bodyHtml").notNull(),
  bodyText: text("bodyText"), // Plain text fallback
  
  // Branding
  headerLogoUrl: varchar("headerLogoUrl", { length: 500 }),
  footerText: text("footerText"),
  primaryColor: varchar("primaryColor", { length: 7 }), // Hex color
  
  // Available variables for this template type
  availableVariables: json("availableVariables").$type<string[]>(),
  
  // Status
  isActive: boolean("isActive").default(true),
  isDefault: boolean("isDefault").default(false),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
}, (table) => [
  index("emailTemplates_organizationId_idx").on(table.organizationId),
  index("emailTemplates_templateType_idx").on(table.templateType),
  unique("emailTemplates_org_type_default").on(table.organizationId, table.templateType, table.isDefault),
]);
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

/**
 * Request reminder status enum
 */
export const reminderStatusEnum = mysqlEnum("reminderStatus", [
  "pending",
  "sent",
  "failed",
  "cancelled"
]);

/**
 * Request reminders - scheduled reminders for requests approaching deadline
 */
export const requestReminders = mysqlTable("requestReminders", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  
  // Request reference
  requestId: int("requestId").notNull(),
  recipientUserId: int("recipientUserId").notNull(),
  
  // Reminder timing
  reminderType: mysqlEnum("reminderType", ["3_days", "1_day", "overdue", "custom"]).notNull(),
  scheduledFor: timestamp("scheduledFor").notNull(),
  
  // Status
  status: reminderStatusEnum.default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  failedAt: timestamp("failedAt"),
  failureReason: text("failureReason"),
  
  // Email template used
  emailTemplateId: int("emailTemplateId"),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("requestReminders_organizationId_idx").on(table.organizationId),
  index("requestReminders_requestId_idx").on(table.requestId),
  index("requestReminders_scheduledFor_idx").on(table.scheduledFor),
  index("requestReminders_status_idx").on(table.status),
]);
export type RequestReminder = typeof requestReminders.$inferSelect;
export type InsertRequestReminder = typeof requestReminders.$inferInsert;

/**
 * Organization reminder settings - configurable reminder policies
 */
export const reminderSettings = mysqlTable("reminderSettings", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().unique(),
  
  // Enable/disable reminders
  remindersEnabled: boolean("remindersEnabled").default(true),
  
  // Reminder timing (days before due)
  firstReminderDays: int("firstReminderDays").default(3),
  secondReminderDays: int("secondReminderDays").default(1),
  overdueReminderEnabled: boolean("overdueReminderEnabled").default(true),
  
  // Custom reminder intervals (optional)
  customReminderDays: json("customReminderDays").$type<number[]>(),
  
  // Audit
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
});
export type ReminderSettings = typeof reminderSettings.$inferSelect;
export type InsertReminderSettings = typeof reminderSettings.$inferInsert;

/**
 * Asset import job status enum
 */
export const importJobStatusEnum = mysqlEnum("importJobStatus", [
  "pending",
  "validating",
  "validated",
  "validation_failed",
  "importing",
  "completed",
  "failed",
  "cancelled"
]);

/**
 * Asset import jobs - tracks bulk import operations
 */
export const assetImportJobs = mysqlTable("assetImportJobs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  
  // File info
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileType: mysqlEnum("fileType", ["csv", "xlsx", "xls"]).notNull(),
  fileSize: int("fileSize"),
  
  // Import configuration
  targetAssetClass: varchar("targetAssetClass", { length: 100 }),
  columnMapping: json("columnMapping").$type<Record<string, string>>(), // file column -> VATR field
  
  // Status
  status: importJobStatusEnum.default("pending").notNull(),
  
  // Progress tracking
  totalRows: int("totalRows"),
  processedRows: int("processedRows").default(0),
  successRows: int("successRows").default(0),
  errorRows: int("errorRows").default(0),
  
  // Validation results
  validationErrors: json("validationErrors").$type<Array<{
    row: number;
    column: string;
    error: string;
    value?: string;
  }>>(),
  
  // Import results
  importedAssetIds: json("importedAssetIds").$type<number[]>(),
  importErrors: json("importErrors").$type<Array<{
    row: number;
    error: string;
  }>>(),
  
  // Timing
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy").notNull(),
}, (table) => [
  index("assetImportJobs_organizationId_idx").on(table.organizationId),
  index("assetImportJobs_status_idx").on(table.status),
  index("assetImportJobs_createdAt_idx").on(table.createdAt),
]);
export type AssetImportJob = typeof assetImportJobs.$inferSelect;
export type InsertAssetImportJob = typeof assetImportJobs.$inferInsert;

/**
 * Asset import templates - saved column mappings for reuse
 */
export const assetImportTemplates = mysqlTable("assetImportTemplates", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  
  // Template info
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Target asset class
  targetAssetClass: varchar("targetAssetClass", { length: 100 }).notNull(),
  
  // Column mapping
  columnMapping: json("columnMapping").$type<Record<string, string>>().notNull(),
  
  // Expected columns (for validation)
  expectedColumns: json("expectedColumns").$type<string[]>(),
  
  // Status
  isActive: boolean("isActive").default(true),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("assetImportTemplates_organizationId_idx").on(table.organizationId),
]);
export type AssetImportTemplate = typeof assetImportTemplates.$inferSelect;
export type InsertAssetImportTemplate = typeof assetImportTemplates.$inferInsert;
