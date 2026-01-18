ALTER TABLE `departmentMembers` ADD `isPrimary` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `departmentMembers` ADD `priority` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `departmentMembers` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `teamMembers` ADD `isPrimary` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `teamMembers` ADD `priority` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `teamMembers` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;