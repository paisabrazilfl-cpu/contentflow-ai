CREATE TABLE `activity_feed` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`action` varchar(128) NOT NULL,
	`description` text,
	`platform` varchar(32),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_feed_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`platform` varchar(32),
	`metricType` varchar(64) NOT NULL,
	`metricValue` int DEFAULT 0,
	`metadata` json,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`keyName` varchar(128) NOT NULL,
	`keyValue` text NOT NULL,
	`provider` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`industry` varchar(128),
	`targetAudience` text,
	`toneOfVoice` varchar(128),
	`websiteUrl` varchar(512),
	`description` text,
	`timezone` varchar(64) DEFAULT 'UTC',
	`topicClusters` json,
	`contentTypes` json,
	`postingSchedule` json,
	`autoApprove` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `connected_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`platform` varchar(32) NOT NULL,
	`platformAccountId` varchar(255),
	`accountName` varchar(255),
	`accessToken` text,
	`refreshToken` text,
	`expiresAt` timestamp,
	`scopes` text,
	`status` varchar(32) DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `connected_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`platform` varchar(32) NOT NULL,
	`contentType` varchar(32) DEFAULT 'social',
	`title` varchar(512),
	`content` text,
	`mediaUrls` json,
	`scheduledFor` timestamp,
	`publishedAt` timestamp,
	`status` varchar(32) DEFAULT 'pending',
	`errorLog` text,
	`retryCount` int DEFAULT 0,
	`engagementData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeInvoiceId` varchar(128),
	`amount` int NOT NULL,
	`currency` varchar(8) DEFAULT 'usd',
	`status` varchar(32) DEFAULT 'paid',
	`description` varchar(512),
	`invoiceUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`userId` int,
	`email` varchar(320) NOT NULL,
	`role` varchar(32) DEFAULT 'member',
	`status` varchar(32) DEFAULT 'pending',
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`joinedAt` timestamp,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` varchar(32) DEFAULT 'trialing';--> statement-breakpoint
ALTER TABLE `users` ADD `planTier` varchar(32) DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompleted` boolean DEFAULT false;