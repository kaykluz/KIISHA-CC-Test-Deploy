CREATE TABLE `apiKeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`name` varchar(255) NOT NULL,
	`keyHash` varchar(255) NOT NULL,
	`keyPrefix` varchar(8),
	`scopes` json,
	`rateLimitPerHour` int DEFAULT 1000,
	`lastUsedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdById` int,
	`revokedAt` timestamp,
	CONSTRAINT `apiKeys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apiRequestLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiKeyId` int,
	`endpoint` varchar(500),
	`method` varchar(10),
	`statusCode` int,
	`requestTimestamp` timestamp NOT NULL DEFAULT (now()),
	`responseTimeMs` int,
	`ipAddress` varchar(45),
	CONSTRAINT `apiRequestLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`complianceItemId` int NOT NULL,
	`alertType` enum('expiring_soon','expired','missing_document','renewal_due') NOT NULL,
	`triggeredAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('open','acknowledged','resolved') DEFAULT 'open',
	`acknowledgedById` int,
	`acknowledgedAt` timestamp,
	`resolutionNote` text,
	CONSTRAINT `complianceAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`projectId` int,
	`vatrAssetId` int,
	`itemType` enum('permit','contract','obligation','deadline','license','insurance') NOT NULL,
	`itemName` varchar(500) NOT NULL,
	`sourceDocumentId` int,
	`dueDate` date,
	`renewalDate` date,
	`alertDaysBefore` int DEFAULT 30,
	`status` enum('active','expiring_soon','expired','renewed','na') DEFAULT 'active',
	`responsiblePartyId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complianceItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crossReferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`projectId` int,
	`referenceType` enum('assumption_vs_actual','duplicate_value','covenant_check','discrepancy') NOT NULL,
	`sourceAFileId` int,
	`sourceAField` varchar(255),
	`sourceAValue` text,
	`sourceBFileId` int,
	`sourceBField` varchar(255),
	`sourceBValue` text,
	`discrepancyDetected` boolean DEFAULT false,
	`discrepancyNote` text,
	`status` enum('pending_review','reviewed','resolved','ignored') DEFAULT 'pending_review',
	`reviewedById` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crossReferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataRoomAccessLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dataRoomId` int NOT NULL,
	`accessorEmail` varchar(320),
	`accessorIp` varchar(45),
	`accessedAt` timestamp NOT NULL DEFAULT (now()),
	`documentsViewed` json,
	`downloadCount` int DEFAULT 0,
	CONSTRAINT `dataRoomAccessLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataRoomItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dataRoomId` int NOT NULL,
	`category` enum('corporate','technical','financial','legal','commercial','operational') DEFAULT 'technical',
	`documentId` int,
	`vatrAssetId` int,
	`itemName` varchar(500),
	`sortOrder` int DEFAULT 0,
	`verificationStatus` enum('verified','pending','unverified') DEFAULT 'unverified',
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataRoomItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataRooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`projectId` int,
	`name` varchar(500) NOT NULL,
	`description` text,
	`accessType` enum('private','link_only','public') DEFAULT 'private',
	`accessToken` varchar(64),
	`passwordHash` varchar(255),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdById` int,
	CONSTRAINT `dataRooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `dataRooms_accessToken_unique` UNIQUE(`accessToken`)
);
--> statement-breakpoint
CREATE TABLE `emailConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`projectId` int,
	`inboundAddress` varchar(320),
	`forwardFromAddresses` json,
	`defaultSiteId` int,
	`autoCategorize` boolean DEFAULT true,
	`active` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailConfigs_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailConfigs_inboundAddress_unique` UNIQUE(`inboundAddress`)
);
--> statement-breakpoint
CREATE TABLE `entities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`entityType` enum('site','company','person','equipment','contract','permit') NOT NULL,
	`canonicalName` varchar(500) NOT NULL,
	`attributes` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `entities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entityAliases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityId` int NOT NULL,
	`alias` varchar(500) NOT NULL,
	`aliasType` enum('abbreviation','nickname','alternate_spelling','typo','translation') DEFAULT 'abbreviation',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entityAliases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entityMentions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityId` int,
	`fileId` int NOT NULL,
	`mentionText` varchar(500) NOT NULL,
	`mentionType` enum('name','alias','reference','abbreviation') DEFAULT 'name',
	`sourcePage` int,
	`sourceLocation` varchar(255),
	`contextSnippet` text,
	`confidenceScore` decimal(3,2),
	`resolutionStatus` enum('unresolved','auto_resolved','human_verified') DEFAULT 'unresolved',
	`resolvedById` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entityMentions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `extractedContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileId` int NOT NULL,
	`contentType` enum('full_text','page_text','cell_data','transcription','ocr','table_data') NOT NULL,
	`pageNumber` int,
	`sheetName` varchar(255),
	`content` text,
	`structuredData` json,
	`confidenceScore` decimal(3,2),
	`extractionMethod` enum('native','ocr','transcription','llm','parser') DEFAULT 'native',
	`extractedAt` timestamp NOT NULL DEFAULT (now()),
	`rawExtractionOutput` json,
	CONSTRAINT `extractedContent_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generatedReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`projectId` int,
	`reportType` enum('investor_summary','monthly_performance','due_diligence','compliance','custom') NOT NULL,
	`reportName` varchar(500) NOT NULL,
	`templateId` int,
	`parameters` json,
	`status` enum('generating','completed','failed') DEFAULT 'generating',
	`fileUrl` text,
	`generatedAt` timestamp,
	`generatedById` int,
	`vatrAssetsIncluded` json,
	`dataSnapshotHash` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generatedReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingestedFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`projectId` int,
	`siteId` int,
	`originalFilename` varchar(500) NOT NULL,
	`fileType` enum('pdf','docx','xlsx','image','audio','video','email','whatsapp','other') NOT NULL,
	`fileSizeBytes` int,
	`mimeType` varchar(100),
	`storageUrl` text NOT NULL,
	`storageKey` varchar(500),
	`sourceChannel` enum('upload','email','whatsapp','api') NOT NULL DEFAULT 'upload',
	`sourceMetadata` json,
	`ingestedAt` timestamp NOT NULL DEFAULT (now()),
	`ingestedById` int,
	`processingStatus` enum('pending','processing','completed','failed') DEFAULT 'pending',
	`processingError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingestedFiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vatrAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`projectId` int,
	`siteId` int,
	`vatrVersion` int DEFAULT 1,
	`assetName` varchar(500) NOT NULL,
	`assetType` enum('solar_pv','bess','genset','minigrid','hybrid','wind','hydro') DEFAULT 'solar_pv',
	`ownerEntityId` int,
	`locationLat` decimal(10,6),
	`locationLng` decimal(10,6),
	`locationAddress` text,
	`capacityKw` decimal(12,2),
	`technology` varchar(255),
	`installer` varchar(255),
	`commissioningDate` date,
	`equipmentSpecs` json,
	`sldDocumentId` int,
	`performanceBaseline` json,
	`degradationCurve` json,
	`currentAvailabilityPct` decimal(5,2),
	`lastMaintenanceDate` date,
	`operationalStatus` enum('operational','maintenance','offline','decommissioned') DEFAULT 'operational',
	`tariffStructure` json,
	`currency` varchar(3) DEFAULT 'USD',
	`complianceStatus` enum('compliant','at_risk','non_compliant','pending_review') DEFAULT 'pending_review',
	`nextAuditDate` date,
	`offtakeType` enum('ppa','lease','esco','retail','wholesale') DEFAULT 'ppa',
	`contractEndDate` date,
	`counterpartyEntityId` int,
	`contentHash` varchar(64),
	`previousVersionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdById` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vatrAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vatrAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vatrAssetId` int NOT NULL,
	`action` enum('created','updated','viewed','exported','verified') NOT NULL,
	`actorId` int NOT NULL,
	`actorRole` varchar(100),
	`actionTimestamp` timestamp NOT NULL DEFAULT (now()),
	`beforeHash` varchar(64),
	`afterHash` varchar(64),
	`changesJson` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	CONSTRAINT `vatrAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vatrSourceDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vatrAssetId` int NOT NULL,
	`documentId` int NOT NULL,
	`cluster` enum('identity','technical','operational','financial','compliance','commercial') NOT NULL,
	`fieldName` varchar(255),
	`extractedValue` text,
	`sourcePage` int,
	`sourceSnippet` text,
	`linkCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vatrSourceDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vatrVerifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vatrAssetId` int NOT NULL,
	`verificationType` enum('hash_check','human_review','third_party_audit') NOT NULL,
	`verifiedById` int,
	`verifiedAt` timestamp NOT NULL DEFAULT (now()),
	`verificationResult` enum('passed','failed','pending') DEFAULT 'pending',
	`notes` text,
	`certificateUrl` text,
	CONSTRAINT `vatrVerifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsappConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`projectId` int,
	`phoneNumber` varchar(20),
	`webhookSecret` varchar(255),
	`defaultSiteId` int,
	`autoCategorize` boolean DEFAULT true,
	`active` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsappConfigs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsappMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`projectId` int,
	`siteId` int,
	`waMessageId` varchar(100),
	`senderPhone` varchar(20),
	`senderName` varchar(255),
	`messageType` enum('text','image','audio','video','document') DEFAULT 'text',
	`messageContent` text,
	`mediaUrl` text,
	`ingestedFileId` int,
	`receivedAt` timestamp,
	`processedAt` timestamp,
	`processingStatus` enum('pending','processing','completed','failed') DEFAULT 'pending',
	`linkedWorkspaceItemId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsappMessages_id` PRIMARY KEY(`id`),
	CONSTRAINT `whatsappMessages_waMessageId_unique` UNIQUE(`waMessageId`)
);
