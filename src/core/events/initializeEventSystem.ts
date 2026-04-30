/**
 * Initialize Event System: Register all handlers
 * 
 * Called once at application startup
 */

import { eventBus } from './EventBus';
import {
  handleSessionCompleted,
  handleSessionCompletedPayment,
  handleSessionCompletedEarnings,
  handleSessionCompletedNotifications,
  handleSessionCompletedRecommendations,
} from './handlers/SessionHandlers';

export function initializeEventSystem() {
  console.log('[Events] Initializing event system...');

  // ─────────────────────────────────────────────────────────────────
  // SESSION COMPLETED HANDLERS (all independent, all run)
  // ─────────────────────────────────────────────────────────────────

  eventBus.subscribe(
    'SESSION_COMPLETED',
    handleSessionCompleted,
    'SessionMetricsHandler'
  );

  eventBus.subscribe(
    'SESSION_COMPLETED',
    handleSessionCompletedPayment,
    'SessionPaymentHandler'
  );

  eventBus.subscribe(
    'SESSION_COMPLETED',
    handleSessionCompletedEarnings,
    'SessionEarningsHandler'
  );

  eventBus.subscribe(
    'SESSION_COMPLETED',
    handleSessionCompletedNotifications,
    'SessionNotificationHandler'
  );

  eventBus.subscribe(
    'SESSION_COMPLETED',
    handleSessionCompletedRecommendations,
    'SessionRecommendationHandler'
  );

  // ─────────────────────────────────────────────────────────────────
  // ADD MORE HANDLERS FOR OTHER EVENTS HERE
  // ─────────────────────────────────────────────────────────────────

  // eventBus.subscribe('INVOICE_CREATED', handleInvoiceCreated, 'InvoiceHandler');
  // eventBus.subscribe('PAYMENT_FAILED', handlePaymentFailed, 'PaymentRetryHandler');
  // etc.

  console.log('[Events] ✓ Event system initialized with handlers');
}

export default initializeEventSystem;
