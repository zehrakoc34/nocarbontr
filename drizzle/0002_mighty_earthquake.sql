ALTER TABLE `scores` MODIFY COLUMN `emissionScore` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `scores` MODIFY COLUMN `responsibilityScore` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `scores` MODIFY COLUMN `supplyChainScore` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `scores` MODIFY COLUMN `compositeScore` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `suppliers` MODIFY COLUMN `quantity` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `suppliers` MODIFY COLUMN `co2eEmission` varchar(20);