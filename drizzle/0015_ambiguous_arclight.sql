ALTER TABLE `comments` ADD `isDeleted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `comments` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `comments` ADD `deletedBy` int;