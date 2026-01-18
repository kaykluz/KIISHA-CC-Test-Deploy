CREATE TABLE `aiExtractions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`subcategory` varchar(100),
	`fieldName` varchar(255) NOT NULL,
	`extractedValue` text,
	`confidence` decimal(3,2),
	`boundingBox` json,
	`status` enum('pending','accepted','rejected') DEFAULT 'pending',
	`reviewedById` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiExtractions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int,
	`type` enum('document','rfi','schedule','system') DEFAULT 'system',
	`severity` enum('info','warning','critical') DEFAULT 'info',
	`title` varchar(255) NOT NULL,
	`message` text,
	`isRead` boolean DEFAULT false,
	`isDismissed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assetDetails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`subcategory` varchar(100),
	`fieldName` varchar(255) NOT NULL,
	`fieldValue` text,
	`unit` varchar(50),
	`isAiExtracted` boolean DEFAULT false,
	`aiConfidence` decimal(3,2),
	`sourceDocumentId` int,
	`isVerified` boolean DEFAULT false,
	`verifiedById` int,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assetDetails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diligenceProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`category` enum('technical','commercial','legal') NOT NULL,
	`totalItems` int DEFAULT 0,
	`completedItems` int DEFAULT 0,
	`verifiedItems` int DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `diligenceProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(50) NOT NULL,
	`sortOrder` int DEFAULT 0,
	CONSTRAINT `documentCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`required` boolean DEFAULT false,
	`sortOrder` int DEFAULT 0,
	CONSTRAINT `documentTypes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`version` int NOT NULL,
	`fileUrl` text,
	`fileKey` varchar(500),
	`uploadedById` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`documentTypeId` int NOT NULL,
	`name` varchar(500) NOT NULL,
	`fileUrl` text,
	`fileKey` varchar(500),
	`mimeType` varchar(100),
	`fileSize` int,
	`status` enum('verified','pending','missing','na','rejected') DEFAULT 'pending',
	`version` int DEFAULT 1,
	`uploadedById` int,
	`notes` text,
	`tags` json,
	`aiCategorySuggestion` varchar(255),
	`aiCategoryConfidence` decimal(3,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`region` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolioId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(50),
	`state` varchar(100),
	`technology` enum('PV','BESS','PV+BESS','Wind','Minigrid','C&I') DEFAULT 'PV',
	`capacityMw` decimal(10,2),
	`capacityMwh` decimal(10,2),
	`status` enum('prospecting','development','construction','operational','decommissioned') DEFAULT 'development',
	`stage` enum('feasibility','development','ntp','construction','cod') DEFAULT 'feasibility',
	`latitude` decimal(10,6),
	`longitude` decimal(10,6),
	`address` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfiComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfiId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rfiComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfiDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfiId` int NOT NULL,
	`documentId` int NOT NULL,
	CONSTRAINT `rfiDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`code` varchar(50),
	`title` varchar(500) NOT NULL,
	`description` text,
	`notes` text,
	`category` varchar(100),
	`tags` json,
	`priority` enum('low','medium','high','critical') DEFAULT 'medium',
	`status` enum('open','in_progress','resolved','closed') DEFAULT 'open',
	`assigneeId` int,
	`submittedById` int,
	`dueDate` date,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rfis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduleItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`phaseId` int NOT NULL,
	`name` varchar(500) NOT NULL,
	`description` text,
	`startDate` date,
	`endDate` date,
	`targetEndDate` date,
	`duration` int,
	`progress` int DEFAULT 0,
	`status` enum('not_started','in_progress','completed','overdue','blocked') DEFAULT 'not_started',
	`dependencies` json,
	`assigneeId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduleItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedulePhases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(50) NOT NULL,
	`sortOrder` int DEFAULT 0,
	CONSTRAINT `schedulePhases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('operations_manager','field_coordinator','portfolio_manager','investor','technical_advisor') DEFAULT 'operations_manager';--> statement-breakpoint
ALTER TABLE `users` ADD `organization` varchar(255);