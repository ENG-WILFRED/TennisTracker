'use server';

import prisma from '@/lib/prisma';
import { sendPaymentReceiptEmail } from '@/app/api/notification/producer';
import { formatKenyanMobileNumber } from '@/lib/phone';

const REQUEST_TIMEOUT_MS = 20000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout: ${url}`);
    }
    throw error;
  }
}

async function fetchWithRetry(url: string, options: RequestInit = {}, onRetry?: (attempt: number) => void) {
  let lastError: Error;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      return response;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Request attempt ${attempt}/${MAX_RETRIES} failed:`, lastError.message);

      if (attempt < MAX_RETRIES) {
        // Notify about retry if callback provided
        if (onRetry) {
          onRetry(attempt);
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  throw lastError!;
}

// Get base URL for callbacks (backend-to-backend)
const getCallbackBaseUrl = () => {
  // Prefer NEXTAUTH_URL when available for callback routes.
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  // Use NEXT_PUBLIC_TEST_BASE_URL for development/testing if no NEXTAUTH_URL is configured.
  if (process.env.NEXT_PUBLIC_TEST_BASE_URL) {
    return process.env.NEXT_PUBLIC_TEST_BASE_URL;
  }
  // Fallback to NEXT_PUBLIC_SITE_URL for production
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // Default fallback
  return 'http://localhost:3010';
};

// Get base URL for redirect URLs (frontend)
const getRedirectBaseUrl = () => {
  // Prefer NEXTAUTH_URL when available.
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  // Use TEST_BASE_URL for development/testing if no NEXTAUTH_URL is configured.
  if (process.env.TEST_BASE_URL) {
    return process.env.TEST_BASE_URL;
  }
  // Fallback to NEXT_PUBLIC_APP_URL if provided.
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // Fallback to NEXT_PUBLIC_SITE_URL for production
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // Default fallback
  return 'http://localhost:3010';
};

const getPaymentGatewayBaseUrl = () => {
  return process.env.PAYMENT_GATEWAY_BASE_URL || 'http://localhost:8787';
};

const getMpesaGatewayBaseUrl = () => {
  return process.env.MPESA_GATEWAY_BASE_URL || 'https://mpesa-integration-worker.kimaniwilfred95.workers.dev';
};

function appendQueryParams(url: string, params: Record<string, string | undefined>) {
  const [baseUrl, existingQuery] = url.split('?');
  const searchParams = new URLSearchParams(existingQuery || '');

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * M-Pesa STK Push Payment Action
 * Initiates an M-Pesa STK push that prompts user for PIN
 */
export async function processMPesaPayment(
  mobileNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string,
  userId: string,
  eventId: string,
  bookingType: 'tournament_entry' | 'amenity_booking' | 'court_booking',
  metadata: Record<string, any> = {}
) {
  try {
    const normalized = formatKenyanMobileNumber(mobileNumber);
    if (!normalized.normalized) {
      return { success: false, error: normalized.error || 'Invalid mobile number or amount' };
    }

    if (!amount || amount <= 0) {
      return { success: false, error: 'Invalid amount' };
    }

    const mobileNumberNormalized = normalized.normalized;
    const callbackBaseUrl = getCallbackBaseUrl();
    const callbackUrl = `${callbackBaseUrl}/api/payments/callback/mpesa`;

    const record = await prisma.paymentRecord.create({
      data: {
        userId,
        eventId,
        bookingType,
        amount,
        currency: 'KES',
        provider: 'mpesa',
        providerStatus: 'pending',
        callbackUrl,
        cancelUrl: null,
        metadata: JSON.stringify({ mobileNumber: mobileNumberNormalized, accountReference, transactionDesc, ...metadata }),
      },
    });

    const cancelUrl = `${callbackBaseUrl}/api/payments/cancel/mpesa/${record.id}`;
    await prisma.paymentRecord.update({
      where: { id: record.id },
      data: { cancelUrl },
    });

    const mpesaResponse = await fetchWithTimeout(`${getMpesaGatewayBaseUrl()}/api/stk/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        mobileNumber: mobileNumberNormalized,
        amount: Math.round(amount),
        accountReference,
        transactionDesc,
        transactionId: record.id,
        callbackUrl,
        cancelUrl,
      }),
    });

    if (!mpesaResponse.ok) {
      const error = await mpesaResponse.json();
      await prisma.paymentRecord.update({
        where: { id: record.id },
        data: { providerStatus: 'failed' },
      });
      console.error('M-Pesa STK push failed:', error);
      return { success: false, error: error?.message || 'M-Pesa request failed' };
    }

    const mpesaData = await mpesaResponse.json();

    await prisma.paymentRecord.update({
      where: { id: record.id },
      data: {
        providerTransactionId: mpesaData.checkoutRequestId || mpesaData.requestId || null,
        checkoutUrl: null,
        providerStatus: 'pending',
      },
    });

    return {
      success: true,
      transactionId: record.id,
      checkoutRequestId: mpesaData.checkoutRequestId,
      message: 'M-Pesa STK push sent. Please complete the payment on your phone.',
      callbackUrlRegistered: true,
      cancelUrlRegistered: true,
    };
  } catch (error) {
    console.error('M-Pesa payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed',
    };
  }
}

export async function processPayPalPayment(
  amount: number,
  currency: string,
  userId: string,
  eventId: string,
  bookingType: 'tournament_entry' | 'amenity_booking' | 'court_booking',
  metadata: Record<string, any> = {}
) {
  try {
    if (!amount || amount <= 0) {
      return { success: false, error: 'Invalid amount' };
    }

    const callbackBaseUrl = getCallbackBaseUrl();
    const callbackUrl = `${callbackBaseUrl}/api/payments/callback/paypal`;

    const record = await prisma.paymentRecord.create({
      data: {
        userId,
        eventId,
        bookingType,
        amount,
        currency: currency.toUpperCase(),
        provider: 'paypal',
        providerStatus: 'pending',
        callbackUrl,
        cancelUrl: null,
        metadata: JSON.stringify(metadata),
      },
    });

    const cancelUrl = `${callbackBaseUrl}/api/payments/cancel/paypal/${record.id}`;
    await prisma.paymentRecord.update({
      where: { id: record.id },
      data: { cancelUrl },
    });

    const idempotencyKey = `${record.id}-${Date.now()}`;
    const paypalResponse = await fetchWithTimeout(`${getPaymentGatewayBaseUrl()}/api/payments/paypal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100) / 100,
        currency: currency.toUpperCase(),
        callbackUrl,
        cancelUrl,
        metadata: {
          transactionId: record.id,
          eventId,
          userId,
          bookingType,
          ...metadata,
        },
      }),
    });

    if (!paypalResponse.ok) {
      const error = await paypalResponse.json();
      await prisma.paymentRecord.update({
        where: { id: record.id },
        data: { providerStatus: 'failed' },
      });
      return { success: false, error: error?.message || 'PayPal request failed' };
    }

    const paypalData = await paypalResponse.json();

    const approveUrl = paypalData.approveUrl || 
      (paypalData.links?.find((link: any) => link.rel === 'approve')?.href) || null;

    await prisma.paymentRecord.update({
      where: { id: record.id },
      data: {
        providerTransactionId: paypalData.orderId || null,
        checkoutUrl: approveUrl,
      },
    });

    return {
      success: true,
      transactionId: record.id,
      orderId: paypalData.orderId,
      checkoutUrl: approveUrl,
      links: paypalData.links,
      callbackUrlRegistered: true,
      cancelUrlRegistered: true,
    };
  } catch (error) {
    console.error('PayPal payment error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Payment processing failed' };
  }
}

