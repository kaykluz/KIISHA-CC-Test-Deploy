CREATE TABLE `escalationPolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`isDefault` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`rules` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `escalationPolicies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `externalCalendarBindings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`calendarProvider` enum('GOOGLE','MICROSOFT','APPLE') NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`calendarId` varchar(500) NOT NULL,
	`calendarName` varchar(200),
	`status` enum('active','revoked','expired','error') NOT NULL DEFAULT 'active',
	`lastSyncAt` timestamp,
	`lastError` text,
	`syncEnabled` boolean DEFAULT true,
	`syncObligationTypes` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `externalCalendarBindings_id` PRIMARY KEY(`id`),
	CONSTRAINT `externalCalendarBindings_user_provider_unique` UNIQUE(`userId`,`calendarProvider`)
);
--> statement-breakpoint
CREATE TABLE `externalCalendarEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`obligationId` int NOT NULL,
	`userId` int NOT NULL,
	`bindingId` int NOT NULL,
	`calendarProvider` enum('GOOGLE','MICROSOFT','APPLE') NOT NULL,
	`externalEventId` varchar(500) NOT NULL,
	`syncStatus` enum('synced','pending','failed','deleted') NOT NULL DEFAULT 'pending',
	`lastSyncedAt` timestamp,
	`lastSyncError` text,
	`localVersion` int DEFAULT 1,
	`externalVersion` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `externalCalendarEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `externalCalendarEvents_obligation_user_unique` UNIQUE(`obligationId`,`userId`,`calendarProvider`)
);
--> statement-breakpoint
CREATE TABLE `notificationEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`obligationId` int,
	`eventType` enum('REMINDER','ESCALATION','STATUS_CHANGE','ASSIGNMENT','COMMENT','DUE_TODAY','OVERDUE') NOT NULL,
	`recipientUserId` int NOT NULL,
	`channel` enum('in_app','email','whatsapp','sms') NOT NULL,
	`templateId` varchar(100),
	`status` enum('queued','sent','delivered','failed','bounced') NOT NULL DEFAULT 'queued',
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`failedAt` timestamp,
	`failureReason` text,
	`contentSnapshot` json,
	`correlationId` varchar(64),
	`jobId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificationEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obligationAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`obligationId` int NOT NULL,
	`obligationAssigneeType` enum('USER','TEAM') NOT NULL,
	`assigneeId` int NOT NULL,
	`obligationAssignmentRole` enum('OWNER','CONTRIBUTOR','REVIEWER','APPROVER') NOT NULL DEFAULT 'CONTRIBUTOR',
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obligationAssignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `obligationAssignments_unique` UNIQUE(`obligationId`,`obligationAssigneeType`,`assigneeId`)
);
--> statement-breakpoint
CREATE TABLE `obligationAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`obligationId` int NOT NULL,
	`action` enum('CREATED','UPDATED','STATUS_CHANGED','ASSIGNED','UNASSIGNED','LINKED','UNLINKED','REMINDER_SENT','ESCALATED','COMPLETED','CANCELLED','AI_SUGGESTION_ACCEPTED','AI_SUGGESTION_REJECTED','EXPORTED','SHARED') NOT NULL,
	`previousValue` json,
	`newValue` json,
	`userId` int,
	`systemGenerated` boolean DEFAULT false,
	`ipAddress` varchar(45),
	`userAgent` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obligationAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obligationLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`obligationId` int NOT NULL,
	`obligationLinkEntityType` enum('ASSET','PROJECT','SITE','DATAROOM','RFI','WORKSPACE_VIEW','DOCUMENT','PORTFOLIO') NOT NULL,
	`entityId` int NOT NULL,
	`obligationLinkType` enum('PRIMARY','SECONDARY') NOT NULL DEFAULT 'SECONDARY',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obligationLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `obligationLinks_primary_unique` UNIQUE(`obligationId`,`obligationLinkEntityType`,`obligationLinkType`)
);
--> statement-breakpoint
CREATE TABLE `obligationViewOverlays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`viewId` int NOT NULL,
	`obligationId` int NOT NULL,
	`isVisible` boolean DEFAULT true,
	`removedAt` timestamp,
	`removedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obligationViewOverlays_id` PRIMARY KEY(`id`),
	CONSTRAINT `obligationViewOverlays_view_obligation_unique` UNIQUE(`viewId`,`obligationId`)
);
--> statement-breakpoint
CREATE TABLE `obligations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`obligationType` enum('RFI_ITEM','APPROVAL_GATE','WORK_ORDER','MAINTENANCE','DOCUMENT_EXPIRY','MILESTONE','REPORT_DEADLINE','COMPLIANCE_REQUIREMENT','CUSTOM') NOT NULL,
	`obligationStatus` enum('OPEN','IN_PROGRESS','BLOCKED','WAITING_REVIEW','APPROVED','COMPLETED','OVERDUE','CANCELLED') NOT NULL DEFAULT 'OPEN',
	`obligationPriority` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
	`startAt` timestamp,
	`dueAt` timestamp,
	`timezone` varchar(64) DEFAULT 'UTC',
	`recurrenceRule` varchar(500),
	`reminderPolicyId` int,
	`escalationPolicyId` int,
	`obligationVisibility` enum('INTERNAL_ONLY','ORG_SHARED','EXTERNAL_GRANTED') NOT NULL DEFAULT 'ORG_SHARED',
	`obligationSourceType` enum('MANUAL','AI_SUGGESTED','TEMPLATE','INGESTED_DOC','INTEGRATION') NOT NULL DEFAULT 'MANUAL',
	`sourceRef` json,
	`vatrFieldPointers` json,
	`aiConfidence` decimal(5,4),
	`aiSuggestionAccepted` boolean,
	`aiSuggestionAcceptedAt` timestamp,
	`aiSuggestionAcceptedBy` int,
	`completedAt` timestamp,
	`completedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `obligations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminderPolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`isDefault` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`channels` json NOT NULL,
	`rules` json NOT NULL,
	`quietHours` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reminderPolicies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `escalationPolicies_organizationId_idx` ON `escalationPolicies` (`organizationId`);--> statement-breakpoint
