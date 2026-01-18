CREATE TABLE `realtimeEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`projectId` int,
	`eventType` enum('document_uploaded','document_verified','document_rejected','rfi_created','rfi_updated','rfi_resolved','alert_triggered','alert_acknowledged','alert_resolved','checklist_item_completed','checklist_completed','user_joined','user_left') NOT NULL,
	`payload` json,
	`actorId` int,
	`targetId` int,
	`targetType` varchar(50),
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `realtimeEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `searchHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`query` varchar(500) NOT NULL,
	`resultType` enum('document','project','workspace_item','all') DEFAULT 'all',
	`resultCount` int DEFAULT 0,
	`selectedResultId` int,
	`selectedResultType` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `searchHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamInvitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('admin','editor','reviewer','investor_viewer') NOT NULL DEFAULT 'editor',
	`invitedById` int NOT NULL,
	`status` enum('pending','accepted','expired','cancelled') NOT NULL DEFAULT 'pending',
	`token` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teamInvitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `teamInvitations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `userActivityLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(50),
	`resourceId` int,
	`resourceName` varchar(255),
	`metadata` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userActivityLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingStatus` enum('not_started','in_progress','completed','skipped') DEFAULT 'not_started';--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingStep` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `notificationPreferences` json;