export async function processStripePayment(
  amount: number,
  currency: string,
  userId: string,
  eventId: string,
  bookingType: 'tournament_entry' | 'amenity_booking' | 'court_booking',
  metadata: Record<string, any> = {},
  successRedirectUrl?: string,
  failureRedirectUrl?: string,
  customCallbackUrl?: string,
  customCancelUrl?: string
) {
  try {
    if (!amount || amount <= 0) {
      return { success: false, error: 'Invalid amount' };
    }

    const callbackBaseUrl = getCallbackBaseUrl();
    const redirectBaseUrl = getRedirectBaseUrl();

    const record = await prisma.paymentRecord.create({
      data: {
        userId,
        eventId,
        bookingType,
        amount,
        currency: currency.toLowerCase(),
        provider: 'stripe',
        providerStatus: 'pending',
        callbackUrl: '',
        cancelUrl: null,
        metadata: JSON.stringify({
          eventId,
          userId,
          bookingType,
          ...metadata,
        }),
      },
    });

    const callbackUrl = customCallbackUrl || `${callbackBaseUrl}/api/payments/callback/stripe?bookingType=${encodeURIComponent(bookingType)}&transactionId=${encodeURIComponent(record.id)}`;
    await prisma.paymentRecord.update({
      where: { id: record.id },
      data: { callbackUrl },
    });

    // Update metadata with transactionId after record creation
    await prisma.paymentRecord.update({
      where: { id: record.id },
      data: {
        metadata: JSON.stringify({
          transactionId: record.id,
          paymentAttemptId: record.id,
          eventId,
          userId,
          bookingType,
          ...metadata,
        }),
      },
    });

    // Use custom cancel URL if provided, otherwise generate default
    const cancelUrl = customCancelUrl || `${redirectBaseUrl}/api/payments/cancel/stripe/${record.id}`;
    await prisma.paymentRecord.update({
      where: { id: record.id },
      data: { cancelUrl },
    });

    const idempotencyKey = `${record.id}-${Date.now()}`;

    const defaultSuccessPage = successRedirectUrl ? successRedirectUrl : `${redirectBaseUrl}/player/booking/success`;
    const defaultFailurePage = failureRedirectUrl ? failureRedirectUrl : successRedirectUrl ? successRedirectUrl : `${redirectBaseUrl}/player/booking/success`;

    const successUrl = appendQueryParams(defaultSuccessPage, {
      success: 'true',
      transactionId: record.id,
      source: 'stripe',
    });

    const failureUrl = appendQueryParams(defaultFailurePage, {
      failed: '1',
      transactionId: record.id,
      source: 'stripe',
    });

    const stripePayload = {
      amount,
      currency: currency.toLowerCase(),
      successRedirectUrl: successUrl,
      failureRedirectUrl: failureUrl,
      callbackUrl,
      cancelUrl,
      metadata: {
        transactionId: record.id,
        paymentAttemptId: record.id,
        eventId,
        userId,
        bookingType,
        ...metadata,
      },
    };

    console.log('[Stripe Payment Request]', {
      transactionId: record.id,
      amount: stripePayload.amount,
      currency: stripePayload.currency,
      successRedirectUrl: stripePayload.successRedirectUrl,
      failureRedirectUrl: stripePayload.failureRedirectUrl,
      callbackUrl: stripePayload.callbackUrl,
      cancelUrl: stripePayload.cancelUrl,
      redirectBaseUrl,
      callbackBaseUrl,
      idempotencyKey,
      timestamp: new Date().toISOString(),
    });

    // Track retry attempts for user feedback
    let retryAttempt = 0;

    const stripeResponse = await fetchWithRetry(
      `${getPaymentGatewayBaseUrl()}/api/payments/stripe`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(stripePayload),
      },
      (attempt) => {
        retryAttempt = attempt;
        console.log(`Retrying Stripe payment request (attempt ${attempt + 1}/${MAX_RETRIES}) for transaction ${record.id}`);
      }
    );

    if (!stripeResponse.ok) {
      const error = await stripeResponse.json();
      console.error('[Stripe Payment Failed]', {
        transactionId: record.id,
        status: stripeResponse.status,
        statusText: stripeResponse.statusText,
        error: error?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      });
      await prisma.paymentRecord.update({
        where: { id: record.id },
        data: { providerStatus: 'failed' },
      });
      return { success: false, error: error?.message || 'Stripe request failed' };
    }

    const stripeData = await stripeResponse.json();

    console.log('[Stripe Payment Response]', {
      transactionId: record.id,
      sessionId: stripeData.sessionId,
      paymentIntentId: stripeData.paymentIntentId,
      checkoutUrl: stripeData.checkoutUrl || stripeData.url ? 'provided' : 'missing',
      status: stripeResponse.status,
      timestamp: new Date().toISOString(),
    });

    const checkoutUrl = stripeData.checkoutUrl || stripeData.url || null;

    await prisma.paymentRecord.update({
      where: { id: record.id },
      data: {
        providerTransactionId: stripeData.paymentIntentId || stripeData.sessionId || null,
        checkoutUrl: checkoutUrl,
      },
    });

    return {
      success: true,
      transactionId: record.id,
      sessionId: stripeData.sessionId,
      checkoutUrl: checkoutUrl,
      clientSecret: stripeData.clientSecret,
      callbackUrlRegistered: true,
      cancelUrlRegistered: true,
      retriesAttempted: retryAttempt,
    };
  } catch (error) {
    console.error('Stripe payment error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Payment processing failed' };
  }
}

