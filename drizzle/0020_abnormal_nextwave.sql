CREATE TABLE `portfolioViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`portfolioId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`filterCriteria` json,
	`viewType` enum('dynamic','static') NOT NULL DEFAULT 'dynamic',
	`isPublic` boolean DEFAULT false,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioViews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `viewAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`viewId` int NOT NULL,
	`projectId` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	`addedById` int,
	CONSTRAINT `viewAssets_id` PRIMARY KEY(`id`)
);
