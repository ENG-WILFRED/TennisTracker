import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check database connectivity
    let databaseStatus = 'unknown';
    let databaseResponseTime = 0;

    try {
      const dbStartTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      databaseResponseTime = Date.now() - dbStartTime;
      databaseStatus = 'healthy';
    } catch (error) {
      databaseStatus = 'unhealthy';
      console.error('Database health check failed:', error);
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memoryUsage = {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
    };

    // Calculate uptime
    const uptime = process.uptime();
    const uptimeFormatted = {
      seconds: Math.floor(uptime),
      minutes: Math.floor(uptime / 60),
      hours: Math.floor(uptime / 3600),
      days: Math.floor(uptime / 86400),
    };

    // Get system info
    const systemInfo = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };

    const responseTime = Date.now() - startTime;

    const healthData = {
      status: 'healthy',
      timestamp: systemInfo.timestamp,
      responseTime: `${responseTime}ms`,
      uptime: uptimeFormatted,
      system: systemInfo,
      memory: memoryUsage,
      services: {
        database: {
          status: databaseStatus,
          responseTime: `${databaseResponseTime}ms`,
        },
      },
      version: process.env.npm_package_version || '1.0.0',
    };

    // If database is unhealthy, mark overall status as degraded
    if (databaseStatus === 'unhealthy') {
      healthData.status = 'degraded';
    }

    return NextResponse.json(healthData, {
      status: healthData.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Health check failed:', error);

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: 'Health check failed',
      uptime: {
        seconds: Math.floor(process.uptime()),
      },
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  }
}