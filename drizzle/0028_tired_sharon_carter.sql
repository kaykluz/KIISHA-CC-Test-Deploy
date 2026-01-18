CREATE TABLE `userViewPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scopeType` enum('user','team','department','organization') NOT NULL,
	`scopeId` int NOT NULL,
	`context` enum('dashboard','portfolio','dataroom','checklist','report') NOT NULL,
	`defaultViewId` int NOT NULL,
	`setBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userViewPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `scope_context_unique` UNIQUE(`scopeType`,`scopeId`,`context`)
);
