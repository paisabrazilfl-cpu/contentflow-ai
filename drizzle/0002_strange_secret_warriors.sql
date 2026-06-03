CREATE TABLE `usage_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`postsPublished` int NOT NULL DEFAULT 0,
	`postsGenerated` int NOT NULL DEFAULT 0,
	`platformsConnected` int NOT NULL DEFAULT 0,
	`aiGenerations` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usage_tracking_id` PRIMARY KEY(`id`)
);
