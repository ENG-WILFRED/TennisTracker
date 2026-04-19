import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { playerId, timeframe = 'season' } = await req.json();

    if (!playerId) {
      return NextResponse.json(
        { error: 'Missing playerId parameter' },
        { status: 400 }
      );
    }

    // Get player progress data
    const progressRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/player/progress?playerId=${playerId}`);
    if (!progressRes.ok) {
      throw new Error('Failed to fetch progress data');
    }
    const progressData = await progressRes.json();

    // Generate HTML report
    const htmlContent = generateProgressReportHTML(progressData, timeframe);

    // For now, return HTML. In production, you'd convert to PDF
    // Since we don't have html2pdf in this context, we'll return the HTML
    // and let the frontend handle PDF generation

    return NextResponse.json({
      html: htmlContent,
      data: progressData,
      filename: `progress-report-${progressData.player.name.replace(/\s+/g, '-')}-${timeframe}.html`,
    });
  } catch (error) {
    console.error('Error generating progress report:', error);
    return NextResponse.json(
      { error: 'Failed to generate progress report' },
      { status: 500 }
    );
  }
}

function generateProgressReportHTML(data: any, timeframe: string) {
  const { player, stats, progress, badges, attendance, coaches } = data;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Progress Report - ${player.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #2d5a27; padding-bottom: 20px; margin-bottom: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #2d5a27; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .progress-section { margin: 30px 0; }
        .progress-chart { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .badge-list { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0; }
        .badge { background: #e8f5e0; border: 1px solid #2d5a27; padding: 8px 12px; border-radius: 20px; font-size: 12px; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background: #f5f5f5; font-weight: bold; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎾 Tennis Progress Report</h1>
        <h2>${player.name}</h2>
        <p>Level: ${player.level} | Report Period: ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}</p>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-value">${stats.totalMatches}</div>
            <div class="stat-label">Total Matches</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.winRate}%</div>
            <div class="stat-label">Win Rate</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.coachSessions}</div>
            <div class="stat-label">Coach Sessions</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.attendanceRate}%</div>
            <div class="stat-label">Attendance Rate</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.badgesEarned}</div>
            <div class="stat-label">Badges Earned</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${progress.improvement > 0 ? '+' : ''}${progress.improvement}%</div>
            <div class="stat-label">Recent Improvement</div>
        </div>
    </div>

    <div class="progress-section">
        <h3>📈 Performance Progress</h3>
        <div class="progress-chart">
            <h4>Monthly Performance</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Matches</th>
                        <th>Wins</th>
                        <th>Losses</th>
                        <th>Win Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${progress.monthly.map((month: any) => `
                        <tr>
                            <td>${month.month}</td>
                            <td>${month.matches}</td>
                            <td>${month.wins}</td>
                            <td>${month.losses}</td>
                            <td>${month.winRate}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>

    ${badges.length > 0 ? `
    <div class="progress-section">
        <h3>🏆 Achievements & Badges</h3>
        <div class="badge-list">
            ${badges.map((badge: any) => `
                <div class="badge">${badge.icon} ${badge.name}</div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${coaches.length > 0 ? `
    <div class="progress-section">
        <h3>👨‍🏫 Coaching Relationships</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Coach</th>
                    <th>Status</th>
                    <th>Joined</th>
                </tr>
            </thead>
            <tbody>
                ${coaches.map((coach: any) => `
                    <tr>
                        <td>${coach.name}</td>
                        <td>${coach.status}</td>
                        <td>${new Date(coach.joinedAt).toLocaleDateString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="progress-section">
        <h3>📅 Recent Attendance</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${attendance.slice(0, 10).map((record: any) => `
                    <tr>
                        <td>${new Date(record.date).toLocaleDateString()}</td>
                        <td>${record.present ? '✅ Present' : '❌ Absent'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>This report was generated by Vico Sports Tennis Tracker</p>
        <p>For questions or support, contact your coach or club administrator</p>
    </div>
</body>
</html>`;
}