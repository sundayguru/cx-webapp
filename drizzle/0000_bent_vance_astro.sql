CREATE TABLE `users` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`firstName` text(255) NOT NULL,
	`lastName` text(255) NOT NULL,
	`email` text(255) NOT NULL,
	`created_at` text DEFAULT 'now()' NOT NULL,
	`updated_at` text DEFAULT 'now()' NOT NULL
);
