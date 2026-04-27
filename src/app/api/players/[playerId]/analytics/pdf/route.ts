import { NextRequest, NextResponse } from 'next/server';

interface Analytics {
  playerId: string;
  playerName: string;
  profilePhoto?: string;
  stats: {
    totalMatches: number;
    matchesWon: number;
    matchesLost: number;
    winRate: number;
    currentRank?: number;
    bestRank?: number;
    streak?: number;
  };
  monthly: Array<{
    month: string;
    matches: number;
    wins: number;
    losses: number;
  }>;
  performance: {
    serviceAccuracy: number;
    firstServeWinRate: number;
    breakPointConversion: number;
    aces: number;
    doubleFaults: number;
  };
  recentMatches: Array<{
    date: string;
    opponent: string;
    result: 'WIN' | 'LOSS';
    score: string;
  }>;
  goals: Array<{
    name: string;
    progress: number;
    target: string;
  }>;
}

// Helper to generate PDF content as HTML
function generatePDFContent(analytics: Analytics, timeframe: string): string {
  const winPercentage = analytics.stats.winRate.toFixed(1);
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Player Analytics - ${analytics.playerName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
          line-height: 1.6;
          background: #f5f5f5;
          padding: 20px;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          display: flex;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #3d7a32;
        }
        .header-info {
          flex: 1;
        }
        .title {
          font-size: 32px;
          font-weight: 900;
          color: #2d5a32;
          margin-bottom: 5px;
        }
        .subtitle {
          font-size: 14px;
          color: #7aaa6a;
          margin-bottom: 10px;
        }
        .date {
          font-size: 12px;
          color: #999;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: #f9f9f9;
          border-left: 4px solid #7dc142;
          padding: 15px;
          border-radius: 4px;
        }
        .stat-label {
          font-size: 12px;
          color: #7aaa6a;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .stat-value {
          font-size: 28px;
          font-weight: 900;
          color: #1a3020;
        }
        .stat-unit {
          font-size: 14px;
          color: #7aaa6a;
          margin-left: 5px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #7dc142;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #2d5a35;
        }
        .performance-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        .performance-item {
          background: #f9f9f9;
          padding: 12px;
          border-radius: 4px;
        }
        .performance-label {
          font-size: 12px;
          color: #7aaa6a;
          margin-bottom: 8px;
        }
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .progress-fill {
          height: 100%;
          background: #7dc142;
        }
        .performance-value {
          font-size: 14px;
          font-weight: 600;
          color: #1a3020;
        }
        .monthly-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }
        .monthly-card {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 4px;
          text-align: center;
        }
        .monthly-month {
          font-size: 12px;
          color: #7aaa6a;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .monthly-matches {
          font-size: 20px;
          font-weight: 700;
          color: #1a3020;
          margin-bottom: 8px;
        }
        .monthly-records {
          font-size: 12px;
          display: flex;
          justify-content: center;
          gap: 10px;
        }
        .monthly-win {
          color: #7dc142;
          font-weight: 600;
        }
        .monthly-loss {
          color: #e05050;
          font-weight: 600;
        }
        .matches-table {
          width: 100%;
          border-collapse: collapse;
        }
        .matches-table th {
          background: #1a3020;
          color: #e8f5e0;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #2d5a35;
        }
        .matches-table td {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
        }
        .matches-table tr:last-child td {
          border-bottom: none;
        }
        .result-win {
          background: #d4edda;
          color: #155724;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 12px;
        }
        .result-loss {
          background: #f8d7da;
          color: #721c24;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 12px;
        }
        .goals-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }
        .goal-card {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 4px;
        }
        .goal-name {
          font-size: 13px;
          font-weight: 600;
          color: #1a3020;
          margin-bottom: 10px;
        }
        .goal-progress-bar {
          width: 100%;
          height: 6px;
          background: #e0e0e0;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .goal-progress-fill {
          height: 100%;
          background: #7dc142;
        }
        .goal-target {
          font-size: 11px;
          color: #7aaa6a;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          font-size: 12px;
          color: #999;
        }
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .container {
            box-shadow: none;
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-info">
            <div class="title">📊 ${analytics.playerName}</div>
            <div class="subtitle">Performance Analytics & Progress Report</div>
            <div class="date">Generated on ${currentDate} • Timeframe: ${timeframe}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Matches</div>
            <div class="stat-value">${analytics.stats.totalMatches}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Matches Won</div>
            <div class="stat-value" style="color: #7dc142;">${analytics.stats.matchesWon}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Win Rate</div>
            <div class="stat-value" style="color: #4ab0d0;">${winPercentage}<span class="stat-unit">%</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">⚡ Performance Metrics</div>
          <div class="performance-grid">
            <div class="performance-item">
              <div class="performance-label">Service Accuracy</div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${analytics.performance.serviceAccuracy}%"></div>
              </div>
              <div class="performance-value">${analytics.performance.serviceAccuracy.toFixed(1)}%</div>
            </div>
            <div class="performance-item">
              <div class="performance-label">1st Serve Win Rate</div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${analytics.performance.firstServeWinRate}%"></div>
              </div>
              <div class="performance-value">${analytics.performance.firstServeWinRate.toFixed(1)}%</div>
            </div>
            <div class="performance-item">
              <div class="performance-label">Break Point Conversion</div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${analytics.performance.breakPointConversion}%"></div>
              </div>
              <div class="performance-value">${analytics.performance.breakPointConversion.toFixed(1)}%</div>
            </div>
            <div class="performance-item">
              <div class="performance-label">Aces & Double Faults</div>
              <div style="font-weight: 600; margin-top: 10px;">
                <span style="color: #7dc142;">Aces: ${analytics.performance.aces}</span> | 
                <span style="color: #e05050;">DFs: ${analytics.performance.doubleFaults}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📈 Monthly Progress</div>
          <div class="monthly-grid">
            ${analytics.monthly.map(m => `
              <div class="monthly-card">
                <div class="monthly-month">${m.month}</div>
                <div class="monthly-matches">${m.matches} Matches</div>
                <div class="monthly-records">
                  <span class="monthly-win">W: ${m.wins}</span>
                  <span class="monthly-loss">L: ${m.losses}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">🎾 Recent Matches</div>
          <table class="matches-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Opponent</th>
                <th>Score</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              ${analytics.recentMatches.slice(0, 10).map(m => `
                <tr>
                  <td>${m.date}</td>
                  <td>${m.opponent}</td>
                  <td>${m.score}</td>
                  <td><span class="result-${m.result === 'WIN' ? 'win' : 'loss'}">${m.result === 'WIN' ? '✓ WIN' : '✗ LOSS'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">🎯 Goals & Targets</div>
          <div class="goals-grid">
            ${analytics.goals.map(g => `
              <div class="goal-card">
                <div class="goal-name">${g.name}</div>
                <div class="goal-progress-bar">
                  <div class="goal-progress-fill" style="width: ${Math.min(g.progress, 100)}%"></div>
                </div>
                <div class="goal-target">Target: ${g.target}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="footer">
          <p>This analytics report has been generated from TennisTracker. Data is refreshed regularly.</p>
          <p>Generated on ${currentDate} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// POST generate PDF
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    const { analytics, timeframe } = await request.json();

    if (!analytics) {
      return NextResponse.json({ error: 'Analytics data required' }, { status: 400 });
    }

    // Generate HTML content
    const htmlContent = generatePDFContent(analytics, timeframe);

    // Try to import puppeteer for server-side PDF generation
    try {
      const puppeteer = await import('puppeteer');
      
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent);

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      });

      await browser.close();

      const buffer = Buffer.from(pdfBuffer as any);

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="player-analytics-${playerId}-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      });
    } catch (error) {
      console.log('Puppeteer not available, returning HTML instead:', error);
      
      // Fallback: return HTML that can be printed to PDF by the browser
      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html;charset=utf-8',
          'Content-Disposition': `attachment; filename="player-analytics-${playerId}.html"`,
        },
      });
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
