CREATE TABLE `emissionFactors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hsCode` varchar(10) NOT NULL,
	`sectorId` int NOT NULL,
	`scope1Factor` decimal(10,6) NOT NULL,
	`scope2Factor` decimal(10,6) NOT NULL,
	`scope3Factor` decimal(10,6) NOT NULL,
	`unit` varchar(20) NOT NULL,
	`source` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emissionFactors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`uploadId` int,
	`title` varchar(255) NOT NULL,
	`format` enum('pdf','xml','json') NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`fileUrl` varchar(500),
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`uploadId` int,
	`supplierId` int,
	`sectorId` int NOT NULL,
	`emissionScore` decimal(5,2) NOT NULL,
	`responsibilityScore` decimal(5,2) NOT NULL,
	`supplyChainScore` decimal(5,2) NOT NULL,
	`compositeScore` decimal(5,2) NOT NULL,
	`scoreRating` enum('red','yellow','green') NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sectorInputs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectorId` int NOT NULL,
	`nameEn` varchar(255) NOT NULL,
	`nameTr` varchar(255) NOT NULL,
	`hsCode` varchar(10) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sectorInputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sectors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`nameEn` varchar(255) NOT NULL,
	`nameTr` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`hsCodes` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sectors_id` PRIMARY KEY(`id`),
	CONSTRAINT `sectors_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`sectorId` int NOT NULL,
	`tier` enum('1','2','3') NOT NULL,
	`hsCode` varchar(10) NOT NULL,
	`quantity` decimal(15,2) NOT NULL,
	`unit` varchar(20) NOT NULL,
	`co2eEmission` decimal(15,6),
	`invitationToken` varchar(255),
	`invitationSentAt` timestamp,
	`invitationAcceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`fileSize` int NOT NULL,
	`rowCount` int NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `validationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`uploadId` int,
	`rowIndex` int,
	`errorType` varchar(100) NOT NULL,
	`errorMessage` text NOT NULL,
	`suggestedFix` text,
	`isResolved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `validationLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `emissionFactors_sectorId_idx` ON `emissionFactors` (`sectorId`);--> statement-breakpoint
CREATE INDEX `emissionFactors_hsCode_idx` ON `emissionFactors` (`hsCode`);--> statement-breakpoint
CREATE INDEX `reports_userId_idx` ON `reports` (`userId`);--> statement-breakpoint
CREATE INDEX `reports_uploadId_idx` ON `reports` (`uploadId`);--> statement-breakpoint
CREATE INDEX `scores_userId_idx` ON `scores` (`userId`);--> statement-breakpoint
CREATE INDEX `scores_uploadId_idx` ON `scores` (`uploadId`);--> statement-breakpoint
CREATE INDEX `scores_supplierId_idx` ON `scores` (`supplierId`);--> statement-breakpoint
CREATE INDEX `scores_sectorId_idx` ON `scores` (`sectorId`);--> statement-breakpoint
CREATE INDEX `sectorInputs_sectorId_idx` ON `sectorInputs` (`sectorId`);--> statement-breakpoint
CREATE INDEX `suppliers_userId_idx` ON `suppliers` (`userId`);--> statement-breakpoint
CREATE INDEX `suppliers_sectorId_idx` ON `suppliers` (`sectorId`);--> statement-breakpoint
CREATE INDEX `uploads_userId_idx` ON `uploads` (`userId`);--> statement-breakpoint
CREATE INDEX `validationLogs_userId_idx` ON `validationLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `validationLogs_uploadId_idx` ON `validationLogs` (`uploadId`);