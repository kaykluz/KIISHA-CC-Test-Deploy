CREATE TABLE `assetImportJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileType` enum('csv','xlsx','xls') NOT NULL,
	`fileSize` int,
	`targetAssetClass` varchar(100),
	`columnMapping` json,
	`importJobStatus` enum('pending','validating','validated','validation_failed','importing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`totalRows` int,
	`processedRows` int DEFAULT 0,
	`successRows` int DEFAULT 0,
	`errorRows` int DEFAULT 0,
	`validationErrors` json,
	`importedAssetIds` json,
	`importErrors` json,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int NOT NULL,
	CONSTRAINT `assetImportJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assetImportTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`targetAssetClass` varchar(100) NOT NULL,
	`columnMapping` json NOT NULL,
	`expectedColumns` json,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assetImportTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`emailTemplateType` enum('request_issued','request_reminder','request_submitted','request_clarification','request_completed','request_overdue','password_reset','welcome','invitation','custom') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`subject` varchar(500) NOT NULL,
	`bodyHtml` text NOT NULL,
	`bodyText` text,
	`headerLogoUrl` varchar(500),
	`footerText` text,
	`primaryColor` varchar(7),
	`availableVariables` json,
	`isActive` boolean DEFAULT true,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailTemplates_org_type_default` UNIQUE(`organizationId`,`emailTemplateType`,`isDefault`)
);
--> statement-breakpoint
CREATE TABLE `reminderSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`remindersEnabled` boolean DEFAULT true,
	`firstReminderDays` int DEFAULT 3,
	`secondReminderDays` int DEFAULT 1,
	`overdueReminderEnabled` boolean DEFAULT true,
	`customReminderDays` json,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `reminderSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `reminderSettings_organizationId_unique` UNIQUE(`organizationId`)
);
--> statement-breakpoint
CREATE TABLE `requestReminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`requestId` int NOT NULL,
	`recipientUserId` int NOT NULL,
	`reminderType` enum('3_days','1_day','overdue','custom') NOT NULL,
	`scheduledFor` timestamp NOT NULL,
	`reminderStatus` enum('pending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`failedAt` timestamp,
	`failureReason` text,
	`emailTemplateId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `requestReminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `assetImportJobs_organizationId_idx` ON `assetImportJobs` (`organizationId`);--> statement-breakpoint
CREATE INDEX `assetImportJobs_status_idx` ON `assetImportJobs` (`importJobStatus`);--> statement-breakpoint
CREATE INDEX `assetImportJobs_createdAt_idx` ON `assetImportJobs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `assetImportTemplates_organizationId_idx` ON `assetImportTemplates` (`organizationId`);--> statement-breakpoint
CREATE INDEX `emailTemplates_organizationId_idx` ON `emailTemplates` (`organizationId`);--> statement-breakpoint
CREATE INDEX `emailTemplates_templateType_idx` ON `emailTemplates` (`emailTemplateType`);--> statement-breakpoint
CREATE INDEX `requestReminders_organizationId_idx` ON `requestReminders` (`organizationId`);--> statement-breakpoint
CREATE INDEX `requestReminders_requestId_idx` ON `requestReminders` (`requestId`);--> statement-breakpoint
CREATE INDEX `requestReminders_scheduledFor_idx` ON `requestReminders` (`scheduledFor`);--> statement-breakpoint
CREATE INDEX `requestReminders_status_idx` ON `requestReminders` (`reminderStatus`);