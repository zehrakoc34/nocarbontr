/**
 * CBAM Report Generation Engine
 * Generates PDF and XML reports for CBAM compliance
 */

import { Score } from "./db";
import { getUploadById, getSectorById, getScoresByUpload } from "./db";

export interface CBamReportData {
  uploadId: number;
  userId: number;
  generatedAt: Date;
  scores: Array<{
    id: number;
    sectorId: number;
    sectorName: string;
    emissionScore: number;
    responsibilityScore: number;
    supplyChainScore: number;
    compositeScore: number;
    scoreRating: string;
  }>;
  summary: {
    totalRows: number;
    averageCompositeScore: number;
    overallRating: string;
    totalEmissions: number;
  };
}

/**
 * Generate CBAM XML Report
 */
export async function generateXMLReport(reportData: CBamReportData): Promise<string> {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<CBamReport>
  <Header>
    <ReportId>${reportData.uploadId}-${Date.now()}</ReportId>
    <GeneratedAt>${reportData.generatedAt.toISOString()}</GeneratedAt>
    <UserId>${reportData.userId}</UserId>
  </Header>
  <Summary>
    <TotalRows>${reportData.summary.totalRows}</TotalRows>
    <AverageCompositeScore>${reportData.summary.averageCompositeScore.toFixed(2)}</AverageCompositeScore>
    <OverallRating>${reportData.summary.overallRating}</OverallRating>
    <TotalEmissions>${reportData.summary.totalEmissions.toFixed(2)}</TotalEmissions>
  </Summary>
  <Scores>
    ${reportData.scores
      .map(
        (score) => `
    <Score>
      <ScoreId>${score.id}</ScoreId>
      <SectorId>${score.sectorId}</SectorId>
      <SectorName>${escapeXml(score.sectorName)}</SectorName>
      <EmissionScore>${score.emissionScore.toFixed(2)}</EmissionScore>
      <ResponsibilityScore>${score.responsibilityScore.toFixed(2)}</ResponsibilityScore>
      <SupplyChainScore>${score.supplyChainScore.toFixed(2)}</SupplyChainScore>
      <CompositeScore>${score.compositeScore.toFixed(2)}</CompositeScore>
      <ScoreRating>${score.scoreRating}</ScoreRating>
    </Score>
    `
      )
      .join("")}
  </Scores>
</CBamReport>`;

  return xml;
}

/**
 * Generate CBAM PDF Report (HTML-based)
 */
export async function generatePDFReportHTML(reportData: CBamReportData): Promise<string> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CBAM Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #333;
    }
    .header {
      border-bottom: 2px solid #10b981;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #10b981;
      margin: 0;
    }
    .summary {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .summary-item {
      background: white;
      padding: 15px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .summary-item label {
      font-weight: bold;
      color: #6b7280;
      display: block;
      margin-bottom: 5px;
    }
    .summary-item value {
      font-size: 24px;
      color: #10b981;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background-color: #10b981;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:hover {
      background-color: #f8f9fa;
    }
    .rating-green {
      background-color: #d1fae5;
      color: #065f46;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
    }
    .rating-yellow {
      background-color: #fef3c7;
      color: #92400e;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
    }
    .rating-red {
      background-color: #fee2e2;
      color: #991b1b;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>CBAM Compliance Report</h1>
    <p>Generated: ${reportData.generatedAt.toLocaleDateString()} ${reportData.generatedAt.toLocaleTimeString()}</p>
  </div>

  <div class="summary">
    <h2>Summary</h2>
    <div class="summary-grid">
      <div class="summary-item">
        <label>Total Rows Processed</label>
        <value>${reportData.summary.totalRows}</value>
      </div>
      <div class="summary-item">
        <label>Average Composite Score</label>
        <value>${reportData.summary.averageCompositeScore.toFixed(2)}</value>
      </div>
      <div class="summary-item">
        <label>Overall Rating</label>
        <value class="rating-${reportData.summary.overallRating.toLowerCase()}">${reportData.summary.overallRating.toUpperCase()}</value>
      </div>
      <div class="summary-item">
        <label>Total Emissions (kg CO2e)</label>
        <value>${reportData.summary.totalEmissions.toFixed(2)}</value>
      </div>
    </div>
  </div>

  <h2>Sector Scores</h2>
  <table>
    <thead>
      <tr>
        <th>Sector</th>
        <th>Emission Score</th>
        <th>Responsibility Score</th>
        <th>Supply Chain Score</th>
        <th>Composite Score</th>
        <th>Rating</th>
      </tr>
    </thead>
    <tbody>
      ${reportData.scores
        .map(
          (score) => `
      <tr>
        <td>${score.sectorName}</td>
        <td>${score.emissionScore.toFixed(2)}</td>
        <td>${score.responsibilityScore.toFixed(2)}</td>
        <td>${score.supplyChainScore.toFixed(2)}</td>
        <td><strong>${score.compositeScore.toFixed(2)}</strong></td>
        <td><span class="rating-${score.scoreRating.toLowerCase()}">${score.scoreRating.toUpperCase()}</span></td>
      </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <p>This report is generated automatically by Score3 CBAM platform.</p>
    <p>For more information, visit: https://score3-cbam.manus.space</p>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Generate JSON Report
 */
export async function generateJSONReport(reportData: CBamReportData): Promise<string> {
  return JSON.stringify(reportData, null, 2);
}

/**
 * Prepare report data from upload
 */
export async function prepareReportData(
  uploadId: number,
  userId: number
): Promise<CBamReportData> {
  const upload = await getUploadById(uploadId);
  if (!upload) {
    throw new Error("Upload not found");
  }

  const scores = await getScoresByUpload(uploadId);

  // Prepare sector names
  const scoresWithSectorNames = await Promise.all(
    scores.map(async (score) => {
      const sector = await getSectorById(score.sectorId);
      return {
        id: score.id,
        sectorId: score.sectorId,
        sectorName: sector?.nameTr || `Sector ${score.sectorId}`,
        emissionScore: parseFloat(score.emissionScore),
        responsibilityScore: parseFloat(score.responsibilityScore),
        supplyChainScore: parseFloat(score.supplyChainScore),
        compositeScore: parseFloat(score.compositeScore),
        scoreRating: score.scoreRating,
      };
    })
  );

  // Calculate summary
  const averageCompositeScore =
    scoresWithSectorNames.length > 0
      ? scoresWithSectorNames.reduce((sum, s) => sum + s.compositeScore, 0) /
        scoresWithSectorNames.length
      : 0;

  const overallRating =
    averageCompositeScore >= 70 ? "green" : averageCompositeScore >= 40 ? "yellow" : "red";

  // Get total emissions from metadata
  const totalEmissions = scoresWithSectorNames.reduce((sum, s) => {
    const metadata = scores.find((sc) => sc.id === s.id)?.metadata as any;
    return sum + (metadata?.totalEmissions || 0);
  }, 0);

  return {
    uploadId,
    userId,
    generatedAt: new Date(),
    scores: scoresWithSectorNames,
    summary: {
      totalRows: upload.rowCount,
      averageCompositeScore,
      overallRating,
      totalEmissions,
    },
  };
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
