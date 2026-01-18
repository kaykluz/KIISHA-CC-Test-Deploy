CREATE TABLE `evidenceAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` enum('evidence_opened','evidence_not_found','access_denied') NOT NULL,
	`userId` int NOT NULL,
	`organizationId` int,
	`fieldRecordId` int NOT NULL,
	`fieldRecordType` varchar(50) NOT NULL,
	`evidenceRefId` int,
	`documentId` int,
	`pageNumber` int,
	`tierUsed` varchar(20),
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidenceAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidenceRefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fieldRecordId` int NOT NULL,
	`fieldRecordType` enum('ai_extraction','vatr_source','asset_attribute') NOT NULL,
	`documentId` int NOT NULL,
	`pageNumber` int,
	`evidenceTier` enum('T1_TEXT','T2_OCR','T3_ANCHOR') NOT NULL,
	`snippet` varchar(240),
	`bboxJson` json,
	`anchorJson` json,
	`confidence` decimal(4,3) NOT NULL DEFAULT '0.5',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdById` int,
	`provenanceStatus` enum('resolved','unresolved','needs_review') DEFAULT 'resolved',
	CONSTRAINT `evidenceRefs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `evidence_field_record_idx` ON `evidenceRefs` (`fieldRecordId`,`fieldRecordType`);--> statement-breakpoint
CREATE INDEX `evidence_document_page_idx` ON `evidenceRefs` (`documentId`,`pageNumber`);--> statement-breakpoint
CREATE INDEX `evidence_tier_idx` ON `evidenceRefs` (`evidenceTier`);