ALTER TABLE `projects` MODIFY COLUMN `stage` enum('origination','feasibility','development','due_diligence','ntp','construction','commissioning','cod','operations') DEFAULT 'feasibility';--> statement-breakpoint
ALTER TABLE `projects` ADD `country` varchar(100) DEFAULT 'Nigeria';--> statement-breakpoint
ALTER TABLE `projects` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `projects` ADD `timezone` varchar(50) DEFAULT 'Africa/Lagos';--> statement-breakpoint
ALTER TABLE `projects` ADD `assetClassification` enum('residential','small_commercial','large_commercial','industrial','mini_grid','mesh_grid','interconnected_mini_grids','grid_connected');--> statement-breakpoint
ALTER TABLE `projects` ADD `gridConnectionType` enum('grid_tied','islanded','islandable','weak_grid','no_grid');--> statement-breakpoint
ALTER TABLE `projects` ADD `configurationProfile` enum('solar_only','solar_bess','solar_genset','solar_bess_genset','bess_only','genset_only','hybrid');--> statement-breakpoint
ALTER TABLE `projects` ADD `networkTopology` enum('radial','ring','mesh','star','unknown');--> statement-breakpoint
ALTER TABLE `projects` ADD `offtakerName` varchar(255);--> statement-breakpoint
ALTER TABLE `projects` ADD `offtakerType` enum('industrial','commercial','utility','community','residential_aggregate');--> statement-breakpoint
ALTER TABLE `projects` ADD `contractType` enum('ppa','lease','esco','direct_sale','captive');--> statement-breakpoint
ALTER TABLE `projects` ADD `projectValueUsd` decimal(14,2);--> statement-breakpoint
ALTER TABLE `projects` ADD `tariffUsdKwh` decimal(8,4);--> statement-breakpoint
ALTER TABLE `projects` ADD `codDate` date;--> statement-breakpoint
ALTER TABLE `projects` ADD `ppaStartDate` date;--> statement-breakpoint
ALTER TABLE `projects` ADD `ppaEndDate` date;