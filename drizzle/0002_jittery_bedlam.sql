CREATE TABLE `auditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int,
	`oldValue` json,
	`newValue` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checklistItemDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checklistItemId` int NOT NULL,
	`documentId` int NOT NULL,
	CONSTRAINT `checklistItemDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `closingChecklistItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checklistId` int NOT NULL,
	`category` varchar(100),
	`name` varchar(500) NOT NULL,
	`description` text,
	`ownerId` int,
	`status` enum('not_started','in_progress','pending_review','completed','blocked','na') DEFAULT 'not_started',
	`dueDate` date,
	`completedAt` timestamp,
	`comments` text,
	`sortOrder` int DEFAULT 0,
	`isRequired` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `closingChecklistItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `closingChecklists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`transactionType` enum('acquisition','financing','sale','development') DEFAULT 'acquisition',
	`targetCloseDate` date,
	`status` enum('draft','active','completed','cancelled') DEFAULT 'draft',
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `closingChecklists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`reviewerGroupId` int NOT NULL,
	`reviewerId` int,
	`status` enum('pending','approved','rejected','needs_revision') NOT NULL DEFAULT 'pending',
	`notes` text,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documentReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizationMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('admin','editor','reviewer','investor_viewer') NOT NULL DEFAULT 'editor',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizationMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `projectMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('admin','editor','reviewer','investor_viewer') NOT NULL DEFAULT 'editor',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviewerGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` enum('legal','technical','finance') NOT NULL,
	`description` text,
	`sortOrder` int DEFAULT 0,
	CONSTRAINT `reviewerGroups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfiChecklistLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfiId` int NOT NULL,
	`checklistItemId` int NOT NULL,
	CONSTRAINT `rfiChecklistLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfiScheduleLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfiId` int NOT NULL,
	`scheduleItemId` int NOT NULL,
	CONSTRAINT `rfiScheduleLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `aiExtractions` MODIFY COLUMN `status` enum('unverified','pending','accepted','rejected') DEFAULT 'unverified';--> statement-breakpoint
ALTER TABLE `alerts` MODIFY COLUMN `type` enum('document','rfi','schedule','checklist','approval','system') DEFAULT 'system';--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `status` enum('verified','pending','missing','na','rejected','unverified') DEFAULT 'unverified';--> statement-breakpoint
ALTER TABLE `aiExtractions` ADD `sourcePage` int;--> statement-breakpoint
ALTER TABLE `aiExtractions` ADD `sourceTextSnippet` text;--> statement-breakpoint
ALTER TABLE `aiExtractions` ADD `extractedAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `alerts` ADD `userId` int;--> statement-breakpoint
ALTER TABLE `alerts` ADD `linkType` varchar(50);--> statement-breakpoint
ALTER TABLE `alerts` ADD `linkId` int;--> statement-breakpoint
ALTER TABLE `assetDetails` ADD `sourcePage` int;--> statement-breakpoint
ALTER TABLE `assetDetails` ADD `sourceTextSnippet` text;--> statement-breakpoint
ALTER TABLE `assetDetails` ADD `extractedAt` timestamp;--> statement-breakpoint
ALTER TABLE `documents` ADD `isInternalOnly` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `portfolios` ADD `organizationId` int;--> statement-breakpoint
ALTER TABLE `projects` ADD `organizationId` int;--> statement-breakpoint
ALTER TABLE `rfiComments` ADD `isInternalOnly` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `rfis` ADD `itemType` enum('rfi','task','risk','issue') DEFAULT 'rfi';--> statement-breakpoint
ALTER TABLE `rfis` ADD `isInternalOnly` boolean DEFAULT false;