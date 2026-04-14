CREATE TABLE `courses` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`title` text(255) NOT NULL,
	`code` text(50) NOT NULL,
	`description` text NOT NULL,
	`status` text(20) DEFAULT 'pending' NOT NULL,
	`created_by` text NOT NULL,
	`content_key` text(511),
	`content_type` text(100),
	`content_size` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_code_unique` ON `courses` (`code`);