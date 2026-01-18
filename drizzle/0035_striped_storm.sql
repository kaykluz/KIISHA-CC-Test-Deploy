CREATE TABLE `userWorkspacePreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`defaultOrgId` int,
	`primaryOrgId` int,
	`webLastActiveOrgId` int,
	`whatsappDefaultOrgId` int,
	`emailDefaultOrgId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userWorkspacePreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `userWorkspacePreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `workspaceBindingCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`userId` int NOT NULL,
	`organizationId` int NOT NULL,
	`channel` enum('whatsapp','email'),
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`usedFromChannel` enum('whatsapp','email'),
	`usedFromIdentifier` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspaceBindingCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaceBindingCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `workspaceSwitchAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fromOrganizationId` int,
	`toOrganizationId` int NOT NULL,
	`channel` enum('web','whatsapp','email','api') NOT NULL,
	`switchMethod` enum('login_auto','login_selection','switcher','binding_code','channel_default','session_restore') NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`switchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspaceSwitchAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `conversationSessions` ADD `organizationId` int;--> statement-breakpoint
ALTER TABLE `conversationSessions` ADD `channelThreadId` varchar(100);