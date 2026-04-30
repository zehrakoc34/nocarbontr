"use server";

import { createClient } from "./server";

// ─── Supplier: Kendi org'unu ve emisyonlarını çek ─────────────
export async function getSupplierDashboardData(orgId: string) {
  const supabase = await createClient();

  const [emissionsRes, trustRes, connectionsRes] = await Promise.all([
    supabase
      .from("emission_data")
      .select("id, sector, year, emissions_ton_co2, data_source, created_at")
      .eq("supplier_id", orgId)
      .order("created_at", { ascending: false })
      .limit(20),

    supabase
      .from("trust_scores")
      .select("score, evidence_score, continuity_score, benchmark_score, last_calculated_at")
      .eq("supplier_id", orgId)
      .maybeSingle(),

    supabase
      .from("network_connections")
      .select("id, status, company_id")
      .eq("supplier_id", orgId)
      .eq("status", "ACTIVE"),
  ]);

  const emissions = emissionsRes.data ?? [];
  const trust = trustRes.data;
  const connections = connectionsRes.data ?? [];

  // Toplam emisyon (son yıl)
  const currentYear = new Date().getFullYear();
  const totalEmissions = emissions
    .filter((e) => e.year === currentYear || e.year === 2026)
    .reduce((sum, e) => sum + Number(e.emissions_ton_co2), 0);

  // Sektör bazlı özet
  const bySector: Record<string, number> = {};
  for (const e of emissions) {
    bySector[e.sector] = (bySector[e.sector] ?? 0) + Number(e.emissions_ton_co2);
  }

  return {
    totalEmissions,
    trustScore: trust?.score ?? 0,
    connectedCompanies: connections.length,
    emissions,
    bySector,
  };
}

// ─── Corporate: Bağlı tedarikçilerinin verilerini çek ─────────
export async function getCorporateDashboardData(orgId: string) {
  const supabase = await createClient();

  // Tüm bağlantılı tedarikçiler (aktif veya bekleyen)
  const { data: connections } = await supabase
    .from("network_connections")
    .select("supplier_id, status")
    .eq("company_id", orgId);

  const activeConnections = (connections ?? []).filter((c) => c.status === "ACTIVE");
  const supplierIds = (connections ?? []).map((c) => c.supplier_id);

  if (supplierIds.length === 0) {
    return {
      totalEmissions: 0,
      avgTrustScore: 0,
      activeSuppliers: 0,
      supplierCount: 0,
      emissionsBySector: [],
      topSuppliers: [],
      pendingConnections: 0,
    };
  }

  const [emissionsRes, trustRes, pendingRes] = await Promise.all([
    supabase
      .from("emission_data")
      .select("supplier_id, sector, year, emissions_ton_co2")
      .in("supplier_id", supplierIds)
      .eq("year", 2026),

    supabase
      .from("trust_scores")
      .select("supplier_id, score")
      .in("supplier_id", supplierIds),

    supabase
      .from("emission_data")
      .select("id")
      .in("supplier_id", supplierIds)
      .eq("status", "SUBMITTED"),
  ]);

  const emissions = emissionsRes.data ?? [];
  const trustScores = trustRes.data ?? [];
  const pendingConnections = pendingRes.data?.length ?? 0;

  // Toplam emisyon
  const totalEmissions = emissions.reduce(
    (sum, e) => sum + Number(e.emissions_ton_co2),
    0
  );

  // Ortalama güven skoru
  const avgTrustScore =
    trustScores.length > 0
      ? trustScores.reduce((sum, t) => sum + t.score, 0) / trustScores.length
      : 0;

  // Sektör bazlı emisyon özeti
  const sectorMap: Record<string, number> = {};
  for (const e of emissions) {
    sectorMap[e.sector] = (sectorMap[e.sector] ?? 0) + Number(e.emissions_ton_co2);
  }
  const emissionsBySector = Object.entries(sectorMap)
    .map(([sector, total]) => ({ sector, total }))
    .sort((a, b) => b.total - a.total);

  // Tedarikçi güven skorları ile birleşik liste
  const trustMap = Object.fromEntries(trustScores.map((t) => [t.supplier_id, t.score]));

  // Her tedarikçinin toplam emisyonu
  const supplierEmissionMap: Record<string, number> = {};
  for (const e of emissions) {
    supplierEmissionMap[e.supplier_id] =
      (supplierEmissionMap[e.supplier_id] ?? 0) + Number(e.emissions_ton_co2);
  }

  // Org adlarını çek
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, tax_id")
    .in("id", supplierIds);

  const topSuppliers = (orgs ?? []).map((org) => ({
    id: org.id,
    name: org.name,
    trustScore: trustMap[org.id] ?? 0,
    totalEmissions: supplierEmissionMap[org.id] ?? 0,
  })).sort((a, b) => b.totalEmissions - a.totalEmissions);

  return {
    totalEmissions,
    avgTrustScore: Math.round(avgTrustScore),
    activeSuppliers: activeConnections.length,
    supplierCount: supplierIds.length,
    emissionsBySector,
    topSuppliers,
    pendingConnections,
  };
}

