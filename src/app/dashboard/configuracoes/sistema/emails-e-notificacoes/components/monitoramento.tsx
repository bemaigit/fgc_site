"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"

type NotificationStatus = "success" | "error" | "pending"

interface Notification {
  id: string
  type: string
  recipient: string
  channel: string
  status: NotificationStatus
  sentAt: string
  error?: string
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "payment-approved",
    recipient: "usuario@email.com",
    channel: "email",
    status: "success",
    sentAt: "2025-02-08T20:00:00",
  },
  {
    id: "2",
    type: "payment-created",
    recipient: "+5562999999999",
    channel: "whatsapp",
    status: "error",
    sentAt: "2025-02-08T19:55:00",
    error: "Falha ao enviar mensagem",
  },
]

export default function MonitoramentoNotificacoes() {
  const [notifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Destinatário</TableHead>
            <TableHead>Canal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Erro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.map((notification) => (
            <TableRow key={notification.id}>
              <TableCell>{notification.type}</TableCell>
              <TableCell>{notification.recipient}</TableCell>
              <TableCell>{notification.channel}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    notification.status === "success"
                      ? "success"
                      : notification.status === "error"
                      ? "destructive"
                      : "default"
                  }
                >
                  {notification.status}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(notification.sentAt).toLocaleString("pt-BR")}
              </TableCell>
              <TableCell>{notification.error || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {notifications.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          Nenhuma notificação encontrada
        </div>
      )}
    </div>
  )
}
