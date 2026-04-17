CREATE TABLE `chat_messages` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`role` text(20) NOT NULL,
	`content` text NOT NULL,
	`provider` text(20),
	`model` text(50),
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
