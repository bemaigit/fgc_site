export interface NotificationConfig {
  id?: string
  whatsappEnabled: boolean
  emailEnabled: boolean
  webhookEnabled: boolean
  whatsappToken?: string
  whatsappPhoneId?: string
  webhookUrl?: string
  maxRetries: number
  updatedAt?: Date
  createdAt?: Date
}

export interface NotificationTemplate {
  id?: string
  type: string
  channel: "email" | "whatsapp" | "webhook"
  name: string
  content: string
  variables: string[]
  active: boolean
  updatedAt?: Date
  createdAt?: Date
}

export interface NotificationStats {
  total: number
  success: number
  error: number
  pending: number
}

export interface NotificationLog {
  id: string
  type: string
  recipient: string
  channel: string
  status: "success" | "error" | "pending"
  error?: string
  sentAt: Date
  metadata?: Record<string, any>
}

export type NotificationLogFilters = {
  startDate?: Date
  endDate?: Date
  status?: string
  channel?: string
  type?: string
  page?: number
  limit?: number
}
