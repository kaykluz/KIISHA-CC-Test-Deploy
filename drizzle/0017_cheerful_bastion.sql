CREATE TABLE `assetRequirementTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`assetClassification` enum('residential','small_commercial','large_commercial','industrial','mini_grid','mesh_grid','interconnected_mini_grids','grid_connected'),
	`configurationProfile` enum('PV_ONLY','PV_BESS','PV_DG','PV_BESS_DG','BESS_ONLY','DG_ONLY','WIND_ONLY','WIND_BESS','HYDRO_ONLY','MINIGRID_PV_BESS','MINIGRID_PV_BESS_DG','HYBRID_MULTI','OTHER'),
	`stage` varchar(100),
	`requiredDocumentTypes` json,
	`requiredFields` json,
	`requiredChecklistItems` json,
	`requiredMonitoringDatapoints` json,
	`completenessWeights` json,
	`isActive` boolean DEFAULT true,
	`priority` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assetRequirementTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assetTemplateAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`requirementTemplateId` int,
	`viewTemplateId` int,
	`assignmentType` enum('auto_matched','admin_override') DEFAULT 'auto_matched',
	`matchScore` decimal(5,2),
	`overrideReason` text,
	`assignedBy` int,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assetTemplateAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assetViewTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`assetClassification` enum('residential','small_commercial','large_commercial','industrial','mini_grid','mesh_grid','interconnected_mini_grids','grid_connected'),
	`configurationProfile` enum('PV_ONLY','PV_BESS','PV_DG','PV_BESS_DG','BESS_ONLY','DG_ONLY','WIND_ONLY','WIND_BESS','HYDRO_ONLY','MINIGRID_PV_BESS','MINIGRID_PV_BESS_DG','HYBRID_MULTI','OTHER'),
	`detailsTableColumns` json,
	`dashboardWidgets` json,
	`diligenceSections` json,
	`dataRoomCategories` json,
	`isActive` boolean DEFAULT true,
	`priority` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assetViewTemplates_id` PRIMARY KEY(`id`)
);
