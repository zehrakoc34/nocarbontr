import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createUpload,
  getUploadById,
  getUserUploads,
  updateUploadStatus,
  createScore,
  createValidationLog,
} from "../db";
import { calculateScore3, parseUploadData } from "../score3-engine";
import { storagePut } from "../storage";

export const uploadsRouter = router({
  // Create and process upload
  create: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded file
        fileSize: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Store file
        const buffer = Buffer.from(input.fileData, "base64");
        const fileKey = `uploads/${ctx.user.id}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, "application/octet-stream");

        // Create upload record
        const upload = await createUpload({
          userId: ctx.user.id,
          fileName: input.fileName,
          fileKey,
          fileSize: input.fileSize,
          rowCount: 0,
        });

        return {
          id: upload.id,
          fileName: upload.fileName,
          status: upload.status,
          fileUrl: url,
        };
      } catch (error) {
        throw new Error(`Failed to create upload: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  // Get user's uploads
  list: protectedProcedure.query(async ({ ctx }) => {
    const uploads = await getUserUploads(ctx.user.id);
    return uploads.map((u) => ({
      id: u.id,
      fileName: u.fileName,
      status: u.status,
      rowCount: u.rowCount,
      fileSize: u.fileSize,
      createdAt: u.createdAt,
      errorMessage: u.errorMessage,
    }));
  }),

  // Get upload by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const upload = await getUploadById(input.id);
      if (!upload || upload.userId !== ctx.user.id) {
        throw new Error("Upload not found");
      }
      return upload;
    }),

  // Process upload and calculate scores
  process: protectedProcedure
    .input(
      z.object({
        uploadId: z.number(),
        data: z.array(
          z.object({
            hsCode: z.string(),
            quantity: z.number(),
            unit: z.string(),
            supplierId: z.string().optional(),
            tier: z.enum(["1", "2", "3"]).optional(),
            sectorId: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const upload = await getUploadById(input.uploadId);
        if (!upload || upload.userId !== ctx.user.id) {
          throw new Error("Upload not found");
        }

        // Parse and validate data
        const { rows, errors } = parseUploadData(input.data);

        // Store validation errors
        for (const error of errors) {
          await createValidationLog({
            userId: ctx.user.id,
            uploadId: input.uploadId,
            rowIndex: error.rowIndex,
            errorType: "validation_error",
            errorMessage: error.error,
          });
        }

        // Group rows by sector and calculate scores
        const sectorMap = new Map<number, typeof rows>();
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const sectorId = input.data[i]?.sectorId;
          if (!sectorId) continue;

          if (!sectorMap.has(sectorId)) {
            sectorMap.set(sectorId, []);
          }
          sectorMap.get(sectorId)!.push(row);
        }

        // Calculate scores for each sector
        const scores = [];
        const sectorEntries = Array.from(sectorMap.entries());
        for (const [sectorId, sectorRows] of sectorEntries) {
          const score3 = await calculateScore3(sectorRows, sectorId);

          const scoreRecord = await createScore({
            userId: ctx.user.id,
            uploadId: input.uploadId,
            sectorId,
            emissionScore: score3.emissionScore,
            responsibilityScore: score3.responsibilityScore,
            supplyChainScore: score3.supplyChainScore,
            compositeScore: score3.compositeScore,
            scoreRating: score3.scoreRating,
            metadata: score3.details,
          });

          scores.push(scoreRecord);
        }

        // Update upload status
        await updateUploadStatus(input.uploadId, "completed");

        return {
          uploadId: input.uploadId,
          rowCount: rows.length,
          errorCount: errors.length,
          scoreCount: scores.length,
          scores: scores.map((s) => ({
            id: s.id,
            sectorId: s.sectorId,
            compositeScore: s.compositeScore,
            scoreRating: s.scoreRating,
          })),
        };
      } catch (error) {
        await updateUploadStatus(
          input.uploadId,
          "failed",
          error instanceof Error ? error.message : "Unknown error"
        );
        throw error;
      }
    }),
});
