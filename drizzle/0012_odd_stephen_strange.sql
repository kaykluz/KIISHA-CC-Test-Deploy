CREATE TABLE `integrationEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`integrationId` int NOT NULL,
	`eventType` enum('connected','disconnected','config_changed','test_success','test_failed','webhook_received','token_refreshed','error','secret_rotated') NOT NULL,
	`eventData` json,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integrationEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrationSecrets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`integrationId` int NOT NULL,
	`secretKey` varchar(100) NOT NULL,
	`encryptedValue` text NOT NULL,
	`iv` varchar(32) NOT NULL,
	`authTag` varchar(32) NOT NULL,
	`keyVersion` int NOT NULL DEFAULT 1,
	`lastRotatedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrationSecrets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orgFeatureFlags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`flagKey` varchar(100) NOT NULL,
	`enabled` boolean NOT NULL,
	`projectId` int,
	`enabledBy` int,
	`enabledAt` timestamp,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orgFeatureFlags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orgIntegrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`integrationType` enum('storage','llm','email_ingest','whatsapp','notify','observability','maps') NOT NULL,
	`provider` varchar(50) NOT NULL,
	`status` enum('not_configured','connected','error','disabled') NOT NULL DEFAULT 'not_configured',
	`config` json,
	`secretRef` varchar(255),
	`connectedBy` int,
	`connectedAt` timestamp,
	`lastTestAt` timestamp,
	`lastTestSuccess` boolean,
	`lastError` text,
	`webhookUrl` text,
	`webhookSecret` varchar(255),
	`verifyToken` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orgIntegrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhookEventsLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`integrationId` int NOT NULL,
	`method` varchar(10) NOT NULL,
	`path` text NOT NULL,
	`headers` json,
	`body` text,
	`signatureValid` boolean,
	`processed` boolean DEFAULT false,
	`processedAt` timestamp,
	`errorMessage` text,
	`idempotencyKey` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhookEventsLog_id` PRIMARY KEY(`id`)
);
