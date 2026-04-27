import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  numeric,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const uploadStatusEnum = pgEnum("upload_status", ["pending", "processing", "completed", "failed"]);
export const supplierTierEnum = pgEnum("supplier_tier", ["1", "2", "3"]);
export const scoreRatingEnum = pgEnum("score_rating", ["red", "yellow", "green"]);
export const reportFormatEnum = pgEnum("report_format", ["pdf", "xml", "json"]);
export const reportStatusEnum = pgEnum("report_status", ["pending", "completed", "failed"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const sectors = pgTable("sectors", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  nameEn: varchar("nameEn", { length: 255 }).notNull(),
  nameTr: varchar("nameTr", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  hsCodes: jsonb("hsCodes").$type<string[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Sector = typeof sectors.$inferSelect;
export type InsertSector = typeof sectors.$inferInsert;

export const emissionFactors = pgTable("emissionFactors", {
  id: serial("id").primaryKey(),
  hsCode: varchar("hsCode", { length: 10 }).notNull(),
  sectorId: integer("sectorId").notNull(),
  scope1Factor: numeric("scope1Factor", { precision: 10, scale: 6 }).notNull(),
  scope2Factor: numeric("scope2Factor", { precision: 10, scale: 6 }).notNull(),
  scope3Factor: numeric("scope3Factor", { precision: 10, scale: 6 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  source: varchar("source", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("emissionFactors_sectorId_idx").on(table.sectorId),
  index("emissionFactors_hsCode_idx").on(table.hsCode),
]);

export type EmissionFactor = typeof emissionFactors.$inferSelect;
export type InsertEmissionFactor = typeof emissionFactors.$inferInsert;

export const sectorInputs = pgTable("sectorInputs", {
  id: serial("id").primaryKey(),
  sectorId: integer("sectorId").notNull(),
  nameEn: varchar("nameEn", { length: 255 }).notNull(),
  nameTr: varchar("nameTr", { length: 255 }).notNull(),
  hsCode: varchar("hsCode", { length: 10 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("sectorInputs_sectorId_idx").on(table.sectorId),
]);

export type SectorInput = typeof sectorInputs.$inferSelect;
export type InsertSectorInput = typeof sectorInputs.$inferInsert;

export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  fileSize: integer("fileSize").notNull(),
  rowCount: integer("rowCount").notNull(),
  status: uploadStatusEnum("status").default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("uploads_userId_idx").on(table.userId),
]);

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  sectorId: integer("sectorId").notNull(),
  tier: supplierTierEnum("tier").notNull(),
  hsCode: varchar("hsCode", { length: 10 }).notNull(),
  quantity: varchar("quantity", { length: 20 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  co2eEmission: varchar("co2eEmission", { length: 20 }),
  invitationToken: varchar("invitationToken", { length: 255 }),
  invitationSentAt: timestamp("invitationSentAt"),
  invitationAcceptedAt: timestamp("invitationAcceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("suppliers_userId_idx").on(table.userId),
  index("suppliers_sectorId_idx").on(table.sectorId),
]);

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  uploadId: integer("uploadId"),
  supplierId: integer("supplierId"),
  sectorId: integer("sectorId").notNull(),
  emissionScore: varchar("emissionScore", { length: 10 }).notNull(),
  responsibilityScore: varchar("responsibilityScore", { length: 10 }).notNull(),
  supplyChainScore: varchar("supplyChainScore", { length: 10 }).notNull(),
  compositeScore: varchar("compositeScore", { length: 10 }).notNull(),
  scoreRating: scoreRatingEnum("scoreRating").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("scores_userId_idx").on(table.userId),
  index("scores_uploadId_idx").on(table.uploadId),
  index("scores_supplierId_idx").on(table.supplierId),
]);

export type Score = typeof scores.$inferSelect;
export type InsertScore = typeof scores.$inferInsert;

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  uploadId: integer("uploadId"),
  title: varchar("title", { length: 255 }).notNull(),
  format: reportFormatEnum("format").notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }),
  status: reportStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("reports_userId_idx").on(table.userId),
  index("reports_uploadId_idx").on(table.uploadId),
]);

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

export const validationLogs = pgTable("validationLogs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  uploadId: integer("uploadId"),
  rowIndex: integer("rowIndex"),
  errorType: varchar("errorType", { length: 100 }).notNull(),
  errorMessage: text("errorMessage").notNull(),
  suggestedFix: text("suggestedFix"),
  isResolved: boolean("isResolved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("validationLogs_userId_idx").on(table.userId),
  index("validationLogs_uploadId_idx").on(table.uploadId),
]);

export type ValidationLog = typeof validationLogs.$inferSelect;
export type InsertValidationLog = typeof validationLogs.$inferInsert;
