CREATE TABLE `alertEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertRuleId` int NOT NULL,
	`siteId` int,
	`deviceId` int,
	`triggeredAt` timestamp NOT NULL,
	`triggerValue` decimal(18,6),
	`status` enum('open','acknowledged','resolved','suppressed') DEFAULT 'open',
	`acknowledgedById` int,
	`acknowledgedAt` timestamp,
	`resolvedAt` timestamp,
	`resolutionNote` text,
	`notificationsSent` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alertEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alertRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`siteId` int,
	`deviceId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`metricId` int,
	`condition` enum('gt','gte','lt','lte','eq','neq','offline','change_rate') NOT NULL,
	`threshold` decimal(18,6),
	`thresholdUnit` varchar(50),
	`evaluationWindowMinutes` int DEFAULT 5,
	`severity` enum('critical','high','medium','low','info') DEFAULT 'medium',
	`notificationChannels` json,
	`enabled` boolean DEFAULT true,
	`cooldownMinutes` int DEFAULT 60,
	`lastTriggeredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `connectorCredentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`connectorId` int NOT NULL,
	`credentialType` varchar(50) NOT NULL,
	`credentialValueEncrypted` text NOT NULL,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `connectorCredentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `connectors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`name` varchar(255) NOT NULL,
	`connectorType` enum('ammp','victron','solaredge','sma','huawei','fronius','enphase','demo','custom_api','csv_import') NOT NULL,
	`status` enum('active','inactive','error','configuring') DEFAULT 'configuring',
	`lastSyncAt` timestamp,
	`syncFrequencyMinutes` int DEFAULT 15,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `connectors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataLineage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetTable` varchar(100) NOT NULL,
	`targetId` int NOT NULL,
	`sourceTable` varchar(100) NOT NULL,
	`sourceId` int NOT NULL,
	`transformationType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataLineage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `derivedMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteId` int NOT NULL,
	`metricCode` varchar(100) NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`periodType` enum('hour','day','week','month','year') NOT NULL,
	`value` decimal(18,6),
	`calculationMethod` varchar(100),
	`inputMetrics` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `derivedMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteId` int NOT NULL,
	`connectorId` int,
	`externalId` varchar(255),
	`name` varchar(255) NOT NULL,
	`deviceType` enum('inverter','battery','meter','weather_station','genset','charge_controller','combiner_box','transformer','other') NOT NULL,
	`manufacturer` varchar(100),
	`model` varchar(100),
	`serialNumber` varchar(100),
	`capacityKw` decimal(10,2),
	`capacityKwh` decimal(10,2),
	`status` enum('online','offline','warning','error','maintenance') DEFAULT 'offline',
	`lastSeenAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentViewEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`pageViewed` int,
	`viewDurationSeconds` int,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentViewEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entityResolutionHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mentionId` int NOT NULL,
	`action` enum('linked','created','ignored','unlinked') NOT NULL,
	`previousEntityId` int,
	`newEntityId` int,
	`resolutionMethod` enum('manual','bulk','auto_rule','ai_suggested') DEFAULT 'manual',
	`confidenceScore` decimal(3,2),
	`resolvedById` int,
	`resolvedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entityResolutionHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entityResolutionJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`status` enum('pending','processing','completed','failed') DEFAULT 'pending',
	`totalMentions` int,
	`resolvedCount` int DEFAULT 0,
	`createdCount` int DEFAULT 0,
	`ignoredCount` int DEFAULT 0,
	`errorCount` int DEFAULT 0,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entityResolutionJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entityResolutionRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`ruleName` varchar(255) NOT NULL,
	`matchType` enum('exact_alias','fuzzy_name','regex') NOT NULL,
	`matchPattern` text,
	`targetEntityId` int,
	`autoResolve` boolean DEFAULT false,
	`minConfidence` decimal(3,2),
	`enabled` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entityResolutionRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metricDefinitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`name` varchar(255) NOT NULL,
	`code` varchar(100) NOT NULL,
	`unit` varchar(50),
	`dataType` enum('number','boolean','string','enum') DEFAULT 'number',
	`aggregationMethod` enum('avg','sum','min','max','last','count') DEFAULT 'avg',
	`description` text,
	`category` enum('power','energy','voltage','current','frequency','temperature','soc','status','environmental','financial') DEFAULT 'power',
	`isStandard` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `metricDefinitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `normalizedMeasurements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteId` int NOT NULL,
	`deviceId` int,
	`metricId` int NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`periodType` enum('minute','hour','day','week','month') NOT NULL,
	`valueAvg` decimal(18,6),
	`valueMin` decimal(18,6),
	`valueMax` decimal(18,6),
	`valueSum` decimal(18,6),
	`sampleCount` int,
	`dataQuality` decimal(3,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `normalizedMeasurements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operationsReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`siteId` int,
	`reportType` enum('daily_summary','weekly_summary','monthly_performance','quarterly_review','annual_report','incident_report','custom') NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`title` varchar(500),
	`status` enum('generating','completed','failed') DEFAULT 'generating',
	`storageUrl` text,
	`generatedAt` timestamp,
	`generatedById` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operationsReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rawMeasurements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`metricId` int NOT NULL,
	`timestamp` timestamp NOT NULL,
	`valueNumeric` decimal(18,6),
	`valueString` varchar(255),
	`quality` enum('good','uncertain','bad','interpolated') DEFAULT 'good',
	`sourceConnectorId` int,
	`ingestedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rawMeasurements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stakeholderPortals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100),
	`brandingConfig` json,
	`allowedSiteIds` json,
	`allowedMetrics` json,
	`accessType` enum('password','token','sso') DEFAULT 'password',
	`passwordHash` varchar(255),
	`accessToken` varchar(64),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stakeholderPortals_id` PRIMARY KEY(`id`),
	CONSTRAINT `stakeholderPortals_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `whatsappSenderMappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configId` int NOT NULL,
	`senderPhone` varchar(20) NOT NULL,
	`senderName` varchar(255),
	`projectId` int,
	`siteId` int,
	`defaultCategory` enum('field_report','issue','document','general') DEFAULT 'general',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsappSenderMappings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsappTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configId` int NOT NULL,
	`templateName` varchar(255) NOT NULL,
	`templateType` enum('text','media','interactive') DEFAULT 'text',
	`content` json,
	`metaTemplateId` varchar(100),
	`status` enum('draft','pending_approval','approved','rejected') DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsappTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ingestedFiles` ADD `previewGenerated` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `ingestedFiles` ADD `previewUrl` text;--> statement-breakpoint
ALTER TABLE `ingestedFiles` ADD `pageCount` int;