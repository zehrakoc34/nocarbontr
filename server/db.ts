import { sbSelect, sbInsert, sbUpdate, sbDelete } from "./supabaseClient";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  passwordHash: string | null;
  loginMethod: string | null;
  role: "user" | "admin" | "supplier";
  createdAt: string;
  updatedAt: string;
  lastSignedIn: string;
};

export type Sector = {
  id: number;
  code: string;
  nameEn: string;
  nameTr: string;
  description: string | null;
  category: string;
  hsCodes: string[];
  createdAt: string;
  updatedAt: string;
};

export type EmissionFactor = {
  id: number;
  hsCode: string;
  sectorId: number;
  scope1Factor: string;
  scope2Factor: string;
  scope3Factor: string;
  unit: string;
  source: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SectorInput = {
  id: number;
  sectorId: number;
  nameEn: string;
  nameTr: string;
  hsCode: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Upload = {
  id: number;
  userId: number;
  fileName: string;
  fileKey: string;
  fileSize: number;
  rowCount: number;
  status: "pending" | "processing" | "completed" | "failed";
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Supplier = {
  id: number;
  userId: number;
  name: string;
  email: string | null;
  sectorId: number;
  tier: "1" | "2" | "3";
  hsCode: string;
  quantity: string;
  unit: string;
  co2eEmission: string | null;
  invitationToken: string | null;
  invitationSentAt: string | null;
  invitationAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Score = {
  id: number;
  userId: number;
  uploadId: number | null;
  supplierId: number | null;
  sectorId: number;
  emissionScore: string;
  responsibilityScore: string;
  supplyChainScore: string;
  compositeScore: string;
  scoreRating: "red" | "yellow" | "green";
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type Report = {
  id: number;
  userId: number;
  uploadId: number | null;
  title: string;
  format: "pdf" | "xml" | "json";
  fileKey: string;
  fileUrl: string | null;
  status: "pending" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
};

export type ValidationLog = {
  id: number;
  userId: number;
  uploadId: number | null;
  rowIndex: number | null;
  errorType: string;
  errorMessage: string;
  suggestedFix: string | null;
  isResolved: boolean;
  createdAt: string;
};

// ── Users ──────────────────────────────────────────────────────────────────

export async function upsertUser(user: Partial<User> & { openId: string }): Promise<void> {
  const existing = await getUserByOpenId(user.openId);
  if (existing) {
    await sbUpdate("users", `openId=eq.${encodeURIComponent(user.openId)}`, {
      updatedAt: new Date().toISOString(),
      lastSignedIn: new Date().toISOString(),
      ...(user.name !== undefined && { name: user.name }),
      ...(user.email !== undefined && { email: user.email }),
    });
  } else {
    await sbInsert("users", { ...user, lastSignedIn: new Date().toISOString() });
  }
}

export async function createUser(data: { email: string; name: string; passwordHash: string }): Promise<User> {
  return sbInsert<User>("users", {
    openId: data.email,
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    loginMethod: "email",
    role: "user",
    lastSignedIn: new Date().toISOString(),
  });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const rows = await sbSelect<User>("users", `openId=eq.${encodeURIComponent(openId)}&limit=1`);
  return rows[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const rows = await sbSelect<User>("users", `id=eq.${id}&limit=1`);
  return rows[0];
}

// ── Sectors ────────────────────────────────────────────────────────────────

export async function getAllSectors(): Promise<Sector[]> {
  return sbSelect<Sector>("sectors", "order=id.asc");
}

export async function getSectorById(id: number): Promise<Sector | undefined> {
  const rows = await sbSelect<Sector>("sectors", `id=eq.${id}&limit=1`);
  return rows[0];
}

export async function getSectorByCode(code: string): Promise<Sector | undefined> {
  const rows = await sbSelect<Sector>("sectors", `code=eq.${encodeURIComponent(code)}&limit=1`);
  return rows[0];
}

// ── Emission Factors ───────────────────────────────────────────────────────

export async function getEmissionFactorByHsCode(hsCode: string): Promise<EmissionFactor | undefined> {
  const rows = await sbSelect<EmissionFactor>("emissionFactors", `hsCode=eq.${encodeURIComponent(hsCode)}&limit=1`);
  return rows[0];
}

export async function getEmissionFactorsBySector(sectorId: number): Promise<EmissionFactor[]> {
  return sbSelect<EmissionFactor>("emissionFactors", `sectorId=eq.${sectorId}`);
}

// ── Sector Inputs ──────────────────────────────────────────────────────────

export async function getSectorInputsBySector(sectorId: number): Promise<SectorInput[]> {
  return sbSelect<SectorInput>("sectorInputs", `sectorId=eq.${sectorId}`);
}

// ── Uploads ────────────────────────────────────────────────────────────────

export async function createUpload(upload: {
  userId: number; fileName: string; fileKey: string; fileSize: number; rowCount: number;
}): Promise<Upload> {
  return sbInsert<Upload>("uploads", { ...upload, status: "pending" });
}

export async function getUploadById(id: number): Promise<Upload | undefined> {
  const rows = await sbSelect<Upload>("uploads", `id=eq.${id}&limit=1`);
  return rows[0];
}

export async function getUserUploads(userId: number): Promise<Upload[]> {
  return sbSelect<Upload>("uploads", `userId=eq.${userId}&order=createdAt.desc`);
}

export async function updateUploadStatus(
  id: number, status: "pending" | "processing" | "completed" | "failed", errorMessage?: string
): Promise<void> {
  await sbUpdate("uploads", `id=eq.${id}`, { status, errorMessage, updatedAt: new Date().toISOString() });
}

export async function updateUploadRowCount(id: number, rowCount: number): Promise<void> {
  await sbUpdate("uploads", `id=eq.${id}`, { rowCount, updatedAt: new Date().toISOString() });
}

// ── Suppliers ──────────────────────────────────────────────────────────────

export async function createSupplier(supplier: {
  userId: number; name: string; email?: string; sectorId: number;
  tier: "1" | "2" | "3"; hsCode: string; quantity: number | string;
  unit: string; co2eEmission?: number | string;
}): Promise<Supplier> {
  return sbInsert<Supplier>("suppliers", {
    ...supplier,
    quantity: String(supplier.quantity),
    co2eEmission: supplier.co2eEmission !== undefined ? String(supplier.co2eEmission) : null,
  });
}

export async function getUserSuppliers(userId: number): Promise<Supplier[]> {
  return sbSelect<Supplier>("suppliers", `userId=eq.${userId}&order=createdAt.desc`);
}

export async function getSupplierById(id: number): Promise<Supplier | undefined> {
  const rows = await sbSelect<Supplier>("suppliers", `id=eq.${id}&limit=1`);
  return rows[0];
}

export async function updateSupplier(id: number, updates: Partial<Supplier>): Promise<void> {
  await sbUpdate("suppliers", `id=eq.${id}`, { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteSupplier(id: number): Promise<void> {
  await sbDelete("suppliers", `id=eq.${id}`);
}

// ── Scores ─────────────────────────────────────────────────────────────────

export async function createScore(score: {
  userId: number; uploadId?: number; supplierId?: number; sectorId: number;
  emissionScore: string | number; responsibilityScore: string | number;
  supplyChainScore: string | number; compositeScore: string | number;
  scoreRating: "red" | "yellow" | "green"; metadata?: Record<string, unknown>;
}): Promise<Score> {
  return sbInsert<Score>("scores", {
    ...score,
    emissionScore: String(score.emissionScore),
    responsibilityScore: String(score.responsibilityScore),
    supplyChainScore: String(score.supplyChainScore),
    compositeScore: String(score.compositeScore),
  });
}

export async function getScoresByUpload(uploadId: number): Promise<Score[]> {
  return sbSelect<Score>("scores", `uploadId=eq.${uploadId}`);
}

export async function getScoresBySupplier(supplierId: number): Promise<Score[]> {
  return sbSelect<Score>("scores", `supplierId=eq.${supplierId}`);
}

// ── Reports ────────────────────────────────────────────────────────────────

export async function createReport(report: {
  userId: number; uploadId?: number; title: string;
  format: "pdf" | "xml" | "json"; fileKey: string; fileUrl?: string;
}): Promise<Report> {
  return sbInsert<Report>("reports", report);
}

export async function getUserReports(userId: number): Promise<Report[]> {
  return sbSelect<Report>("reports", `userId=eq.${userId}&order=createdAt.desc`);
}

// ── Validation Logs ────────────────────────────────────────────────────────

export async function createValidationLog(log: {
  userId: number; uploadId?: number; rowIndex?: number;
  errorType: string; errorMessage: string; suggestedFix?: string;
}): Promise<ValidationLog> {
  return sbInsert<ValidationLog>("validationLogs", log);
}

export async function getValidationLogsByUpload(uploadId: number): Promise<ValidationLog[]> {
  return sbSelect<ValidationLog>("validationLogs", `uploadId=eq.${uploadId}`);
}
