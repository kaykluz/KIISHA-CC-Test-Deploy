CREATE TABLE `aiSetupProposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`status` enum('pending','approved','rejected','partially_approved') DEFAULT 'pending',
	`inputDocumentIds` json,
	`questionnaireResponses` json,
	`proposedAssetClasses` json,
	`proposedConfigProfiles` json,
	`proposedFieldPacks` json,
	`proposedChartConfig` json,
	`proposedDocHubCategories` json,
	`overallConfidence` decimal(5,2),
	`risks` json,
	`ambiguities` json,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`approvedItems` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiSetupProposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fieldPacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`scope` enum('asset','project','site','portfolio','dataroom','rfi') NOT NULL,
	`fields` json,
	`docRequirements` json,
	`charts` json,
	`status` enum('draft','active','archived') DEFAULT 'draft',
	`clonedFromId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `fieldPacks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orgPreferenceVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`version` int NOT NULL,
	`snapshotJson` json,
	`changeSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int NOT NULL,
	CONSTRAINT `orgPreferenceVersions_id` PRIMARY KEY(`id`),
	CONSTRAINT `org_version_unique` UNIQUE(`organizationId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `orgPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`defaultAssetClassifications` json,
	`defaultConfigurationProfiles` json,
	`preferredFieldPacks` json,
	`defaultDisclosureMode` enum('summary','expanded','full') DEFAULT 'summary',
	`defaultChartsConfig` json,
	`defaultDocumentHubSchemaId` int,
	`aiSetupCompleted` boolean DEFAULT false,
	`aiSetupCompletedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `orgPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `orgPreferences_organizationId_unique` UNIQUE(`organizationId`)
);
--> statement-breakpoint
CREATE TABLE `pushUpdateNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`updateType` enum('field_pack','chart_config','view_template','doc_hub_schema') NOT NULL,
	`updateSourceId` int NOT NULL,
	`updateVersion` int NOT NULL,
	`targetScope` enum('all_users','team','department','specific_users') NOT NULL,
	`targetIds` json,
	`forceUpdate` boolean DEFAULT false,
	`requiresApproval` boolean DEFAULT false,
	`approvedBy` int,
	`approvedAt` timestamp,
	`notifiedUserIds` json,
	`acceptedUserIds` json,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pushUpdateNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userViewCustomizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`organizationId` int NOT NULL,
	`viewId` int NOT NULL,
	`localChartOverrides` json,
	`localColumnOrder` json,
	`localHiddenFields` json,
	`lastOrgUpdateVersion` int,
	`hasLocalChanges` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userViewCustomizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_view_custom_unique` UNIQUE(`userId`,`organizationId`,`viewId`)
);
