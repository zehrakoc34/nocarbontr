import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  users,
  sectors,
  emissionFactors,
  sectorInputs,
  uploads,
  suppliers,
  scores,
  reports,
  validationLogs,
  type Sector,
  type EmissionFactor,
  type SectorInput,
  type Upload,
  type Supplier,
  type Score,
  type Report,
  type ValidationLog,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, { max: 10, ssl: 'require' });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = getDb();
  if (!db) { console.warn("[DB] upsertUser: no DB"); return; }

  const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
  if (existing.length > 0) {
    const updates: Partial<InsertUser> = { updatedAt: new Date(), lastSignedIn: new Date() };
    if (user.name !== undefined) updates.name = user.name;
    if (user.email !== undefined) updates.email = user.email;
    if (user.loginMethod !== undefined) updates.loginMethod = user.loginMethod;
    if (user.passwordHash !== undefined) updates.passwordHash = user.passwordHash;
    if (user.role !== undefined) updates.role = user.role;
    await db.update(users).set(updates).where(eq(users.openId, user.openId));
  } else {
    const role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
    await db.insert(users).values({ ...user, role, lastSignedIn: new Date() });
  }
}

export async function createUser(data: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<User> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values({
    openId: data.email,
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    loginMethod: "email",
    lastSignedIn: new Date(),
  }).returning();
  return result[0]!;
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

// ── Sectors ────────────────────────────────────────────────────────────────

export async function getAllSectors(): Promise<Sector[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(sectors);
}

export async function getSectorById(id: number): Promise<Sector | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(sectors).where(eq(sectors.id, id)).limit(1);
  return result[0];
}

export async function getSectorByCode(code: string): Promise<Sector | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(sectors).where(eq(sectors.code, code)).limit(1);
  return result[0];
}

// ── Emission Factors ───────────────────────────────────────────────────────

export async function getEmissionFactorByHsCode(hsCode: string): Promise<EmissionFactor | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(emissionFactors).where(eq(emissionFactors.hsCode, hsCode)).limit(1);
  return result[0];
}

export async function getEmissionFactorsBySector(sectorId: number): Promise<EmissionFactor[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(emissionFactors).where(eq(emissionFactors.sectorId, sectorId));
}

// ── Sector Inputs ──────────────────────────────────────────────────────────

export async function getSectorInputsBySector(sectorId: number): Promise<SectorInput[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(sectorInputs).where(eq(sectorInputs.sectorId, sectorId));
}

// ── Uploads ────────────────────────────────────────────────────────────────

export async function createUpload(upload: {
  userId: number;
  fileName: string;
  fileKey: string;
  fileSize: number;
  rowCount: number;
}): Promise<Upload> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(uploads).values(upload).returning();
  return result[0]!;
}

export async function getUploadById(id: number): Promise<Upload | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
  return result[0];
}

export async function getUserUploads(userId: number): Promise<Upload[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(uploads).where(eq(uploads.userId, userId)).orderBy(desc(uploads.createdAt));
}

export async function updateUploadStatus(
  id: number,
  status: "pending" | "processing" | "completed" | "failed",
  errorMessage?: string
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.update(uploads).set({ status, errorMessage, updatedAt: new Date() }).where(eq(uploads.id, id));
}

export async function updateUploadRowCount(id: number, rowCount: number): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.update(uploads).set({ rowCount, updatedAt: new Date() }).where(eq(uploads.id, id));
}

// ── Suppliers ──────────────────────────────────────────────────────────────

export async function createSupplier(supplier: {
  userId: number;
  name: string;
  email?: string;
  sectorId: number;
  tier: "1" | "2" | "3";
  hsCode: string;
  quantity: number | string;
  unit: string;
  co2eEmission?: number | string;
}): Promise<Supplier> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(suppliers).values({
    ...supplier,
    quantity: String(supplier.quantity),
    co2eEmission: supplier.co2eEmission !== undefined ? String(supplier.co2eEmission) : undefined,
  }).returning();
  return result[0]!;
}

export async function getUserSuppliers(userId: number): Promise<Supplier[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(suppliers).where(eq(suppliers.userId, userId)).orderBy(desc(suppliers.createdAt));
}

export async function getSupplierById(id: number): Promise<Supplier | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result[0];
}

export async function updateSupplier(id: number, updates: Partial<Supplier>): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.update(suppliers).set({ ...updates, updatedAt: new Date() }).where(eq(suppliers.id, id));
}

export async function deleteSupplier(id: number): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.delete(suppliers).where(eq(suppliers.id, id));
}

// ── Scores ─────────────────────────────────────────────────────────────────

export async function createScore(score: {
  userId: number;
  uploadId?: number;
  supplierId?: number;
  sectorId: number;
  emissionScore: string | number;
  responsibilityScore: string | number;
  supplyChainScore: string | number;
  compositeScore: string | number;
  scoreRating: "red" | "yellow" | "green";
  metadata?: Record<string, unknown>;
}): Promise<Score> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scores).values({
    ...score,
    emissionScore: String(score.emissionScore),
    responsibilityScore: String(score.responsibilityScore),
    supplyChainScore: String(score.supplyChainScore),
    compositeScore: String(score.compositeScore),
  }).returning();
  return result[0]!;
}

export async function getScoresByUpload(uploadId: number): Promise<Score[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(scores).where(eq(scores.uploadId, uploadId));
}

export async function getScoresBySupplier(supplierId: number): Promise<Score[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(scores).where(eq(scores.supplierId, supplierId));
}

// ── Reports ────────────────────────────────────────────────────────────────

export async function createReport(report: {
  userId: number;
  uploadId?: number;
  title: string;
  format: "pdf" | "xml" | "json";
  fileKey: string;
  fileUrl?: string;
}): Promise<Report> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reports).values(report).returning();
  return result[0]!;
}

export async function getUserReports(userId: number): Promise<Report[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(reports).where(eq(reports.userId, userId)).orderBy(desc(reports.createdAt));
}

// ── Validation Logs ────────────────────────────────────────────────────────

export async function createValidationLog(log: {
  userId: number;
  uploadId?: number;
  rowIndex?: number;
  errorType: string;
  errorMessage: string;
  suggestedFix?: string;
}): Promise<ValidationLog> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(validationLogs).values(log).returning();
  return result[0]!;
}

export async function getValidationLogsByUpload(uploadId: number): Promise<ValidationLog[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(validationLogs).where(eq(validationLogs.uploadId, uploadId));
}
