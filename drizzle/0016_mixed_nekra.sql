ALTER TABLE `vatrAssets` ADD `assetClassification` enum('residential','small_commercial','large_commercial','industrial','mini_grid','mesh_grid','interconnected_mini_grids','grid_connected') DEFAULT 'grid_connected';--> statement-breakpoint
ALTER TABLE `vatrAssets` ADD `gridConnectionType` enum('off_grid','grid_connected','grid_tied_with_backup','mini_grid','interconnected_mini_grid','mesh_grid') DEFAULT 'grid_connected';--> statement-breakpoint
ALTER TABLE `vatrAssets` ADD `networkTopology` enum('radial','ring','mesh','star','unknown') DEFAULT 'unknown';--> statement-breakpoint
ALTER TABLE `vatrAssets` ADD `components` json;--> statement-breakpoint
ALTER TABLE `vatrAssets` ADD `configurationProfile` enum('PV_ONLY','PV_BESS','PV_DG','PV_BESS_DG','BESS_ONLY','DG_ONLY','WIND_ONLY','WIND_BESS','HYDRO_ONLY','MINIGRID_PV_BESS','MINIGRID_PV_BESS_DG','HYBRID_MULTI','OTHER') DEFAULT 'OTHER';--> statement-breakpoint
ALTER TABLE `vatrAssets` ADD `requirementTemplateId` int;--> statement-breakpoint
ALTER TABLE `vatrAssets` ADD `viewTemplateId` int;