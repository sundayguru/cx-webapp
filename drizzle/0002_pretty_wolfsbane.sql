CREATE TABLE `profile` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`bio` text(255) NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
