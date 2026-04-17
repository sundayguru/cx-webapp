CREATE TABLE `quizzes` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`question` text NOT NULL,
	`question_type` text NOT NULL,
	`options` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
