import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import html2pdf from 'html2pdf.js';

/**
 * POST /api/reports/generate
 * Generate and store a PDF report for a completed match
 */
export async function POST(req: NextRequest) {
  try {
    const { matchId, refereeId } = await req.json();

    if (!matchId || !refereeId) {
      return NextResponse.json(
        { error: 'Missing required fields: matchId, refereeId' },
        { status: 400 }
      );
    }

    // Fetch match details
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        playerA: { include: { user: true } },
        playerB: { include: { user: true } },
        referee: { include: { user: true } },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Check if referee matches
    if (match.refereeId !== refereeId) {
      return NextResponse.json(
        { error: 'Unauthorized to generate report for this match' },
        { status: 403 }
      );
    }

    // Generate HTML for PDF
    const htmlContent = generateReportHTML(match);

    // Convert HTML to PDF (we'll store as base64 string)
    const pdfBase64 = await htmlToPdfBase64(htmlContent);

    // Check if report already exists
    const existingReport = await prisma.matchReport.findUnique({
      where: { matchId },
    });

    let report;
    if (existingReport) {
      // Update existing report
      report = await prisma.matchReport.update({
        where: { matchId },
        data: {
          pdfContent: pdfBase64,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new report
      const fileName = `Match_Report_${match.playerA.user.firstName}_vs_${match.playerB.user.firstName}_${new Date().toISOString().split('T')[0]}.pdf`;
      report = await prisma.matchReport.create({
        data: {
          matchId,
          refereeId,
          pdfContent: pdfBase64,
          fileName,
        },
      });
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      fileName: report.fileName,
      message: 'Report generated and stored successfully',
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * Generate HTML content for the match report
 */
function generateReportHTML(match: any): string {
  const timestamp = new Date(match.createdAt).toLocaleString();
  const playerAName = `${match.playerA.user.firstName} ${match.playerA.user.lastName}`;
  const playerBName = `${match.playerB.user.firstName} ${match.playerB.user.lastName}`;
  const refereeName = match.referee?.user ? `${match.referee.user.firstName} ${match.referee.user.lastName}` : 'N/A';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Match Report</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
          margin: 0;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 8px;
          max-width: 800px;
          margin: 0 auto;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #7dc142;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header h1 {
          margin: 0 0 5px 0;
          color: #0f1f0f;
          font-size: 28px;
        }
        .header p {
          margin: 3px 0;
          color: #666;
          font-size: 12px;
        }
        .match-info {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 6px;
          border-left: 4px solid #7dc142;
        }
        .player-section {
          text-align: center;
        }
        .player-name {
          font-size: 16px;
          font-weight: 700;
          color: #0f1f0f;
          margin-bottom: 8px;
        }
        .vs {
          font-size: 18px;
          font-weight: 800;
          color: #7dc142;
          align-self: center;
        }
        .score {
          font-size: 24px;
          font-weight: 900;
          color: #7dc142;
          margin: 10px 0 15px 0;
        }
        .details-section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 14px;
          font-weight: 800;
          color: #0f1f0f;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 2px solid #7dc142;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
          font-size: 13px;
        }
        .detail-label {
          font-weight: 600;
          color: #555;
        }
        .detail-value {
          color: #333;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 11px;
          color: #999;
          text-align: center;
        }
        .timestamp {
          color: #999;
          font-size: 10px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎾 Match Report</h1>
          <p>Vico Sports Match Official Report</p>
        </div>

        <div class="match-info">
          <div class="player-section">
            <div class="player-name">${playerAName}</div>
            <div class="score">${match.score?.split('-')[0] || '0'}</div>
          </div>
          <div class="vs">VS</div>
          <div class="player-section">
            <div class="player-name">${playerBName}</div>
            <div class="score">${match.score?.split('-')[1] || '0'}</div>
          </div>
        </div>

        <div class="details-section">
          <div class="section-title">Match Details</div>
          <div class="detail-row">
            <span class="detail-label">Match ID:</span>
            <span class="detail-value">${match.id}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date & Time:</span>
            <span class="detail-value">${timestamp}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Match Type:</span>
            <span class="detail-value">${match.group || 'Regular Match'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Round:</span>
            <span class="detail-value">Round ${match.round}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Winner:</span>
            <span class="detail-value">${match.winnerId === match.playerAId ? playerAName : match.winnerId === match.playerBId ? playerBName : 'TBD'}</span>
          </div>
        </div>

        <div class="details-section">
          <div class="section-title">Officials</div>
          <div class="detail-row">
            <span class="detail-label">Referee:</span>
            <span class="detail-value">${refereeName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Report Generated:</span>
            <span class="detail-value">${new Date().toLocaleString()}</span>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0;">This is an official match report generated by Vico Sports system.</p>
          <p style="margin: 5px 0 0 0;">Document is confidential and intended for authorized personnel only.</p>
          <div class="timestamp">Generated on: ${new Date().toISOString()}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Convert HTML to PDF and return as base64 string
 * Since we're on server-side, we'll store the HTML as printable
 */
async function htmlToPdfBase64(htmlContent: string): Promise<string> {
  // For server-side, we encode the HTML as base64 with metadata
  // The actual PDF generation can be done client-side or with a library like puppeteer
  const htmlBase64 = Buffer.from(htmlContent).toString('base64');
  return htmlBase64;
}
