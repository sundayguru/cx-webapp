CREATE TABLE `modules` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`title` text(255) NOT NULL,
	`description` text,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `units` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`module_id` text NOT NULL,
	`title` text(255) NOT NULL,
	`content` text,
	`type` text(50) DEFAULT 'text' NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade
);
