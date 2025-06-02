import { NotificationData } from '../types/notification';

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async create(data: {
    type: string;
    recipient: string;
    priority: string;
    data: Record<string, unknown>;
  }): Promise<void> {
    console.log('Enviando notificação:', data);
    // Implementar lógica de envio
  }

  async sendNotification(data: NotificationData): Promise<void> {
    return this.create({
      type: data.type,
      recipient: data.userId,
      priority: 'normal',
      data: data.data
    });
  }
}
