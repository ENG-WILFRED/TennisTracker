/**
 * Notification Producer Module
 * 
 * This module provides functions to queue notifications through Kafka.
 * All functions are asynchronous and return a promise with the notification ID.
 * 
 * @example
 * ```typescript
 * import { notify, sendWelcomeEmail, sendOtpNotification } from '@/app/api/notification';
 * 
 * // Send a custom notification
 * await notify({
 *   to: 'user@example.com',
 *   channel: 'email',
 *   template: 'welcome_email',
 *   data: { name: 'Alice' }
 * });
 * 
 * // Send a welcome email
 * await sendWelcomeEmail('user@example.com', 'Alice');
 * 
 * // Send OTP
 * await sendOtpNotification('user@example.com', 'otp_email', 'email', '123456');
 * ```
 */

export {
  notify,
  sendOtpNotification,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendPaymentReceiptEmail,
  publishNotification,
  createProducer,
  initProducer,
  closeProducer,
  type NotificationPayload
} from './producer';
