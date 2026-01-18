CREATE TABLE `accessRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userEmail` varchar(320) NOT NULL,
	`targetOrganizationId` int,
	`targetOrganizationName` varchar(255),
	`requestReason` text,
	`requestedRole` enum('admin','editor','reviewer','investor_viewer') DEFAULT 'editor',
	`status` enum('pending','approved','rejected','expired') NOT NULL DEFAULT 'pending',
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`resolutionNotes` text,
	`resultingMembershipId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `accessRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crossOrgShareAccessLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tokenId` int NOT NULL,
	`userId` int,
	`organizationId` int,
	`accessType` enum('view','download','export') NOT NULL,
	`resourceType` varchar(50),
	`resourceId` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`accessedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crossOrgShareAccessLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crossOrgShareTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`sourceOrganizationId` int NOT NULL,
	`createdBy` int NOT NULL,
	`shareType` enum('view','assets','documents','dataroom') NOT NULL,
	`scopeConfig` json NOT NULL,
	`recipientOrganizationId` int,
	`recipientEmail` varchar(320),
	`maxUses` int,
	`usedCount` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`status` enum('active','expired','revoked') NOT NULL DEFAULT 'active',
	`revokedAt` timestamp,
	`revokedBy` int,
	`revokedReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crossOrgShareTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `crossOrgShareTokens_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `inviteTokenRedemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tokenId` int NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`redeemedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inviteTokenRedemptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inviteTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`organizationId` int NOT NULL,
	`role` enum('admin','editor','reviewer','investor_viewer') NOT NULL DEFAULT 'editor',
	`teamIds` json,
	`projectIds` json,
	`defaultViewId` int,
	`maxUses` int NOT NULL DEFAULT 1,
	`usedCount` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`restrictToEmail` varchar(320),
	`restrictToDomain` varchar(255),
	`require2FA` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	`revokedBy` int,
	`revokedReason` text,
	CONSTRAINT `inviteTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `inviteTokens_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `kiishaLobbyConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lobbyOrganizationId` int NOT NULL,
	`welcomeMessage` text,
	`allowRequestAccess` boolean NOT NULL DEFAULT true,
	`allowViewDemo` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kiishaLobbyConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `kiishaLobbyConfig_lobbyOrganizationId_unique` UNIQUE(`lobbyOrganizationId`)
);
--> statement-breakpoint
CREATE TABLE `securityAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` enum('login_success','login_failed','logout','session_expired','2fa_enrolled','2fa_verified','2fa_failed','signup_started','email_verified','signup_completed','invite_redeemed','whatsapp_binding_requested','whatsapp_binding_verified','whatsapp_binding_failed','email_change_requested','email_change_completed','identifier_revoked','org_access_granted','org_access_revoked','role_changed','cross_org_access_attempted','cross_org_access_denied','elevation_requested','elevation_granted','elevation_expired','cross_tenant_read','cross_tenant_write','share_token_created','share_token_revoked','share_token_accessed','sensitive_data_accessed','export_requested','export_completed') NOT NULL,
	`userId` int,
	`userEmail` varchar(320),
	`organizationId` int,
	`targetUserId` int,
	`targetOrganizationId` int,
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`sessionId` varchar(64),
	`elevationId` int,
	`elevationReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `securityAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `superuserElevations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetOrganizationId` int,
	`scope` enum('global','organization') NOT NULL DEFAULT 'organization',
	`canRead` boolean NOT NULL DEFAULT true,
	`canWrite` boolean NOT NULL DEFAULT false,
	`canExport` boolean NOT NULL DEFAULT false,
	`canViewSecrets` boolean NOT NULL DEFAULT false,
	`reason` text NOT NULL,
	`approvedBy` int,
	`customerApproval` boolean DEFAULT false,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`endedAt` timestamp,
	`status` enum('active','expired','terminated') NOT NULL DEFAULT 'active',
	CONSTRAINT `superuserElevations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`activeOrganizationId` int,
	`deviceFingerprint` varchar(64),
	`userAgent` text,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`status` enum('active','expired','revoked') NOT NULL DEFAULT 'active',
	`revokedAt` timestamp,
	`revokedReason` text,
	CONSTRAINT `userSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `whatsappBindingTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`userId` int NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`status` enum('pending','verified','expired','failed') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`maxAttempts` int NOT NULL DEFAULT 3,
	`expiresAt` timestamp NOT NULL,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsappBindingTokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `organizationMembers` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `organizationMembers` ADD `preApprovedEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `organizationMembers` ADD `preApprovedPhone` varchar(20);--> statement-breakpoint
ALTER TABLE `organizationMembers` ADD `status` enum('pending','active','suspended','removed') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizationMembers` ADD `invitedBy` int;--> statement-breakpoint
ALTER TABLE `organizationMembers` ADD `invitedAt` timestamp;--> statement-breakpoint
ALTER TABLE `organizationMembers` ADD `acceptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `organizations` ADD `slug` varchar(50);--> statement-breakpoint
ALTER TABLE `organizations` ADD `logoUrl` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `primaryColor` varchar(7);--> statement-breakpoint
ALTER TABLE `organizations` ADD `require2FA` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `allowedEmailDomains` json;--> statement-breakpoint
ALTER TABLE `organizations` ADD `signupMode` enum('invite_only','domain_allowlist','open') DEFAULT 'invite_only' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `status` enum('active','suspended','archived') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `activeOrgId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationToken` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationExpires` timestamp;--> statement-breakpoint
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`);