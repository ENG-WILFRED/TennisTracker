import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Seed payment records for bookings
 * Creates realistic payment history across all providers
 */

export async function seedPaymentRecords() {
  console.log('💳 Seeding payment records...\n');

  const paymentProviders = ['mpesa', 'paypal', 'stripe'];
  const paymentStatuses = ['completed', 'pending', 'failed'];

  // Get all confirmed court bookings
  const bookings = await prisma.courtBooking.findMany({
    where: {
      status: { in: ['confirmed', 'no-show'] },
      startTime: {
        lt: new Date(), // Only past bookings
      },
    },
    include: {
      member: {
        include: {
          player: {
            include: {
              user: true,
            },
          },
        },
      },
      court: true,
    },
  });

  if (bookings.length === 0) {
    console.log('  ℹ️  No confirmed past bookings found for payment seeding.\n');
    return [];
  }

  const payments: any[] = [];
  let paymentCount = 0;

  console.log(`📝 Creating payment records for ${bookings.length} bookings...\n`);

  for (const booking of bookings) {
    // Skip some bookings (not all were paid, simulating free tier users)
    if (Math.random() > 0.85) continue;

    const provider = paymentProviders[Math.floor(Math.random() * paymentProviders.length)];
    
    // Most are successful, some failed
    let status = 'completed';
    if (Math.random() > 0.95) {
      status = 'failed';
    } else if (Math.random() > 0.85) {
      status = 'pending';
    }

    try {
      const payment = await prisma.paymentRecord.create({
        data: {
          userId: booking.member?.player?.user?.id || booking.memberId || '',
          eventId: booking.id,
          bookingType: 'court_booking',
          amount: booking.price || 50,
          currency: 'KES',
          provider,
          providerStatus: status,
          providerTransactionId: `${provider.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          checkoutUrl: provider === 'paypal' || provider === 'stripe' 
            ? `https://checkout.example.com/${provider}/${Date.now()}`
            : null,
          metadata: JSON.stringify({
            courtId: booking.courtId,
            organizationId: booking.organizationId,
            bookingId: booking.id,
            playerName: booking.member?.player?.user?.firstName || 'Guest',
            courtName: booking.court?.name || 'Court',
            bookingDate: booking.startTime.toISOString(),
          }),
          createdAt: new Date(
            booking.startTime.getTime() - Math.random() * 3600000 // Payment created up to 1h before start
          ),
          updatedAt: new Date(
            booking.startTime.getTime() + (status === 'completed' ? Math.random() * 3600000 : 0)
          ),
        },
      });

      payments.push(payment);
      paymentCount++;
    } catch (error) {
      // Silently skip duplicates or errors
    }
  }

  // Calculate statistics
  const totalRevenue = payments
    .filter(p => p.providerStatus === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const byProvider = paymentProviders.reduce((acc, provider) => {
    acc[provider] = payments.filter(p => p.provider === provider).length;
    return acc;
  }, {} as Record<string, number>);

  console.log(`✓ Created ${paymentCount} payment records`);
  console.log(`\n💰 Payment statistics:`);
  console.log(`  Total revenue: KES ${totalRevenue.toLocaleString()}`);
  console.log(`  Success rate: ${((payments.filter(p => p.providerStatus === 'completed').length / paymentCount) * 100).toFixed(1)}%`);
  console.log(`\n📊 By payment provider:`);
  Object.entries(byProvider).forEach(([provider, count]) => {
    console.log(`  ${provider.toUpperCase()}: ${count} payments`);
  });
  console.log('');

  return payments;
}
