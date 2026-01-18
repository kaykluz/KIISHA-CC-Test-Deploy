CREATE TABLE `assetFieldHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`fieldKey` varchar(255) NOT NULL,
	`oldValue` text,
	`newValue` text,
	`changeType` enum('ai_extracted','manual_edit','verified','suppressed_in_view','restored_in_view','superseded','archived','unarchived') NOT NULL,
	`sourceFileId` int,
	`sourcePage` int,
	`sourceSnippet` text,
	`confidence` decimal(5,4),
	`verifiedBy` int,
	`verifiedAt` timestamp,
	`changedBy` int NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	`reason` text,
	`viewId` int,
	CONSTRAINT `assetFieldHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentArchiveHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`action` enum('archived','unarchived','superseded') NOT NULL,
	`reason` text,
	`supersededById` int,
	`performedBy` int NOT NULL,
	`performedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentArchiveHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exportManifests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`viewId` int,
	`viewType` varchar(50),
	`exportType` enum('csv','pdf','due_diligence_pack','json') NOT NULL,
	`exportedBy` int NOT NULL,
	`exportedAt` timestamp NOT NULL DEFAULT (now()),
	`itemsExported` json,
	`provenanceRefs` json,
	`fileUrl` text,
	`fileSize` int,
	`requiresSignoff` boolean DEFAULT false,
	`signedOffBy` int,
	`signedOffAt` timestamp,
	CONSTRAINT `exportManifests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `viewFieldOverrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`viewId` int NOT NULL,
	`assetId` int NOT NULL,
	`fieldKey` varchar(255) NOT NULL,
	`state` enum('show','hide','show_latest_only','show_specific_version') NOT NULL DEFAULT 'show',
	`specificVersionId` int,
	`reason` text,
	`updatedBy` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `viewFieldOverrides_id` PRIMARY KEY(`id`),
	CONSTRAINT `view_field_unique` UNIQUE(`viewId`,`assetId`,`fieldKey`)
);
--> statement-breakpoint
CREATE TABLE `viewItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`viewId` int NOT NULL,
	`entityType` enum('asset','project','document','field','evidence','task','rfi','checklist_item') NOT NULL,
	`entityId` int NOT NULL,
	`inclusionState` enum('included','excluded','suggested') NOT NULL DEFAULT 'included',
	`reason` text,
	`updatedBy` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `viewItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `view_entity_unique` UNIQUE(`viewId`,`entityType`,`entityId`)
);
--> statement-breakpoint
CREATE TABLE `viewScopes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`viewType` enum('portfolio','dataroom','report','checklist','custom') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`ownerId` int NOT NULL,
	`projectId` int,
	`config` json,
	`isPublic` boolean DEFAULT false,
	`sharedWith` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `viewScopes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assetAttributes` ADD `visibilityState` enum('active','archived','superseded') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `assetAttributes` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `assetAttributes` ADD `archivedBy` int;--> statement-breakpoint
ALTER TABLE `assetAttributes` ADD `archiveReason` text;--> statement-breakpoint
ALTER TABLE `closingChecklistItems` ADD `visibilityState` enum('active','archived','superseded') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `closingChecklistItems` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `closingChecklistItems` ADD `archivedBy` int;--> statement-breakpoint
ALTER TABLE `closingChecklistItems` ADD `archiveReason` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `visibilityState` enum('active','archived','superseded') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `documents` ADD `archivedBy` int;--> statement-breakpoint
ALTER TABLE `documents` ADD `archiveReason` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `supersededById` int;--> statement-breakpoint
ALTER TABLE `rfis` ADD `visibilityState` enum('active','archived','superseded') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `rfis` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `rfis` ADD `archivedBy` int;--> statement-breakpoint
ALTER TABLE `rfis` ADD `archiveReason` text;