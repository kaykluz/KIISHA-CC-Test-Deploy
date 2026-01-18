CREATE TABLE `view_instance_update_receipts` (
	`id` varchar(36) NOT NULL,
	`rollout_id` varchar(36) NOT NULL,
	`instance_id` varchar(36) NOT NULL,
	`status` varchar(20) DEFAULT 'pending',
	`conflict_details_json` json,
	`user_action` varchar(20),
	`user_action_at` timestamp,
	`user_action_by_user_id` int,
	`previous_definition_json` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `view_instance_update_receipts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `view_instances` (
	`id` varchar(36) NOT NULL,
	`org_id` int NOT NULL,
	`owner_user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`workspace_id` varchar(36),
	`board_id` varchar(36),
	`request_id` int,
	`source_template_id` varchar(36),
	`source_version_id` varchar(36),
	`definition_json` json NOT NULL,
	`update_mode` varchar(20) DEFAULT 'independent',
	`has_local_edits` boolean DEFAULT false,
	`local_edits_summary` text,
	`status` varchar(20) DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `view_instances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `view_template_versions` (
	`id` varchar(36) NOT NULL,
	`template_id` varchar(36) NOT NULL,
	`version_number` int NOT NULL,
	`definition_json` json NOT NULL,
	`changelog` text,
	`created_by_user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `view_template_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `view_templates_v2` (
	`id` varchar(36) NOT NULL,
	`org_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`current_version_id` varchar(36),
	`category` varchar(100),
	`is_public` boolean DEFAULT false,
	`created_by_user_id` int NOT NULL,
	`status` varchar(20) DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `view_templates_v2_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `view_update_rollouts` (
	`id` varchar(36) NOT NULL,
	`org_id` int NOT NULL,
	`template_id` varchar(36) NOT NULL,
	`from_version_id` varchar(36),
	`to_version_id` varchar(36) NOT NULL,
	`rollout_mode` varchar(20) NOT NULL,
	`scope` varchar(30) NOT NULL,
	`scope_workspace_ids` json,
	`scope_instance_ids` json,
	`status` varchar(20) DEFAULT 'draft',
	`requires_approval` boolean DEFAULT true,
	`created_by_user_id` int NOT NULL,
	`approved_by_user_id` int,
	`approval_notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`approved_at` timestamp,
	`executed_at` timestamp,
	`completed_at` timestamp,
	CONSTRAINT `view_update_rollouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `view_version_audit_log` (
	`id` varchar(36) NOT NULL,
	`org_id` int NOT NULL,
	`entity_type` varchar(50) NOT NULL,
	`entity_id` varchar(36) NOT NULL,
	`action` varchar(50) NOT NULL,
	`user_id` int NOT NULL,
	`details_json` json,
	`related_template_id` varchar(36),
	`related_version_id` varchar(36),
	`related_instance_id` varchar(36),
	`related_rollout_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `view_version_audit_log_id` PRIMARY KEY(`id`)
);