// ─── Corporate: Tedarikçi ağı listesi ─────────────────────────
export async function getSupplierNetwork(orgId: string) {
  const supabase = await createClient();

  const { data: connections } = await supabase
    .from("network_connections")
    .select("id, supplier_id, status, created_at")
    .eq("company_id", orgId)
    .order("created_at", { ascending: false });

  if (!connections || connections.length === 0) return [];

  const supplierIds = connections.map((c) => c.supplier_id);

  const [orgsRes, trustRes, emissionsRes] = await Promise.all([
    supabase.from("organizations").select("id, name, tax_id, type").in("id", supplierIds),
    supabase.from("trust_scores").select("supplier_id, score").in("supplier_id", supplierIds),
    supabase
      .from("emission_data")
      .select("supplier_id, sector, emissions_ton_co2")
      .in("supplier_id", supplierIds)
      .eq("year", 2026),
  ]);

  const orgMap = Object.fromEntries((orgsRes.data ?? []).map((o) => [o.id, o]));
  const trustMap = Object.fromEntries((trustRes.data ?? []).map((t) => [t.supplier_id, t.score]));
  const emissionSumMap: Record<string, number> = {};
  for (const e of emissionsRes.data ?? []) {
    emissionSumMap[e.supplier_id] =
      (emissionSumMap[e.supplier_id] ?? 0) + Number(e.emissions_ton_co2);
  }

  return connections.map((c) => ({
    connectionId: c.id,
    supplierId: c.supplier_id,
    name: orgMap[c.supplier_id]?.name ?? "—",
    taxId: orgMap[c.supplier_id]?.tax_id ?? "—",
    status: c.status,
    trustScore: trustMap[c.supplier_id] ?? 0,
    totalEmissions: emissionSumMap[c.supplier_id] ?? 0,
    joinedAt: c.created_at,
  }));
}

// ─── Corporate: CBAM Raporları listesi ───────────────────────
export async function getCorporateReports(orgId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cbam_reports")
    .select("id, reporting_period, year, status, created_at, updated_at, submitted_at")
    .eq("org_id", orgId)
    .order("year", { ascending: false })
    .order("reporting_period", { ascending: false });

  return data ?? [];
}

// ─── Supplier: Tesisler ───────────────────────────────────────
export async function getInstallations(orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("installations")
    .select("*")
    .eq("supplier_id", orgId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// ─── Supplier: Kanıt belgeleri ────────────────────────────────
export async function getEvidenceFiles(orgId: string) {
  const supabase = await createClient();
  const { data: emissions } = await supabase
    .from("emission_data")
    .select("id, sector, year")
    .eq("supplier_id", orgId);

  if (!emissions || emissions.length === 0) return [];

  const emissionIds = emissions.map((e) => e.id);
  const { data: evidence } = await supabase
    .from("evidence_vault")
    .select("id, report_id, file_url, verification_hash, upload_date")
    .in("report_id", emissionIds)
    .order("upload_date", { ascending: false });

  const emissionMap = Object.fromEntries(emissions.map((e) => [e.id, e]));

  return (evidence ?? []).map((ev) => ({
    ...ev,
    emission: emissionMap[ev.report_id],
  }));
}
