import { z } from "zod";
import { nanoid } from "nanoid";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createSupplier,
  getUserSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  getAllSectors,
  getSectorInputsBySector,
  createScore,
  getScoresBySupplier,
} from "../db";
import { calculateScore3 } from "../score3-engine";

export const suppliersRouter = router({
  // Get all sectors with inputs
  getSectors: protectedProcedure.query(async () => {
    const sectors = await getAllSectors();
    const sectorList = [];

    for (const sector of sectors) {
      const inputs = await getSectorInputsBySector(sector.id);
      sectorList.push({
        id: sector.id,
        code: sector.code,
        nameEn: sector.nameEn,
        nameTr: sector.nameTr,
        category: sector.category,
        hsCodes: sector.hsCodes,
        inputs: inputs.map((i) => ({
          id: i.id,
          nameEn: i.nameEn,
          nameTr: i.nameTr,
          hsCode: i.hsCode,
        })),
      });
    }

    return sectorList;
  }),

  // Create supplier
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        sectorId: z.number(),
        tier: z.enum(["1", "2", "3"]),
        hsCode: z.string(),
        quantity: z.number().positive(),
        unit: z.string(),
        co2eEmission: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supplier = await createSupplier({
        userId: ctx.user.id,
        name: input.name,
        email: input.email,
        sectorId: input.sectorId,
        tier: input.tier,
        hsCode: input.hsCode,
        quantity: input.quantity,
        unit: input.unit,
        co2eEmission: input.co2eEmission,
      });

      return {
        id: supplier.id,
        name: supplier.name,
        tier: supplier.tier,
        sectorId: supplier.sectorId,
        createdAt: supplier.createdAt,
      };
    }),

  // Get user's suppliers
  list: protectedProcedure.query(async ({ ctx }) => {
    const suppliers = await getUserSuppliers(ctx.user.id);
    return suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      sectorId: s.sectorId,
      tier: s.tier,
      hsCode: s.hsCode,
      quantity: s.quantity,
      unit: s.unit,
      co2eEmission: s.co2eEmission,
      createdAt: s.createdAt,
    }));
  }),

  // Get supplier by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const supplier = await getSupplierById(input.id);
      if (!supplier || supplier.userId !== ctx.user.id) {
        throw new Error("Supplier not found");
      }

      // Get supplier's scores
      const scores = await getScoresBySupplier(input.id);

      return {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        sectorId: supplier.sectorId,
        tier: supplier.tier,
        hsCode: supplier.hsCode,
        quantity: supplier.quantity,
        unit: supplier.unit,
        co2eEmission: supplier.co2eEmission,
        scores: scores.map((s) => ({
          id: s.id,
          compositeScore: s.compositeScore,
          scoreRating: s.scoreRating,
          emissionScore: s.emissionScore,
          responsibilityScore: s.responsibilityScore,
          supplyChainScore: s.supplyChainScore,
        })),
        createdAt: supplier.createdAt,
      };
    }),

  // Update supplier
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        quantity: z.number().positive().optional(),
        unit: z.string().optional(),
        co2eEmission: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supplier = await getSupplierById(input.id);
      if (!supplier || supplier.userId !== ctx.user.id) {
        throw new Error("Supplier not found");
      }

      const updates: Record<string, any> = {};
      if (input.name) updates.name = input.name;
      if (input.email) updates.email = input.email;
      if (input.quantity) updates.quantity = String(input.quantity);
      if (input.unit) updates.unit = input.unit;
      if (input.co2eEmission) updates.co2eEmission = String(input.co2eEmission);

      await updateSupplier(input.id, updates);

      return { success: true };
    }),

  // Delete supplier
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const supplier = await getSupplierById(input.id);
      if (!supplier || supplier.userId !== ctx.user.id) {
        throw new Error("Supplier not found");
      }

      await deleteSupplier(input.id);
      return { success: true };
    }),

  // Calculate supplier score
  calculateScore: protectedProcedure
    .input(
      z.object({
        supplierId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supplier = await getSupplierById(input.supplierId);
      if (!supplier || supplier.userId !== ctx.user.id) {
        throw new Error("Supplier not found");
      }

      // Create a single row for score calculation
      const row = {
        hsCode: supplier.hsCode,
        quantity: parseFloat(supplier.quantity),
        unit: supplier.unit,
        tier: supplier.tier as "1" | "2" | "3",
        supplierId: supplier.id.toString(),
      };

      const score3 = await calculateScore3([row], supplier.sectorId);

      const scoreRecord = await createScore({
        userId: ctx.user.id,
        supplierId: input.supplierId,
        sectorId: supplier.sectorId,
        emissionScore: score3.emissionScore,
        responsibilityScore: score3.responsibilityScore,
        supplyChainScore: score3.supplyChainScore,
        compositeScore: score3.compositeScore,
        scoreRating: score3.scoreRating,
        metadata: score3.details,
      });

      return {
        id: scoreRecord.id,
        compositeScore: scoreRecord.compositeScore,
        scoreRating: scoreRecord.scoreRating,
        emissionScore: scoreRecord.emissionScore,
        responsibilityScore: scoreRecord.responsibilityScore,
        supplyChainScore: scoreRecord.supplyChainScore,
      };
    }),

  // Invite supplier via email
  invite: protectedProcedure
    .input(z.object({ supplierId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const supplier = await getSupplierById(input.supplierId);
      if (!supplier || supplier.userId !== ctx.user.id) {
        throw new Error("Tedarikçi bulunamadı");
      }
      if (!supplier.email) {
        throw new Error("Tedarikçiye ait e-posta adresi yok");
      }

      const token = nanoid(32);
      await updateSupplier(input.supplierId, {
        invitationToken: token,
        invitationSentAt: new Date(),
      });

      // In production, send actual email here via SendGrid/SES/etc.
      // For MVP, we return the invite link so the user can share manually.
      const inviteUrl = `${ctx.req.headers.origin || "https://nocarbontr.com"}/supplier-portal?token=${token}`;

      console.log(`[Invite] Supplier: ${supplier.name} <${supplier.email}> → ${inviteUrl}`);

      return {
        success: true,
        inviteUrl,
        email: supplier.email,
      };
    }),
});
