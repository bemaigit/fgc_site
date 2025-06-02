export enum NotificationType {
  PAYMENT_CREATED = "PAYMENT_CREATED",
  PAYMENT_APPROVED = "PAYMENT_APPROVED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PAYMENT_EXPIRED = "PAYMENT_EXPIRED",
  PAYMENT_REFUNDED = "PAYMENT_REFUNDED",
  PAYMENT_CHARGEBACK = "PAYMENT_CHARGEBACK",
  REGISTRATION_APPROVED = "REGISTRATION_APPROVED",
  REGISTRATION_EXPIRED = "REGISTRATION_EXPIRED",
  REGISTRATION_CONFIRMED = "REGISTRATION_CONFIRMED",
  USER_WELCOME = "USER_WELCOME",
  AFFILIATION_CONFIRMED = "AFFILIATION_CONFIRMED",
  EVENT_RESULTS_PUBLISHED = "EVENT_RESULTS_PUBLISHED"
}

export enum NotificationChannel {
  EMAIL = "EMAIL",
  SMS = "SMS",
  PUSH = "PUSH",
  WEBHOOK = "WEBHOOK",
  WHATSAPP = "WHATSAPP"
}

export enum NotificationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT"
}

export enum NotificationStatus {
  PENDING = "PENDING",
  SENDING = "SENDING",
  SENT = "SENT",
  FAILED = "FAILED",
  DELIVERED = "DELIVERED"
}

/**
 * Interface para o payload de envio de notificações usado pelo NotificationService
 */
export interface INotificationPayload {
  id?: string;
  type: string;
  recipient: string;
  content: string;
  channel: string;
  priority?: 'high' | 'normal' | 'low';
  subject?: string;
  templateId?: string;
  variables?: Record<string, string>;
  metadata?: Record<string, any>;
  sendAt?: string;
  attachments?: Array<{
    url: string;
    name?: string;
    type?: string;
  }>;
}

export interface NotificationTemplate {
  id: string
  type: NotificationType
  channel: NotificationChannel
  subject?: string
  content: string
  variables: string[]
  active: boolean
}

export interface NotificationData {
  type: NotificationType
  recipient: {
    name: string
    email?: string
    phone?: string
    deviceToken?: string
    webhookUrl?: string
  }
  data: Record<string, any>
  priority?: NotificationPriority
  channels?: NotificationChannel[]
}

export interface NotificationResult {
  success: boolean
  id?: string
  channel: NotificationChannel
  error?: string
  timestamp: Date
}

export interface NotificationProvider {
  send(notification: NotificationData): Promise<NotificationResult>
  getStatus(notificationId: string): Promise<NotificationStatus>
}
