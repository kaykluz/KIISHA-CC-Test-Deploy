ALTER TABLE `exportManifests` MODIFY COLUMN `exportType` enum('csv','excel','pdf','due_diligence_pack','json') NOT NULL;--> statement-breakpoint
ALTER TABLE `viewFieldOverrides` MODIFY COLUMN `state` enum('show','hide','show_latest_only','show_specific_version','pin_version') NOT NULL DEFAULT 'show';--> statement-breakpoint
ALTER TABLE `exportManifests` ADD `includeHidden` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `exportManifests` ADD `filters` json;--> statement-breakpoint
ALTER TABLE `exportManifests` ADD `status` enum('pending','processing','completed','failed') DEFAULT 'pending';