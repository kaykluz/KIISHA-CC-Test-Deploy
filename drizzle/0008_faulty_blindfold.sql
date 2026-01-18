ALTER TABLE `comments` ADD `isResolved` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `comments` ADD `resolvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `comments` ADD `resolvedById` int;