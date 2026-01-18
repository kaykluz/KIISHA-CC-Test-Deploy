CREATE TABLE `authAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` enum('login_success','login_failed','logout','mfa_setup','mfa_verified','mfa_failed','mfa_reset','session_created','session_revoked','session_expired','workspace_selected','workspace_switched','password_changed','password_reset_requested','password_reset_completed','account_locked','account_unlocked','identifier_added','identifier_revoked') NOT NULL,
	`userId` int,
	`sessionId` varchar(64),
	`organizationId` int,
	`targetUserId` int,
	`ipHash` varchar(64),
	`userAgentHash` varchar(64),
	`details` json,
	`success` boolean NOT NULL,
	`failureReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `authAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loginAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`identifierHash` varchar(64) NOT NULL,
	`ipHash` varchar(64) NOT NULL,
	`attemptedAt` timestamp NOT NULL DEFAULT (now()),
	`success` boolean NOT NULL,
	`failureCount` int DEFAULT 0,
	`lockedUntil` timestamp,
	CONSTRAINT `loginAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `serverSessions` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`revokedReason` varchar(255),
	`revokedBy` int,
	`ipHash` varchar(64),
	`userAgentHash` varchar(64),
	`mfaSatisfiedAt` timestamp,
	`refreshTokenHash` varchar(64),
	`csrfSecret` varchar(64),
	`activeOrganizationId` int,
	`deviceType` varchar(50),
	`browserName` varchar(50),
	`osName` varchar(50),
	CONSTRAINT `serverSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userLastContext` (
	`userId` int NOT NULL,
	`lastOrganizationId` int,
	`lastViewId` int,
	`lastProjectId` int,
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userLastContext_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `userMfaConfig` (
	`userId` int NOT NULL,
	`totpSecret` varchar(255),
	`totpEnabled` boolean NOT NULL DEFAULT false,
	`totpVerifiedAt` timestamp,
	`backupCodesHash` json,
	`backupCodesGeneratedAt` timestamp,
	`backupCodesUsedCount` int DEFAULT 0,
	`recoveryEmail` varchar(255),
	`recoveryEmailVerified` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userMfaConfig_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE INDEX `authAuditLog_userId_idx` ON `authAuditLog` (`userId`);--> statement-breakpoint
CREATE INDEX `authAuditLog_eventType_idx` ON `authAuditLog` (`eventType`);--> statement-breakpoint
CREATE INDEX `authAuditLog_createdAt_idx` ON `authAuditLog` (`createdAt`);--> statement-breakpoint
CREATE INDEX `authAuditLog_organizationId_idx` ON `authAuditLog` (`organizationId`);--> statement-breakpoint
CREATE INDEX `loginAttempts_identifierHash_idx` ON `loginAttempts` (`identifierHash`);--> statement-breakpoint
CREATE INDEX `loginAttempts_ipHash_idx` ON `loginAttempts` (`ipHash`);--> statement-breakpoint
CREATE INDEX `loginAttempts_attemptedAt_idx` ON `loginAttempts` (`attemptedAt`);--> statement-breakpoint
CREATE INDEX `serverSessions_userId_idx` ON `serverSessions` (`userId`);--> statement-breakpoint
CREATE INDEX `serverSessions_expiresAt_idx` ON `serverSessions` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `serverSessions_activeOrganizationId_idx` ON `serverSessions` (`activeOrganizationId`);