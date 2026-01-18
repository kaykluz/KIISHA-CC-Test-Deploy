CREATE TABLE `fileUploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` enum('web','whatsapp','email','api') NOT NULL,
	`sourceId` varchar(255),
	`originalFilename` varchar(500) NOT NULL,
	`mimeType` varchar(255) NOT NULL,
	`fileSize` int NOT NULL,
	`fileExtension` varchar(50),
	`storageKey` varchar(500) NOT NULL,
	`storageUrl` text,
	`status` enum('uploading','uploaded','processing','processed','failed') NOT NULL DEFAULT 'uploading',
	`processingJobId` int,
	`isValidType` boolean DEFAULT true,
	`isValidSize` boolean DEFAULT true,
	`validationErrors` json,
	`linkedEntityType` varchar(50),
	`linkedEntityId` int,
	`userId` int,
	`organizationId` int,
	`projectId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fileUploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`level` enum('debug','info','warn','error') NOT NULL DEFAULT 'info',
	`message` text NOT NULL,
	`data` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('document_ingestion','ai_extraction','email_send','notification_send','report_generation','data_export','file_processing','webhook_delivery') NOT NULL,
	`status` enum('queued','processing','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`payload` json NOT NULL,
	`result` json,
	`error` text,
	`attempts` int NOT NULL DEFAULT 0,
	`maxAttempts` int NOT NULL DEFAULT 3,
	`correlationId` varchar(64),
	`parentJobId` int,
	`userId` int,
	`organizationId` int,
	`scheduledFor` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`failedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
