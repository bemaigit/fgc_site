"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Eye, Edit, AlertTriangle, Trash, Users, Building } from "lucide-react";
import { AthleteRegistrationForm } from "@/components/athlete/AthleteRegistrationForm";

interface ClubData {
  id: string;
  clubName: string;
  cnpj: string;
  responsibleName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  active: boolean;
  paymentStatus: string;
}

interface AthleteData {
  id: string;
  fullName: string;
  cpf: string;
  birthDate: string;
  phone: string;
  modalities: string[];
  category: string;
  active: boolean;
  paymentStatus: string;
  userId: string | null;
  // Adicionando campos opcionais para compatibilidade
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface ClubManagerProps {
  managedClub: ClubData;
  clubAthletes: AthleteData[];
  onRefresh: () => void;
}

export default function ClubManager({ managedClub, clubAthletes, onRefresh }: ClubManagerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showNewAthleteForm, setShowNewAthleteForm] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteData | null>(null);
  const [showAthleteDetails, setShowAthleteDetails] = useState(false);

  const handleViewAthlete = (athleteId: string) => {
    const athlete = clubAthletes.find(a => a.id === athleteId);
    if (athlete) {
      setSelectedAthlete(athlete);
      setShowAthleteDetails(true);
    }
  };

  const formatCnpj = (cnpj: string) => {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  const formatCpf = (cpf: string) => {
    if (!cpf) return '';
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  };

  const formatBirthDate = (date: string) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('pt-BR');
    } catch (e) {
      return date;
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            Confirmado
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
            Pendente
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            Cancelado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações do clube */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center">
                <Building className="mr-2 h-5 w-5" />
                Detalhes do Clube
              </CardTitle>
              <CardDescription>
                Você é dirigente deste clube e pode gerenciar seus atletas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Nome do Clube</h3>
              <p className="font-medium">{managedClub.clubName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">CNPJ</h3>
              <p className="font-medium">{formatCnpj(managedClub.cnpj)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Responsável</h3>
              <p className="font-medium">{managedClub.responsibleName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="font-medium">{managedClub.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Telefone</h3>
              <p className="font-medium">{managedClub.phone}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <div className="font-medium">
                {managedClub.active ? 
                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Ativo</Badge> : 
                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Inativo</Badge>}
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Endereço</h3>
            <p className="font-medium">
              {managedClub.address}, {managedClub.city} - {managedClub.state}, CEP: {managedClub.zipCode}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lista de atletas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Atletas do Clube
              </CardTitle>
              <CardDescription>
                Gerenciar atletas filiados pelo seu clube
              </CardDescription>
            </div>
            <Button onClick={() => setShowNewAthleteForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Atleta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead className="hidden md:table-cell">Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubAthletes && clubAthletes.length > 0 ? (
                  clubAthletes.map((athlete) => (
                    <TableRow key={`club-athlete-${athlete.id}`}>
                      <TableCell className="font-medium">{athlete.fullName}</TableCell>
                      <TableCell>{formatCpf(athlete.cpf)}</TableCell>
                      <TableCell className="hidden md:table-cell">{athlete.category}</TableCell>
                      <TableCell>
                        {athlete.active ? 
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Ativo</Badge> : 
                          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Inativo</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleViewAthlete(athlete.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Nenhum atleta registrado para este clube
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo para registrar novo atleta */}
      <Dialog open={showNewAthleteForm} onOpenChange={setShowNewAthleteForm}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Registrar Novo Atleta</DialogTitle>
            <DialogDescription>
              Cadastre um novo atleta para o clube {managedClub.clubName}
            </DialogDescription>
          </DialogHeader>
          
          <AthleteRegistrationForm 
            clubId={managedClub.id} 
            onSuccess={() => {
              setShowNewAthleteForm(false);
              onRefresh();
              toast({
                title: "Sucesso",
                description: "Atleta registrado com sucesso"
              });
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo para detalhes do atleta */}
      <Dialog open={showAthleteDetails} onOpenChange={setShowAthleteDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Atleta</DialogTitle>
            <DialogDescription>
              Informações completas do atleta
            </DialogDescription>
          </DialogHeader>

          {selectedAthlete && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nome Completo</h3>
                  <p className="font-medium">{selectedAthlete.fullName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">CPF</h3>
                  <p className="font-medium">{formatCpf(selectedAthlete.cpf)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Data de Nascimento</h3>
                  <p className="font-medium">{formatBirthDate(selectedAthlete.birthDate)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Telefone</h3>
                  <p className="font-medium">{selectedAthlete.phone}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="font-medium">
                    {selectedAthlete.active ? 
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Ativo</Badge> : 
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Inativo</Badge>}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status de Pagamento</h3>
                  <p className="font-medium">{renderStatus(selectedAthlete.paymentStatus)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Modalidades</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAthlete.modalities && selectedAthlete.modalities.length > 0 ? (
                    selectedAthlete.modalities.map((modality, index) => (
                      <Badge key={index} variant="secondary">{modality}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma modalidade selecionada</p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <h3 className="text-sm font-medium text-gray-500 mr-2">Status da Conta:</h3>
                {selectedAthlete.userId ? (
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                    Conta vinculada
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                    Aguardando vínculo
                  </Badge>
                )}
              </div>

              <div className="border-t pt-4 flex justify-end">
                <Button variant="outline" onClick={() => setShowAthleteDetails(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
