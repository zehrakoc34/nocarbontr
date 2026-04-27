import { z } from "zod";
import { ZodType } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createReport, getUserReports, getUploadById } from "../db";
import {
  prepareReportData,
  generateXMLReport,
  generatePDFReportHTML,
  generateJSONReport,
} from "../cbam-report-engine";
import { storagePut } from "../storage";
import { invokeLLM } from "../_core/llm";

export const reportsRouter = router({
  // Generate report
  generate: protectedProcedure
    .input(
      z.object({
        uploadId: z.number(),
        format: z.enum(["pdf", "xml", "json"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify upload belongs to user
        const upload = await getUploadById(input.uploadId);
        if (!upload || upload.userId !== ctx.user.id) {
          throw new Error("Upload not found");
        }

        // Prepare report data
        const reportData = await prepareReportData(input.uploadId, ctx.user.id);

        // Generate report content based on format
        let content: string;
        let mimeType: string;

        if (input.format === "xml") {
          content = await generateXMLReport(reportData);
          mimeType = "application/xml";
        } else if (input.format === "json") {
          content = await generateJSONReport(reportData);
          mimeType = "application/json";
        } else {
          // PDF format - use HTML
          content = await generatePDFReportHTML(reportData);
          mimeType = "text/html";
        }

        // Store report file
        const fileName = `cbam-report-${input.uploadId}-${Date.now()}.${input.format}`;
        const fileKey = `reports/${ctx.user.id}/${fileName}`;
        const buffer = Buffer.from(content, "utf-8");
        const { url } = await storagePut(fileKey, buffer, mimeType || "text/plain");

        // Create report record
        const report = await createReport({
          userId: ctx.user.id,
          uploadId: input.uploadId,
          title: `CBAM Report - ${new Date().toLocaleDateString()}`,
          format: input.format,
          fileKey,
          fileUrl: url,
        });

        return {
          id: report.id,
          format: report.format,
          fileUrl: url,
          createdAt: report.createdAt,
        };
      } catch (error) {
        throw new Error(
          `Failed to generate report: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  // Get user's reports
  list: protectedProcedure.query(async ({ ctx }) => {
    const reports = await getUserReports(ctx.user.id);
    return reports.map((r) => ({
      id: r.id,
      uploadId: r.uploadId,
      title: r.title,
      format: r.format,
      fileUrl: r.fileUrl,
      status: r.status,
      createdAt: r.createdAt,
    }));
  }),

  // Validate report data with LLM
  validateData: protectedProcedure
    .input(
      z.object({
        uploadId: z.number(),
        data: z.array(z.record(z.string(), z.any())),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify upload belongs to user
        const upload = await getUploadById(input.uploadId);
        if (!upload || upload.userId !== ctx.user.id) {
          throw new Error("Upload not found");
        }

        // Prepare data for LLM validation
        const dataString = JSON.stringify(input.data.slice(0, 10)); // First 10 rows

        // Call LLM for validation
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are an expert in CBAM (Carbon Border Adjustment Mechanism) and supply chain data validation. Analyze the provided data and identify any errors, missing fields, or inconsistencies.",
            },
            {
              role: "user",
              content: `Please validate the following supply chain data for CBAM compliance:\n\n${dataString}\n\nProvide a JSON response with the following structure:\n{\n  "isValid": boolean,\n  "errors": [{"field": string, "message": string}],\n  "warnings": [{"field": string, "message": string}],\n  "suggestions": [string]\n}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "validation_result",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  isValid: { type: "boolean" },
                  errors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string" },
                        message: { type: "string" },
                      },
                      required: ["field", "message"],
                    },
                  },
                  warnings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string" },
                        message: { type: "string" },
                      },
                      required: ["field", "message"],
                    },
                  },
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["isValid", "errors", "warnings", "suggestions"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message.content;
        if (!content) {
          throw new Error("Invalid LLM response");
        }

        const contentStr = typeof content === "string" ? content : JSON.stringify(content);
        const validationResult = JSON.parse(contentStr);

        return {
          isValid: validationResult.isValid,
          errors: validationResult.errors || [],
          warnings: validationResult.warnings || [],
          suggestions: validationResult.suggestions || [],
        };
      } catch (error) {
        throw new Error(
          `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  // Predict missing emissions data using LLM
  predictEmissions: protectedProcedure
    .input(
      z.object({
        hsCode: z.string(),
        quantity: z.number(),
        unit: z.string(),
        sectorName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are an expert in carbon emissions estimation for supply chain products. Based on the provided product information, estimate the CO2e emissions.",
            },
            {
              role: "user",
              content: `Estimate CO2e emissions for the following product:\nHS Code: ${input.hsCode}\nQuantity: ${input.quantity} ${input.unit}\nSector: ${input.sectorName}\n\nProvide a JSON response with the following structure:\n{\n  "estimatedCO2e": number,\n  "unit": "kg",\n  "confidence": number (0-1),\n  "reasoning": string\n}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "emission_prediction",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  estimatedCO2e: { type: "number" },
                  unit: { type: "string" },
                  confidence: { type: "number", minimum: 0, maximum: 1 },
                  reasoning: { type: "string" },
                },
                required: ["estimatedCO2e", "unit", "confidence", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message.content;
        if (!content) {
          throw new Error("Invalid LLM response");
        }

        const contentStr = typeof content === "string" ? content : JSON.stringify(content);
        const prediction = JSON.parse(contentStr);

        return {
          estimatedCO2e: prediction.estimatedCO2e,
          unit: prediction.unit,
          confidence: prediction.confidence,
          reasoning: prediction.reasoning,
        };
      } catch (error) {
        throw new Error(
          `Prediction failed: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
