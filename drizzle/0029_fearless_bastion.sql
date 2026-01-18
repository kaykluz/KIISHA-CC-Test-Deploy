CREATE TABLE `departmentMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`departmentId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('member','lead','superuser') NOT NULL DEFAULT 'member',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `departmentMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `dept_user_unique` UNIQUE(`departmentId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`headId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizationSuperusers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`grantedBy` int NOT NULL,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organizationSuperusers_id` PRIMARY KEY(`id`),
	CONSTRAINT `org_superuser_unique` UNIQUE(`organizationId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `teamMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('member','lead','superuser') NOT NULL DEFAULT 'member',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teamMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_user_unique` UNIQUE(`teamId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`departmentId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`managerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `viewAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`viewId` int NOT NULL,
	`userId` int NOT NULL,
	`accessedAt` timestamp NOT NULL DEFAULT (now()),
	`durationSeconds` int,
	`actionType` enum('view','filter_change','export','share','edit','apply_template') NOT NULL DEFAULT 'view',
	`actionDetails` json,
	`sessionId` varchar(64),
	`userAgent` text,
	CONSTRAINT `viewAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `viewHides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`viewId` int NOT NULL,
	`hiddenBy` int NOT NULL,
	`hiddenByRole` enum('user','team_superuser','department_superuser','organization_superuser','admin') NOT NULL,
	`targetScope` enum('user','team','department','organization') NOT NULL,
	`targetScopeId` int NOT NULL,
	`reason` text,
	`hiddenAt` timestamp NOT NULL DEFAULT (now()),
	`unhiddenBy` int,
	`unhiddenAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `viewHides_id` PRIMARY KEY(`id`),
	CONSTRAINT `view_hide_unique` UNIQUE(`viewId`,`targetScope`,`targetScopeId`)
);
--> statement-breakpoint
CREATE TABLE `viewManagementAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionType` enum('share','unshare','push','unpush','hide','unhide','delete','permission_change') NOT NULL,
	`actorId` int NOT NULL,
	`actorRole` varchar(50) NOT NULL,
	`viewId` int NOT NULL,
	`targetType` varchar(50),
	`targetId` int,
	`previousState` json,
	`newState` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	`userAgent` text,
	CONSTRAINT `viewManagementAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `viewPushes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`viewId` int NOT NULL,
	`pushedBy` int NOT NULL,
	`pushedByRole` enum('manager','team_superuser','department_superuser','organization_superuser','admin') NOT NULL,
	`targetScope` enum('user','team','department','organization') NOT NULL,
	`targetScopeId` int NOT NULL,
	`isPinned` boolean NOT NULL DEFAULT false,
	`isRequired` boolean NOT NULL DEFAULT false,
	`displayOrder` int DEFAULT 0,
	`pushMessage` text,
	`pushedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`deactivatedBy` int,
	`deactivatedAt` timestamp,
	CONSTRAINT `viewPushes_id` PRIMARY KEY(`id`),
	CONSTRAINT `view_push_unique` UNIQUE(`viewId`,`targetScope`,`targetScopeId`)
);
--> statement-breakpoint
CREATE TABLE `viewShares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`viewId` int NOT NULL,
	`sharedWithType` enum('user','team','department','organization') NOT NULL,
	`sharedWithId` int NOT NULL,
	`permissionLevel` enum('view_only','edit','admin') NOT NULL DEFAULT 'view_only',
	`sharedBy` int NOT NULL,
	`sharedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`revokedBy` int,
	`revokedAt` timestamp,
	CONSTRAINT `viewShares_id` PRIMARY KEY(`id`),
	CONSTRAINT `view_share_unique` UNIQUE(`viewId`,`sharedWithType`,`sharedWithId`)
);
--> statement-breakpoint
CREATE TABLE `viewTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('due_diligence','investor_reporting','compliance','operations','financial','custom') NOT NULL,
	`filterCriteria` json,
	`defaultColumns` json,
	`sortOrder` varchar(100),
	`isSystem` boolean NOT NULL DEFAULT false,
	`organizationId` int,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `viewTemplates_id` PRIMARY KEY(`id`)
);
