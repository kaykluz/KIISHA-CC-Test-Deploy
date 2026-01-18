ALTER TABLE `checklistItemDocuments` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `checklistItemDocuments` ADD `createdBy` int;--> statement-breakpoint
ALTER TABLE `rfiChecklistLinks` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `rfiChecklistLinks` ADD `createdBy` int;--> statement-breakpoint
ALTER TABLE `rfiDocuments` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `rfiDocuments` ADD `createdBy` int;--> statement-breakpoint
ALTER TABLE `rfiScheduleLinks` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `rfiScheduleLinks` ADD `createdBy` int;--> statement-breakpoint
ALTER TABLE `checklistItemDocuments` ADD CONSTRAINT `checklist_document_unique` UNIQUE(`checklistItemId`,`documentId`);--> statement-breakpoint
ALTER TABLE `rfiChecklistLinks` ADD CONSTRAINT `rfi_checklist_unique` UNIQUE(`rfiId`,`checklistItemId`);--> statement-breakpoint
ALTER TABLE `rfiDocuments` ADD CONSTRAINT `rfi_document_unique` UNIQUE(`rfiId`,`documentId`);--> statement-breakpoint
ALTER TABLE `rfiScheduleLinks` ADD CONSTRAINT `rfi_schedule_unique` UNIQUE(`rfiId`,`scheduleItemId`);