export async function verifyPaymentStatus(transactionId: string) {
  try {
    const record = await prisma.paymentRecord.findUnique({
      where: { id: transactionId },
    });

    if (!record) {
      return { success: false, error: 'Transaction not found' };
    }

    return {
      success: true,
      transactionId,
      status: record.providerStatus,
      provider: record.provider,
      amount: record.amount,
      currency: record.currency,
      metadata: record.metadata ? JSON.parse(record.metadata) : null,
      updatedAt: record.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Verify payment error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Verification failed' };
  }
}

export async function completePayment(
  transactionId: string,
  providerTransactionId: string,
  status: 'success' | 'failed'
) {
  try {
    const record = await prisma.paymentRecord.findUnique({
      where: { id: transactionId },
    });

    if (!record) {
      return { success: false, error: 'Transaction not found' };
    }

    console.log(`💰 Processing payment completion: ${transactionId} (${status}) - ${record.bookingType}`);

    await prisma.paymentRecord.update({
      where: { id: transactionId },
      data: {
        providerStatus: status === 'success' ? 'completed' : 'failed',
        providerTransactionId,
      },
    });

    if (status === 'success') {
      console.log(`✅ Payment status updated to completed: ${transactionId}`);

      // ... existing email sending code ...

      // Handle different booking types
      if (record.bookingType === 'tournament_entry' && record.eventId) {
        console.log(`🎾 Processing tournament entry payment: ${transactionId}`);
        // Create or update event registration for tournament entry
        const member = await prisma.clubMember.findFirst({
          where: { playerId: record.userId }
        });
        
        // Fetch tournament/event details to get organization
        const tournament = await prisma.clubEvent.findUnique({
          where: { id: record.eventId },
          include: { organization: true }
        });
        
        if (member) {
          console.log(`✓ Found member: ${member.id} for userId: ${record.userId}`);
          const existingRegistration = await prisma.eventRegistration.findFirst({
            where: {
              eventId: record.eventId,
              memberId: member.id,
            },
          });

          if (existingRegistration) {
            console.log(`✓ Found existing registration: ${existingRegistration.id}, current status: ${existingRegistration.status}`);
            if (existingRegistration.status !== 'registered') {
              await prisma.eventRegistration.update({
                where: { id: existingRegistration.id },
                data: { status: 'registered' },
              });
              console.log(`✅ Updated registration to registered: ${existingRegistration.id}`);
            }
          } else {
            console.log(`→ Creating new registration for eventId: ${record.eventId}, memberId: ${member.id}`);
            const latestRegistration = await prisma.eventRegistration.findFirst({
              where: { eventId: record.eventId },
              orderBy: { signupOrder: 'desc' },
            });
            const signupOrder = (latestRegistration?.signupOrder || 0) + 1;
            const newRegistration = await prisma.eventRegistration.create({
              data: {
                eventId: record.eventId,
                memberId: member.id,
                status: 'registered',
                signupOrder,
              },
            });
            console.log(`✅ Created new registration: ${newRegistration.id} with signupOrder: ${signupOrder}`);
          }
          
          // Create revenue record for the organization
          if (tournament?.organization?.id) {
            try {
              await prisma.orgRevenue.create({
                data: {
                  organizationId: tournament.organization.id,
                  paymentType: 'tournament',
                  fromPlayerId: record.userId,
                  amount: record.amount,
                  currency: record.currency,
                  status: 'confirmed',
                  paymentMethod: record.provider,
                  mpesaTransactionId: providerTransactionId,
                },
              });
              console.log(`💰 Created revenue record for organization: ${tournament.organization.id}`);
            } catch (revenueError) {
              console.error('Error creating revenue record:', revenueError);
            }
          }
        } else {
          console.warn(`⚠️ No club member found for playerId: ${record.userId}`);
        }
        console.log(`✅ Tournament registration completed: ${transactionId}`);
      } else if (record.bookingType === 'court_booking' && record.eventId) {
        console.log(`🏓 Processing court booking payment: ${transactionId}`);
        await createCourtBooking(record.userId, record.eventId, record);
        console.log(`✅ Court booking completed: ${transactionId}`);
      } else if (record.bookingType === 'amenity_booking' && record.eventId) {
        console.log(`🏨 Processing amenity booking payment: ${transactionId}`);
        await createAmenityBooking(record.userId, record.eventId, record);
        console.log(`✅ Amenity booking completed: ${transactionId}`);
      } else {
        console.log(`ℹ️ Payment completed for ${record.bookingType}: ${transactionId} (no additional business logic)`);
      }
    } else {
      console.log(`❌ Payment marked as failed: ${transactionId}`);
    }

    return { success: true, transactionId, status };
  } catch (error) {
    console.error('Complete payment error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Payment completion failed' };
  }
}

export async function createCourtBooking(
  userId: string,
  courtId: string,
  paymentRecord: any
) {
  try {
    const metadata = typeof paymentRecord.metadata === 'string'
      ? JSON.parse(paymentRecord.metadata)
      : paymentRecord.metadata || {};

    // Extract booking details from metadata
    const { startTime, endTime, organizationId, matchType, originalAmount } = metadata;

    if (!startTime || !endTime || !organizationId) {
      return { success: false, error: 'Missing booking details' };
    }

    // Check if user is a club member (don't create if not - allow guest bookings)
    const member = await prisma.clubMember.findFirst({
      where: {
        playerId: userId,
        organizationId,
      },
      include: {
        membershipTier: true, // Include membership tier to check for discounts
      },
    });

    // Calculate discount if user is a member
    let discountAmount = 0;
    let discountPercentage = 0;
    if (member?.membershipTier?.discountPercentage) {
      discountPercentage = member.membershipTier.discountPercentage;
      discountAmount = Math.round((originalAmount || 0) * (discountPercentage / 100));
    }

    // Create the booking record
    // If user is a member, use their memberId; otherwise use null (guest booking)
    const booking = await prisma.courtBooking.create({
      data: {
        memberId: member?.id || null,
        courtId,
        organizationId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        bookingType: 'regular',
        status: 'confirmed',
        notes: metadata.notes || '',
      },
    });

    // Store bookingId in payment metadata so success pages can link to booking details
    await prisma.paymentRecord.update({
      where: { id: paymentRecord.id },
      data: {
        metadata: JSON.stringify({
          ...metadata,
          bookingId: booking.id,
        }),
      },
    });

    return { 
      success: true, 
      bookingId: booking.id,
      isMember: !!member,
      discountPercentage,
      discountAmount,
      membershipName: member?.membershipTier?.name,
    };
  } catch (error) {
    console.error('Create court booking error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Booking creation failed' };
  }
}

export async function createAmenityBooking(
  userId: string,
  amenityId: string,
  paymentRecord: any
) {
  try {
    const metadata = typeof paymentRecord.metadata === 'string'
      ? JSON.parse(paymentRecord.metadata)
      : paymentRecord.metadata || {};

    // Extract booking details from metadata
    const { startTime, endTime, guestName, notes } = metadata;

    if (!startTime || !endTime) {
      return { success: false, error: 'Missing booking details: startTime and endTime are required' };
    }

    // Get member ID for the user
    const member = await prisma.clubMember.findFirst({
      where: { playerId: userId },
    });

    if (!member) {
      return { success: false, error: 'User is not a club member' };
    }

    // Verify amenity exists and belongs to an event
    const amenity = await prisma.eventAmenity.findUnique({
      where: { id: amenityId },
      include: { event: true },
    });

    if (!amenity) {
      return { success: false, error: 'Amenity not found' };
    }

    // Check availability
    const bookingStart = new Date(startTime);
    const bookingEnd = new Date(endTime);

    if (amenity.availableFrom && bookingStart < amenity.availableFrom) {
      return { success: false, error: 'Booking starts before amenity is available' };
    }

    if (amenity.availableUntil && bookingEnd > amenity.availableUntil) {
      return { success: false, error: 'Booking ends after amenity is available' };
    }

    // Create the amenity booking record
    const booking = await prisma.amenityBooking.create({
      data: {
        amenityId,
        memberId: member.id,
        guestName: guestName || null,
        startTime: bookingStart,
        endTime: bookingEnd,
        status: 'confirmed',
        price: paymentRecord.amount,
        notes: notes || null,
      },
    });

    console.log(`Amenity booking created for user ${userId}: amenity ${amenityId}, booking ${booking.id}`);

    return { success: true, bookingId: booking.id };
  } catch (error) {
    console.error('Create amenity booking error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Amenity booking creation failed' };
  }
}

export async function getPaymentStatus(transactionId: string) {
  try {
    let record = await prisma.paymentRecord.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        providerStatus: true,
        provider: true,
        amount: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
        bookingType: true,
        metadata: true,
      },
    });

    if (!record) {
      // Try to resolve by provider transaction ID if the caller passed a Stripe session/payment ID
      const fallbackRecord = await prisma.paymentRecord.findFirst({
        where: {
          providerTransactionId: transactionId,
        },
      });

      if (!fallbackRecord) {
        return { success: false, error: 'Transaction not found' };
      }

      record = fallbackRecord;
    }

    const parsedMetadata = record.metadata ? JSON.parse(record.metadata) : null;

    return {
      success: true,
      payment: record,
      metadata: parsedMetadata,
      isCompleted: record.providerStatus === 'completed',
    };
  } catch (error) {
    console.error('Get payment status error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get payment status' };
  }
}