CREATE INDEX `externalCalendarBindings_userId_idx` ON `externalCalendarBindings` (`userId`);--> statement-breakpoint
CREATE INDEX `externalCalendarBindings_organizationId_idx` ON `externalCalendarBindings` (`organizationId`);--> statement-breakpoint
CREATE INDEX `externalCalendarEvents_obligationId_idx` ON `externalCalendarEvents` (`obligationId`);--> statement-breakpoint
CREATE INDEX `externalCalendarEvents_userId_idx` ON `externalCalendarEvents` (`userId`);--> statement-breakpoint
CREATE INDEX `externalCalendarEvents_organizationId_idx` ON `externalCalendarEvents` (`organizationId`);--> statement-breakpoint
CREATE INDEX `notificationEvents_organizationId_idx` ON `notificationEvents` (`organizationId`);--> statement-breakpoint
CREATE INDEX `notificationEvents_obligationId_idx` ON `notificationEvents` (`obligationId`);--> statement-breakpoint
CREATE INDEX `notificationEvents_recipientUserId_idx` ON `notificationEvents` (`recipientUserId`);--> statement-breakpoint
CREATE INDEX `notificationEvents_createdAt_idx` ON `notificationEvents` (`createdAt`);--> statement-breakpoint
CREATE INDEX `notificationEvents_status_idx` ON `notificationEvents` (`status`);--> statement-breakpoint
CREATE INDEX `obligationAssignments_obligationId_idx` ON `obligationAssignments` (`obligationId`);--> statement-breakpoint
CREATE INDEX `obligationAssignments_assigneeId_idx` ON `obligationAssignments` (`assigneeId`);--> statement-breakpoint
CREATE INDEX `obligationAssignments_organizationId_idx` ON `obligationAssignments` (`organizationId`);--> statement-breakpoint
CREATE INDEX `obligationAuditLog_obligationId_idx` ON `obligationAuditLog` (`obligationId`);--> statement-breakpoint
CREATE INDEX `obligationAuditLog_organizationId_idx` ON `obligationAuditLog` (`organizationId`);--> statement-breakpoint
CREATE INDEX `obligationAuditLog_createdAt_idx` ON `obligationAuditLog` (`createdAt`);--> statement-breakpoint
CREATE INDEX `obligationAuditLog_action_idx` ON `obligationAuditLog` (`action`);--> statement-breakpoint
CREATE INDEX `obligationLinks_obligationId_idx` ON `obligationLinks` (`obligationId`);--> statement-breakpoint
CREATE INDEX `obligationLinks_entityType_entityId_idx` ON `obligationLinks` (`obligationLinkEntityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `obligationLinks_organizationId_idx` ON `obligationLinks` (`organizationId`);--> statement-breakpoint
CREATE INDEX `obligationViewOverlays_viewId_idx` ON `obligationViewOverlays` (`viewId`);--> statement-breakpoint
CREATE INDEX `obligationViewOverlays_obligationId_idx` ON `obligationViewOverlays` (`obligationId`);--> statement-breakpoint
CREATE INDEX `obligationViewOverlays_organizationId_idx` ON `obligationViewOverlays` (`organizationId`);--> statement-breakpoint
CREATE INDEX `obligations_organizationId_idx` ON `obligations` (`organizationId`);--> statement-breakpoint
CREATE INDEX `obligations_dueAt_idx` ON `obligations` (`dueAt`);--> statement-breakpoint
CREATE INDEX `obligations_status_idx` ON `obligations` (`obligationStatus`);--> statement-breakpoint
CREATE INDEX `obligations_obligationType_idx` ON `obligations` (`obligationType`);--> statement-breakpoint
CREATE INDEX `obligations_createdByUserId_idx` ON `obligations` (`createdByUserId`);--> statement-breakpoint
CREATE INDEX `obligations_org_status_due_idx` ON `obligations` (`organizationId`,`obligationStatus`,`dueAt`);--> statement-breakpoint
CREATE INDEX `reminderPolicies_organizationId_idx` ON `reminderPolicies` (`organizationId`);