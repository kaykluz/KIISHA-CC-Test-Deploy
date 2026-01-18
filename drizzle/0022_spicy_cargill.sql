CREATE TABLE `attachmentLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ingestedFileId` int,
	`artifactId` int,
	`linkType` enum('primary','secondary') NOT NULL,
	`projectId` int,
	`siteId` int,
	`assetId` int,
	`dataroomId` int,
	`dataroomItemId` int,
	`checklistItemId` int,
	`viewScopeId` int,
	`linkedBy` enum('ai_suggestion','user_confirmed','admin_assigned','auto_rule') NOT NULL,
	`aiConfidence` decimal(5,4),
	`linkedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attachmentLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversationSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`channel` enum('whatsapp','email','web_chat') NOT NULL,
	`channelIdentifier` varchar(320),
	`lastReferencedProjectId` int,
	`lastReferencedSiteId` int,
	`lastReferencedAssetId` int,
	`lastReferencedDocumentId` int,
	`activeDataroomId` int,
	`activeViewScopeId` int,
	`pendingAction` enum('none','confirm_export','confirm_share_dataroom','confirm_delete','confirm_verify','confirm_permission_change') DEFAULT 'none',
	`pendingActionPayload` json,
	`pendingActionExpiresAt` timestamp,
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`messageCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversationSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unclaimedInbound` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channel` enum('whatsapp','email','sms','api') NOT NULL,
	`senderIdentifier` varchar(320) NOT NULL,
	`senderDisplayName` varchar(255),
	`messageType` enum('text','image','document','audio','video','location','contact') DEFAULT 'text',
	`textContent` text,
	`mediaStorageKey` varchar(500),
	`mediaContentType` varchar(100),
	`mediaFilename` varchar(255),
	`rawPayload` json,
	`status` enum('pending','claimed','rejected','expired') NOT NULL DEFAULT 'pending',
	`claimedByUserId` int,
	`claimedAt` timestamp,
	`claimedByAdminId` int,
	`rejectedReason` text,
	`guessedOrganizationId` int,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `unclaimedInbound_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userIdentifiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('whatsapp_phone','email','phone','slack_id') NOT NULL,
	`value` varchar(320) NOT NULL,
	`userId` int NOT NULL,
	`organizationId` int,
	`status` enum('pending','verified','revoked') NOT NULL DEFAULT 'pending',
	`verifiedAt` timestamp,
	`verifiedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`revokedAt` timestamp,
	`revokedBy` int,
	`revokedReason` text,
	CONSTRAINT `userIdentifiers_id` PRIMARY KEY(`id`)
);
