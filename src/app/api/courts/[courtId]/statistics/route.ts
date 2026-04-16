import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/courts/{courtId}/statistics
 * Player view - Get court statistics and utilization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courtId: string }> }
) {
  try {
    const { courtId } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get bookings in the period
    const bookings = await prisma.courtBooking.findMany({
      where: {
        courtId,
        createdAt: { gte: startDate },
      },
    });

    const confirmedBookings = bookings.filter((b: typeof bookings[number]) => b.status === 'confirmed');
    const cancelledBookings = bookings.filter((b: typeof bookings[number]) => b.status === 'cancelled');
    const totalHoursBooked = confirmedBookings.reduce((acc: number, b: typeof confirmedBookings[number]) => {
      const duration = (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60 * 60);
      return acc + duration;
    }, 0);

    const totalRevenue = confirmedBookings.reduce((acc: number, b: typeof confirmedBookings[number]) => acc + (b.price || 0), 0);
    const peakBookings = confirmedBookings.filter((b: typeof confirmedBookings[number]) => b.isPeak).length;
    const offPeakBookings = confirmedBookings.filter((b: typeof confirmedBookings[number]) => !b.isPeak).length;

    // Get monthly breakdown
    const monthlyData = await Promise.all(
      Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        return prisma.courtBooking
          .aggregate({
            where: {
              courtId,
              status: 'confirmed',
              startTime: { gte: monthStart, lte: monthEnd },
            },
            _sum: { price: true },
            _count: true,
          })
          .then((result) => ({
            month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            revenue: result._sum?.price || 0,
            bookings: result._count || 0,
          }));
      })
    );

    const utilizationRate = totalHoursBooked > 0
      ? Math.min(Math.round((totalHoursBooked / (days * 15)) * 100), 100)
      : 0;

    return NextResponse.json({
      period: `last_${days}_days`,
      stats: {
        totalBookings: bookings.length,
        confirmedBookings: confirmedBookings.length,
        cancelledBookings: cancelledBookings.length,
        totalHoursBooked: Math.round(totalHoursBooked * 10) / 10,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        peakBookings,
        offPeakBookings,
        utilizationRate,
        averageBookingValue: confirmedBookings.length > 0
          ? Math.round((totalRevenue / confirmedBookings.length) * 100) / 100
          : 0,
      },
      monthlyData: monthlyData.reverse(),
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
