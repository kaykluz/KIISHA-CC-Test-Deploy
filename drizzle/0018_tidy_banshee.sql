ALTER TABLE `assets` ADD `assetClassification` enum('residential','small_commercial','large_commercial','industrial','mini_grid','mesh_grid','interconnected_mini_grids','grid_connected');--> statement-breakpoint
ALTER TABLE `assets` ADD `gridConnectionType` enum('off_grid','grid_connected','grid_tied_with_backup','mini_grid','interconnected_mini_grid','mesh_grid');--> statement-breakpoint
ALTER TABLE `assets` ADD `networkTopology` enum('radial','ring','mesh','star','unknown');--> statement-breakpoint
ALTER TABLE `assets` ADD `configurationProfile` enum('pv_only','pv_bess','pv_dg','pv_bess_dg','bess_only','dg_only','minigrid_pv_bess','minigrid_pv_bess_dg','mesh_pv_bess','mesh_pv_bess_dg','hybrid_custom');--> statement-breakpoint
ALTER TABLE `assets` ADD `componentsJson` json;