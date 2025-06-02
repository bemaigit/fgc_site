"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import ManualClubForm from "./components/ManualClubForm"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { MaskedInput } from "@/components/ui/input-mask"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { 
  Award, 
  MoreHorizontal, 
  Search, 
  Plus, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Edit, 
  AlertTriangle, 
  Trash,
  RefreshCw,
  FileText
} from "lucide-react"

// Componente principal
export default function ClubsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [clubs, setClubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [selectedClub, setSelectedClub] = useState<any>(null)
  const [openDetails, setOpenDetails] = useState(false)
  const [openNewForm, setOpenNewForm] = useState(false)
  const [assignManager, setAssignManager] = useState(false)
  const [managerEmail, setManagerEmail] = useState("")
  const [foundUser, setFoundUser] = useState<any>(null)
  const [searchingUser, setSearchingUser] = useState(false)

  // Função para carregar os clubes - movida para o escopo externo
  const fetchClubs = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/filiacao/clube")
      
      if (response.ok) {
        const data = await response.json()
        setClubs(data)
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de clubes",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao buscar clubes:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar os clubes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Efeito para carregar os clubes
  useEffect(() => {
    fetchClubs()
  }, [toast])

  // Filtrar clubes
  const filteredClubs = clubs.filter((club) => {
    // Filtro de busca
    const searchMatch = 
      club.clubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.cnpj.includes(searchTerm) ||
      club.responsibleName.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro de status
    const statusMatch = 
      statusFilter === "all" || 
      (statusFilter === "active" && club.active) ||
      (statusFilter === "inactive" && !club.active)
    
    // Filtro de pagamento
    const paymentMatch = 
      paymentFilter === "all" || 
      paymentFilter === club.paymentStatus.toLowerCase()
    
    return searchMatch && statusMatch && paymentMatch
  })

  // Função para visualizar detalhes de um clube
  const handleViewClub = (club: any) => {
    setSelectedClub(club)
    setOpenDetails(true)
  }

  // Função para confirmar pagamento manualmente (apenas SUPER_ADMIN)
  const handleConfirmPayment = async (clubId: string) => {
    try {
      if (session?.user?.role !== 'SUPER_ADMIN') {
        toast({
          title: "Permissão negada",
          description: "Apenas SUPER_ADMIN pode confirmar pagamentos manualmente",
          variant: "destructive",
        })
        return
      }
      
      // Encontrar o clube na lista para obter o CNPJ
      const club = clubs.find(c => c.id === clubId)
      if (!club || !club.cnpj) {
        throw new Error('Clube não encontrado ou CNPJ ausente')
      }

      const response = await fetch('/api/filiacao/clube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clubId,
          cnpj: club.cnpj, // Incluindo o CNPJ na requisição
          isNewRegistration: false,
          isManualRegistration: true
        }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Pagamento confirmado com sucesso",
        })
        
        // Atualizar o clube na lista
        setClubs(clubs.map(club => 
          club.id === clubId 
            ? { ...club, paymentStatus: 'CONFIRMED', active: true } 
            : club
        ))
        
        // Fechar diálogo se estiver aberto
        if (selectedClub?.id === clubId) {
          setSelectedClub({ ...selectedClub, paymentStatus: 'CONFIRMED', active: true })
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao confirmar pagamento')
      }
    } catch (error: any) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao confirmar o pagamento",
        variant: "destructive",
      })
    }
  }

  // Função para buscar usuário por email
  const handleSearchUser = async () => {
    if (!managerEmail) return
    
    try {
      setSearchingUser(true)
      const response = await fetch(`/api/user/buscar?email=${encodeURIComponent(managerEmail)}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setFoundUser(data.user)
          toast({
            title: "Usuário encontrado",
            description: `Usuário ${data.user.name || data.user.email} encontrado com sucesso.`,
          })
        } else {
          toast({
            title: "Usuário não encontrado",
            description: "Não foi possível encontrar um usuário com este email.",
            variant: "destructive",
          })
          setFoundUser(null)
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || "Erro ao buscar usuário")
      }
    } catch (error: any) {
      console.error("Erro ao buscar usuário:", error)
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao buscar o usuário",
        variant: "destructive",
      })
      setFoundUser(null)
    } finally {
      setSearchingUser(false)
    }
  }

  // Função para atualizar o clube e designar dirigente
  const handleUpdateClub = async () => {
    if (!selectedClub) return
    
    try {
      setLoading(true)
      
      // Obter os valores atualizados dos campos
      const form = document.querySelector('form') as HTMLFormElement
      const formData = new FormData(form)
      
      // Preparar dados para atualização
      const updateData: any = {
        clubName: formData.get('clubName') as string,
        responsibleName: formData.get('responsibleName') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        zipCode: formData.get('zipCode') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
      }
      
      // Adicionar informações de dirigente se aplicável
      if (assignManager && foundUser) {
        updateData.assignManager = true
        updateData.managerId = foundUser.id
      }
      
      const response = await fetch(`/api/filiacao/clube/${selectedClub.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Clube atualizado com sucesso" + 
                       (assignManager && foundUser ? ". Dirigente designado." : ""),
        })
        fetchClubs()
        setOpenDetails(false)
        
        // Limpar estados
        setAssignManager(false)
        setManagerEmail("")
        setFoundUser(null)
      } else {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar clube")
      }
    } catch (error: any) {
      console.error("Erro ao atualizar clube:", error)
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao atualizar o clube",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Função para alternar status ativo/inativo (apenas SUPER_ADMIN)
  const handleToggleStatus = async (clubId: string, currentStatus: boolean) => {
    try {
      if (session?.user?.role !== 'SUPER_ADMIN') {
        toast({
          title: "Permissão negada",
          description: "Apenas SUPER_ADMIN pode alterar o status de um clube",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/filiacao/clube/${clubId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Clube ${currentStatus ? 'desativado' : 'ativado'} com sucesso`,
        })
        
        // Atualizar o clube na lista
        setClubs(clubs.map(club => 
          club.id === clubId 
            ? { ...club, active: !currentStatus } 
            : club
        ))
        
        // Atualizar o clube selecionado se estiver aberto
        if (selectedClub?.id === clubId) {
          setSelectedClub({ ...selectedClub, active: !currentStatus })
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao alterar status')
      }
    } catch (error: any) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao alterar o status",
        variant: "destructive",
      })
    }
  }

  // Renderizar status com cores
  const renderStatus = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pendente
          </span>
        )
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmado
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelado
          </span>
        )
      default:
        return status
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gerenciamento de Clubes</h1>
        <Button onClick={() => setOpenNewForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Clube
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clubes Filiados</CardTitle>
          <CardDescription>
            Gerencie os clubes filiados à federação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por nome, CNPJ ou responsável"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              defaultValue="all"
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select
              defaultValue="all"
              onValueChange={(value) => setPaymentFilter(value)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {filteredClubs.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  Nenhum clube encontrado com os critérios selecionados
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Clube</TableHead>
                        <TableHead>CNPJ</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Data de Cadastro</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClubs.map((club) => (
                        <TableRow key={club.id}>
                          <TableCell className="font-medium">
                            {club.clubName}
                          </TableCell>
                          <TableCell>
                            {club.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
                          </TableCell>
                          <TableCell>{club.responsibleName}</TableCell>
                          <TableCell>
                            {club.active ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ativo
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inativo
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{renderStatus(club.paymentStatus)}</TableCell>
                          <TableCell>
                            {new Date(club.createdAt).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => handleViewClub(club)}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Ver detalhes
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem
                                  onClick={() => handleViewClub(club)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>

                                {club.paymentStatus === "PENDING" && 
                                  session?.user?.role === "SUPER_ADMIN" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleConfirmPayment(club.id)}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                      Confirmar pagamento
                                    </DropdownMenuItem>
                                  </>
                                )}
                                
                                {session?.user?.role === "SUPER_ADMIN" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleToggleStatus(club.id, club.active)}
                                      className={club.active ? "text-red-600" : "text-green-600"}
                                    >
                                      {club.active ? (
                                        <>
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Desativar clube
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Ativar clube
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para visualizar/editar clube */}
      {selectedClub && (
        <Dialog open={openDetails} onOpenChange={setOpenDetails}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Clube</DialogTitle>
              <DialogDescription>
                {selectedClub.clubName} - CNPJ: {selectedClub.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="details">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Informações</TabsTrigger>
                <TabsTrigger value="edit">Editar</TabsTrigger>
                <TabsTrigger value="payments">Pagamentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Responsável</h3>
                    <p>{selectedClub.responsibleName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p>{selectedClub.active ? "Ativo" : "Inativo"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status de Pagamento</h3>
                    <p>{renderStatus(selectedClub.paymentStatus)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p>{selectedClub.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Telefone</h3>
                    <p>{selectedClub.phone}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Data de Cadastro</h3>
                    <p>{new Date(selectedClub.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Endereço</h3>
                  <p>
                    {selectedClub.address}, {selectedClub.city} - {selectedClub.state}, CEP: {selectedClub.zipCode}
                  </p>
                </div>
                
                <DialogFooter className="gap-2">
                  {selectedClub.paymentStatus === "PENDING" && 
                    session?.user?.role === "SUPER_ADMIN" && (
                    <Button 
                      onClick={() => handleConfirmPayment(selectedClub.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar Pagamento
                    </Button>
                  )}
                  
                  {session?.user?.role === "SUPER_ADMIN" && (
                    <Button 
                      onClick={() => handleToggleStatus(selectedClub.id, selectedClub.active)}
                      variant={selectedClub.active ? "destructive" : "default"}
                    >
                      {selectedClub.active ? (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Ativar
                        </>
                      )}
                    </Button>
                  )}
                </DialogFooter>
              </TabsContent>
              
              <TabsContent value="edit" className="space-y-4">
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome do Clube</label>
                      <Input 
                        defaultValue={selectedClub.clubName} 
                        name="clubName"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Responsável</label>
                      <Input 
                        defaultValue={selectedClub.responsibleName} 
                        name="responsibleName"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input 
                        defaultValue={selectedClub.email} 
                        name="email" 
                        type="email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Telefone</label>
                      <Input 
                        defaultValue={selectedClub.phone} 
                        name="phone"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Endereço</label>
                      <Input 
                        defaultValue={selectedClub.address} 
                        name="address"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">CEP</label>
                      <Input 
                        defaultValue={selectedClub.zipCode} 
                        name="zipCode"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cidade</label>
                      <Input 
                        defaultValue={selectedClub.city} 
                        name="city"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Estado</label>
                      <Input 
                        defaultValue={selectedClub.state} 
                        name="state"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-md font-medium mb-3">Designar Dirigente</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">Atribuir dirigente ao clube</h4>
                          <p className="text-xs text-gray-500">O dirigente poderá cadastrar atletas para este clube</p>
                        </div>
                        <Switch 
                          name="assignManager" 
                          checked={assignManager}
                          onCheckedChange={setAssignManager}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email do usuário</label>
                        <div className="flex space-x-2">
                          <Input 
                            placeholder="Email do usuário para designar como dirigente" 
                            name="managerEmail"
                            className="flex-1"
                            value={managerEmail}
                            onChange={(e) => setManagerEmail(e.target.value)}
                            disabled={!assignManager || searchingUser}
                          />
                          <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={handleSearchUser}
                            disabled={!assignManager || !managerEmail || searchingUser}
                          >
                            {searchingUser ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Buscando...
                              </>
                            ) : (
                              "Buscar"
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">Insira o email do usuário que será responsável pelo clube</p>
                      </div>
                    </div>
                  </div>
                  
                  {foundUser && assignManager && (
                    <div className="border p-4 rounded-md bg-gray-50">
                      <h4 className="text-sm font-medium mb-2">Usuário encontrado:</h4>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                          {foundUser.name?.charAt(0) || foundUser.email?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{foundUser.name}</p>
                          <p className="text-sm text-gray-500">{foundUser.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setAssignManager(false);
                      setManagerEmail("");
                      setFoundUser(null);
                    }}>
                      Cancelar
                    </Button>
                    <Button type="button" onClick={handleUpdateClub}>
                      Salvar Alterações
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>
              
              <TabsContent value="payments">
                <p className="text-center text-gray-500 py-4">
                  O histórico de pagamentos será implementado em breve.
                </p>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo para adicionar novo clube */}
      <Dialog open={openNewForm} onOpenChange={setOpenNewForm}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Clube</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar um novo clube manualmente.
            </DialogDescription>
          </DialogHeader>
          
          <ManualClubForm onClose={() => setOpenNewForm(false)} onSuccess={() => {
            setOpenNewForm(false);
            // Recarregar a lista após adicionar um novo clube
            setLoading(true);
            fetch("/api/filiacao/clube")
              .then(res => res.ok ? res.json() : Promise.reject('Erro ao carregar clubes'))
              .then(data => setClubs(data))
              .catch(error => {
                console.error("Erro ao buscar clubes:", error);
                toast({
                  title: "Erro",
                  description: "Ocorreu um erro ao atualizar a lista de clubes",
                  variant: "destructive",
                });
              })
              .finally(() => setLoading(false));
          }} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
