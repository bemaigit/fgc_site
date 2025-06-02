"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Schema de validação para emails e outras configurações. O campo notificationEmails é tratado como string.
const settingsSchema = z.object({
  notificationEmails: z.string().refine((val) => {
    const emails = val.split(",").map((email) => email.trim()).filter(Boolean);
    // Se a string estiver vazia, considere válido (sem emails)
    if (emails.length === 0) return true;
    return emails.every((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }, { message: "Email inválido" }),
  successUrl: z.string().url("URL inválida"),
  failureUrl: z.string().url("URL inválida"),
  maxInstallments: z.number().int().min(1).max(24)
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

// Usamos notificationEmails como string para o input
const defaultValues: SettingsFormData = {
  notificationEmails: "",
  successUrl: "https://ad4e-189-123-162-163.ngrok-free.app/pagamento/sucesso",
  failureUrl: "https://ad4e-189-123-162-163.ngrok-free.app/pagamento/erro",
  maxInstallments: 12
};

export function PaymentSettingsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/admin/payment/config");
        if (response.ok) {
          const data = await response.json();
          // Transforma notificationEmails de array para string separada por vírgulas
          const transformedData = {
            ...data,
            notificationEmails: Array.isArray(data.notificationEmails)
              ? data.notificationEmails.join(", ")
              : ""
          };
          reset(transformedData);
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
        toast({
          title: "Erro",
          description: "Erro ao carregar configurações",
          variant: "destructive"
        });
      }
    };
    loadSettings();
  }, [reset, toast]);

  const onSubmit = async (data: SettingsFormData) => {
    setIsLoading(true);
    try {
      // Converte a string de emails em array antes de enviar para o servidor
      const payload = {
        ...data,
        notificationEmails: data.notificationEmails
          .split(",")
          .map(email => email.trim())
          .filter(email => email !== "")
      };

      const response = await fetch("/api/admin/payment/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Configurações salvas com sucesso"
        });
      } else {
        throw new Error("Erro ao salvar configurações");
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Emails de Notificação */}
      <div className="space-y-2">
        <Label htmlFor="notificationEmails">Emails de Notificação</Label>
        <Input
          id="notificationEmails"
          type="text"
          placeholder="email1@exemplo.com, email2@exemplo.com"
          {...register("notificationEmails")}
        />
        {errors.notificationEmails && (
          <p className="text-sm text-destructive">
            {errors.notificationEmails.message}
          </p>
        )}
      </div>

      {/* URL de Sucesso */}
      <div className="space-y-2">
        <Label htmlFor="successUrl">URL de Sucesso</Label>
        <Input
          id="successUrl"
          type="url"
          placeholder="https://..."
          {...register("successUrl")}
        />
        {errors.successUrl && (
          <p className="text-sm text-destructive">{errors.successUrl.message}</p>
        )}
      </div>

      {/* URL de Erro */}
      <div className="space-y-2">
        <Label htmlFor="failureUrl">URL de Erro</Label>
        <Input
          id="failureUrl"
          type="url"
          placeholder="https://..."
          {...register("failureUrl")}
        />
        {errors.failureUrl && (
          <p className="text-sm text-destructive">{errors.failureUrl.message}</p>
        )}
      </div>

      {/* Número Máximo de Parcelas */}
      <div className="space-y-2">
        <Label htmlFor="maxInstallments">Número Máximo de Parcelas</Label>
        <Input
          id="maxInstallments"
          type="number"
          min={1}
          max={24}
          {...register("maxInstallments", { valueAsNumber: true })}
        />
        {errors.maxInstallments && (
          <p className="text-sm text-destructive">
            {errors.maxInstallments.message}
          </p>
        )}
      </div>

      {/* Botão de Salvar */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </form>
  );
}
