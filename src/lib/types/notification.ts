export interface NotificationData {
  userId: string;
  type: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
  data: Record<string, unknown>;
}

export interface NotificationService {
  getInstance(): NotificationService;
  create(data: {
    type: string;
    recipient: string;
    priority: string;
    data: Record<string, unknown>;
  }): Promise<void>;
  sendNotification(data: NotificationData): Promise<void>;
}