export async function handlePaymentCallback(
  provider: 'mpesa' | 'paypal' | 'stripe',
  data: Record<string, any>
) {
  try {
    let transactionId = '';
    let status: 'success' | 'failed' = 'failed';
    const providerTransactionId = String(data.id || data.paymentId || data.orderId || data.sessionId || '');

    if (provider === 'mpesa') {
      transactionId = data.transactionId;
      status = data.resultCode === '0' ? 'success' : 'failed';
    } else if (provider === 'paypal') {
      transactionId = data.custom || data.transactionId;
      status = ['COMPLETED', 'APPROVED'].includes(String(data.status || '')) ? 'success' : 'failed';
    } else if (provider === 'stripe') {
      transactionId = data.transactionId || data.paymentId || data.metadata?.transactionId || data.metadata?.paymentAttemptId || data.sessionId || data.id;
      const statusValue = String(data.status || '').toUpperCase();
      status = statusValue === 'SUCCESS'
        ? 'success'
        : statusValue === 'FAILED'
        ? 'failed'
        : ['payment_intent.succeeded', 'charge.succeeded', 'checkout.session.completed'].includes(String(data.type))
        ? 'success'
        : 'failed';
    }

    // If transactionId looks like an idempotency key (localId-timestamp) try to extract the UUID portion
    if (transactionId && typeof transactionId === 'string') {
      const uuidMatch = transactionId.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
      if (uuidMatch) {
        transactionId = uuidMatch[0];
      }
    }

    if (!transactionId && data.eventId && data.userId) {
      const fallback = await prisma.paymentRecord.findFirst({
        where: {
          provider,
          eventId: data.eventId,
          userId: data.userId,
          providerStatus: 'pending',
        },
        orderBy: { createdAt: 'desc' },
      });
      if (fallback) {
        transactionId = fallback.id;
      }
    }

    if (!transactionId) {
      console.warn(`Missing transactionId in ${provider} callback`, data);
      return { success: false, error: 'Missing transaction ID' };
    }

    return await completePayment(transactionId, providerTransactionId, status);
  } catch (error) {
    console.error('Payment callback error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Callback processing failed' };
  }
}
