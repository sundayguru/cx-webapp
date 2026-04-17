PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_quizzes` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`question` text NOT NULL,
	`question_type` text(20) NOT NULL,
	`answer` text NOT NULL,
	`options` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_quizzes`("id", "unit_id", "question", "question_type", "answer", "options", "created_at") SELECT "id", "unit_id", "question", "question_type", "answer", "options", "created_at" FROM `quizzes`;--> statement-breakpoint
DROP TABLE `quizzes`;--> statement-breakpoint
ALTER TABLE `__new_quizzes` RENAME TO `quizzes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;