import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { protectedProcedure, router } from "../_core/trpc";
import { sbSelect, sbInsert, sbUpdate } from "../supabaseClient";
import { CBAM_SECTORS, calculateCbamEmissions, type CbamSectorCode } from "../cbamSectors";
import type { User, Supplier, Score } from "../db";

// ── Types ──────────────────────────────────────────────────────────────────

type CbamScore = Score & { submissionStatus: string; cbamData: Record<string, unknown> | null };
type CbamSupplier = Supplier & { sectorType: string | null; onboardingStatus: string; importerId: number | null };

// ── Router ─────────────────────────────────────────────────────────────────

export const cbamRouter = router({

  // Get CBAM sector definitions
  getSectors: protectedProcedure.query(() => {
    return CBAM_SECTORS.map(s => ({
      code: s.code,
      nameTr: s.nameTr,
      nameEn: s.nameEn,
      icon: s.icon,
      cnCodes: s.cnCodes,
      defaultEmissionFactor: s.defaultEmissionFactor,
      metrics: s.metrics,
    }));
  }),

  // Onboard supplier (importer creates supplier account)
  onboardSupplier: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      sectorCode: z.enum(['steel','aluminium','cement','fertilizer','electricity','hydrogen']),
      tier: z.enum(['1','2','3']),
      companyName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check email not already used
      const existing = await sbSelect<User>('users', `email=eq.${encodeURIComponent(input.email)}&limit=1`);
      if (existing.length > 0) {
        throw new Error('Bu e-posta adresi zaten kayıtlı');
      }

      // Generate temp password
      const tempPassword = nanoid(10);
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      // Create supplier user account
      const supplierUser = await sbInsert<User>('users', {
        openId: input.email,
        email: input.email,
        name: input.name,
        passwordHash,
        loginMethod: 'email',
        role: 'supplier',
        lastSignedIn: new Date().toISOString(),
      });

      // Create supplier record linked to importer
      const cnCodes = CBAM_SECTORS.find(s => s.code === input.sectorCode)?.cnCodes ?? [];
      const supplier = await sbInsert<CbamSupplier>('suppliers', {
        userId: supplierUser.id,
        importerId: ctx.user.id,
        name: input.name,
        email: input.email,
        sectorId: 1, // fallback
        sectorType: input.sectorCode,
        tier: input.tier,
        hsCode: cnCodes[0] ?? '',
        quantity: '0',
        unit: 'ton',
        onboardingStatus: 'active',
      });

      return {
        supplierId: supplier.id,
        supplierUserId: supplierUser.id,
        email: input.email,
        tempPassword,
        message: 'Tedarikçi hesabı oluşturuldu. Geçici şifreyi güvenli şekilde paylaşın.',
      };
    }),

  // Get importer's suppliers
  getMySuppliers: protectedProcedure.query(async ({ ctx }) => {
    const suppliers = await sbSelect<CbamSupplier>(
      'suppliers',
      `importerId=eq.${ctx.user.id}&order=createdAt.desc`
    );
    return suppliers.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      sectorType: s.sectorType,
      tier: s.tier,
      onboardingStatus: s.onboardingStatus,
      createdAt: s.createdAt,
    }));
  }),

  // Submit CBAM data (supplier submits their emissions data)
  submitData: protectedProcedure
    .input(z.object({
      sectorCode: z.enum(['steel','aluminium','cement','fertilizer','electricity','hydrogen']),
      reportingYear: z.number().int().min(2023).max(2030),
      cbamData: z.record(z.union([z.number(), z.string()])),
    }))
    .mutation(async ({ ctx, input }) => {
      // Find supplier record for this user
      const suppliers = await sbSelect<CbamSupplier>(
        'suppliers',
        `userId=eq.${ctx.user.id}&limit=1`
      );
      const supplier = suppliers[0];
      if (!supplier) throw new Error('Tedarikçi kaydı bulunamadı');

      // Calculate emissions
      const emissions = calculateCbamEmissions(input.sectorCode as CbamSectorCode, input.cbamData);

      // Create score record with pending_review status
      const score = await sbInsert<CbamScore>('scores', {
        userId: ctx.user.id,
        supplierId: supplier.id,
        sectorId: 1,
        emissionScore: String(Math.round(emissions.intensity * 10)),
        responsibilityScore: '50',
        supplyChainScore: '50',
        compositeScore: String(Math.round(emissions.intensity * 10)),
        scoreRating: emissions.intensity < 2 ? 'green' : emissions.intensity < 5 ? 'yellow' : 'red',
        submissionStatus: 'pending_review',
        cbamData: {
          ...input.cbamData,
          sectorCode: input.sectorCode,
          reportingYear: input.reportingYear,
          totalCO2e: emissions.totalCO2e,
          intensity: emissions.intensity,
          breakdown: emissions.breakdown,
        },
      });

      return {
        scoreId: score.id,
        totalCO2e: emissions.totalCO2e,
        intensity: emissions.intensity,
        status: 'pending_review',
        message: 'Verileriniz inceleme kuyruğuna gönderildi.',
      };
    }),

  // Get review queue (importer sees pending submissions)
  getReviewQueue: protectedProcedure.query(async ({ ctx }) => {
    // Get importer's suppliers
    const suppliers = await sbSelect<CbamSupplier>(
      'suppliers',
      `importerId=eq.${ctx.user.id}&select=id,name,email,sectorType`
    );
    if (suppliers.length === 0) return [];

    const supplierIds = suppliers.map(s => s.id);
    const idList = `(${supplierIds.join(',')})`;

    const pendingScores = await sbSelect<CbamScore>(
      'scores',
      `supplierId=in.${idList}&submissionStatus=eq.pending_review&order=createdAt.desc`
    );

    return pendingScores.map(score => {
      const supplier = suppliers.find(s => s.id === score.supplierId);
      return {
        scoreId: score.id,
        supplierId: score.supplierId,
        supplierName: supplier?.name ?? 'Bilinmiyor',
        supplierEmail: supplier?.email ?? '',
        sectorCode: (score.cbamData as any)?.sectorCode ?? supplier?.sectorType ?? '',
        reportingYear: (score.cbamData as any)?.reportingYear ?? new Date().getFullYear(),
        totalCO2e: (score.cbamData as any)?.totalCO2e ?? 0,
        intensity: (score.cbamData as any)?.intensity ?? 0,
        scoreRating: score.scoreRating,
        cbamData: score.cbamData,
        submittedAt: score.createdAt,
      };
    });
  }),

  // Approve/reject submission
  reviewSubmission: protectedProcedure
    .input(z.object({
      scoreId: z.number(),
      action: z.enum(['approved','rejected']),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const scores = await sbSelect<CbamScore>('scores', `id=eq.${input.scoreId}&limit=1`);
      const score = scores[0];
      if (!score) throw new Error('Veri bulunamadı');

      // Verify importer owns this supplier
      const suppliers = await sbSelect<CbamSupplier>(
        'suppliers',
        `id=eq.${score.supplierId}&importerId=eq.${ctx.user.id}&limit=1`
      );
      if (suppliers.length === 0) throw new Error('Yetki hatası');

      await sbUpdate('scores', `id=eq.${input.scoreId}`, {
        submissionStatus: input.action,
        reviewNote: input.note ?? null,
        reviewedAt: new Date().toISOString(),
        reviewedBy: ctx.user.id,
      });

      return { success: true, action: input.action };
    }),

  // Add approved score to annual report
  addToAnnualReport: protectedProcedure
    .input(z.object({
      scoreId: z.number(),
      year: z.number().int().min(2023).max(2030),
    }))
    .mutation(async ({ ctx, input }) => {
      const scores = await sbSelect<CbamScore>('scores', `id=eq.${input.scoreId}&limit=1`);
      const score = scores[0];
      if (!score || score.submissionStatus !== 'approved') {
        throw new Error('Sadece onaylı veriler rapora eklenebilir');
      }

      // Get or create annual report
      type AnnualReport = { id: number; reportData: Record<string, unknown>; totalCO2e: number };
      const existing = await sbSelect<AnnualReport>(
        'cbamAnnualReport',
        `userId=eq.${ctx.user.id}&year=eq.${input.year}&limit=1`
      );

      const cbamData = score.cbamData as Record<string, unknown>;
      const scoreCO2e = Number(cbamData?.totalCO2e ?? 0);

      if (existing.length > 0) {
        const report = existing[0];
        const entries = ((report.reportData as any)?.entries ?? []) as unknown[];
        entries.push({ scoreId: score.id, ...cbamData });
        await sbUpdate('cbamAnnualReport', `id=eq.${report.id}`, {
          reportData: { entries },
          totalCO2e: Number(report.totalCO2e) + scoreCO2e,
          updatedAt: new Date().toISOString(),
        });
        return { reportId: report.id, appended: true };
      } else {
        const report = await sbInsert<AnnualReport>('cbamAnnualReport', {
          userId: ctx.user.id,
          year: input.year,
          title: `CBAM Yıllık Rapor ${input.year}`,
          reportData: { entries: [{ scoreId: score.id, ...cbamData }] },
          totalCO2e: scoreCO2e,
        });
        return { reportId: report.id, appended: false };
      }
    }),

  // Get annual reports
  getAnnualReports: protectedProcedure.query(async ({ ctx }) => {
    type AnnualReport = { id: number; year: number; title: string; totalCO2e: number; status: string; createdAt: string };
    return sbSelect<AnnualReport>(
      'cbamAnnualReport',
      `userId=eq.${ctx.user.id}&order=year.desc`
    );
  }),

  // Supplier: get own submission history
  getMySubmissions: protectedProcedure.query(async ({ ctx }) => {
    const scores = await sbSelect<CbamScore>(
      'scores',
      `userId=eq.${ctx.user.id}&order=createdAt.desc`
    );
    return scores.map(s => ({
      id: s.id,
      sectorCode: (s.cbamData as any)?.sectorCode ?? '',
      reportingYear: (s.cbamData as any)?.reportingYear ?? '',
      totalCO2e: (s.cbamData as any)?.totalCO2e ?? 0,
      intensity: (s.cbamData as any)?.intensity ?? 0,
      submissionStatus: s.submissionStatus,
      reviewNote: (s as any).reviewNote ?? null,
      createdAt: s.createdAt,
    }));
  }),
});
