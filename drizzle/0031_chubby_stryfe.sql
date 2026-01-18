CREATE TABLE `request_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`request_id` int,
	`workspace_id` int,
	`submission_id` int,
	`event_type` varchar(100) NOT NULL,
	`actor_user_id` int NOT NULL,
	`actor_org_id` int,
	`target_type` varchar(100),
	`target_id` int,
	`details_json` json,
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `request_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `request_clarifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`request_id` int NOT NULL,
	`submission_id` int,
	`from_org_id` int NOT NULL,
	`from_user_id` int NOT NULL,
	`to_org_id` int NOT NULL,
	`subject` varchar(500),
	`message` text NOT NULL,
	`parent_id` int,
	`status` varchar(50) NOT NULL DEFAULT 'open',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `request_clarifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `request_recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`request_id` int NOT NULL,
	`recipient_org_id` int,
	`recipient_user_id` int,
	`recipient_email` varchar(255),
	`recipient_phone` varchar(50),
	`status` varchar(50) NOT NULL DEFAULT 'invited',
	`invited_at` timestamp NOT NULL DEFAULT (now()),
	`opened_at` timestamp,
	`submitted_at` timestamp,
	`declined_at` timestamp,
	CONSTRAINT `request_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `request_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issuer_org_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text,
	`requirements_schema_id` int,
	`default_workflow_id` int,
	`default_issuer_view_id` int,
	`created_by_user_id` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `request_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_id` int,
	`issuer_org_id` int NOT NULL,
	`issuer_user_id` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'draft',
	`deadline_at` timestamp,
	`instructions` text,
	`issuer_portfolio_id` int,
	`requirements_schema_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requirements_schemas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_id` int,
	`version` int NOT NULL DEFAULT 1,
	`schema_json` json NOT NULL,
	`is_published` boolean NOT NULL DEFAULT false,
	`created_by_user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `requirements_schemas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `response_workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`request_id` int NOT NULL,
	`recipient_org_id` int NOT NULL,
	`created_by_user_id` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`response_view_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `response_workspaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scoped_grants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`grantor_org_id` int NOT NULL,
	`grantee_org_id` int NOT NULL,
	`grantee_user_id` int,
	`scope_type` varchar(50) NOT NULL,
	`scope_id` int NOT NULL,
	`expires_at` timestamp,
	`is_revoked` boolean NOT NULL DEFAULT false,
	`revoked_at` timestamp,
	`revoked_by_user_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scoped_grants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sign_off_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspace_id` int NOT NULL,
	`requirement_id` int NOT NULL,
	`signed_by_user_id` int NOT NULL,
	`status` varchar(50) NOT NULL,
	`notes` text,
	`signed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sign_off_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sign_off_requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_id` int,
	`request_id` int,
	`signer_role` varchar(100),
	`signer_user_id` int,
	`order_index` int NOT NULL DEFAULT 0,
	`is_parallel` boolean NOT NULL DEFAULT false,
	`condition_json` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sign_off_requirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(50) NOT NULL DEFAULT 'submission',
	`content_json` json NOT NULL,
	`content_hash` varchar(64) NOT NULL,
	`created_by_user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`request_id` int NOT NULL,
	`workspace_id` int NOT NULL,
	`recipient_org_id` int NOT NULL,
	`submitted_by_user_id` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'submitted',
	`snapshot_id` int NOT NULL,
	`submitted_at` timestamp NOT NULL DEFAULT (now()),
	`reviewed_at` timestamp,
	`reviewed_by_user_id` int,
	`review_notes` text,
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspace_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspace_id` int NOT NULL,
	`requirement_key` varchar(255) NOT NULL,
	`asset_id` int,
	`answer_json` json NOT NULL,
	`vatr_source_path` varchar(500),
	`is_verified` boolean NOT NULL DEFAULT false,
	`verified_by_user_id` int,
	`verified_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspace_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspace_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspace_id` int NOT NULL,
	`asset_id` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'included',
	`added_at` timestamp NOT NULL DEFAULT (now()),
	`added_by_user_id` int NOT NULL,
	CONSTRAINT `workspace_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspace_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspace_id` int NOT NULL,
	`requirement_key` varchar(255),
	`asset_id` int,
	`document_id` int,
	`file_url` varchar(1000),
	`file_name` varchar(255),
	`file_type` varchar(100),
	`uploaded_by_user_id` int NOT NULL,
	`uploaded_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspace_documents_id` PRIMARY KEY(`id`)
);
