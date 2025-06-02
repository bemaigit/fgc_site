'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModalidadesForm } from './components/ModalidadesForm';
import { CategoriasForm } from './components/CategoriasForm';
import { InstrucoesForm } from './components/InstrucoesForm';
import { CardFiliationForm } from './components/CardFiliationForm';

export default function FiliasePage() {
  const [activeTab, setActiveTab] = useState('modalidades');

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gestão de Filiação</h1>
        <p className="text-muted-foreground">
          Gerencie modalidades, categorias, instruções e cards de filiação.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modalidades">Modalidades</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="instrucoes">Instruções</TabsTrigger>
          <TabsTrigger value="card-filiacao">Card Filiação</TabsTrigger>
        </TabsList>

        <TabsContent value="modalidades">
          <Card>
            <CardHeader>
              <CardTitle>Modalidades</CardTitle>
              <CardDescription>
                Gerencie as modalidades disponíveis e seus valores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModalidadesForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias">
          <Card>
            <CardHeader>
              <CardTitle>Categorias</CardTitle>
              <CardDescription>
                Gerencie as categorias disponíveis para filiação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoriasForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instrucoes">
          <Card>
            <CardHeader>
              <CardTitle>Instruções Pós-Pagamento</CardTitle>
              <CardDescription>
                Configure as instruções que serão exibidas após o pagamento da filiação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InstrucoesForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="card-filiacao">
          <Card>
            <CardHeader>
              <CardTitle>Card Filiação</CardTitle>
              <CardDescription>
                Personalize a aparência dos cards de filiação exibidos na página inicial.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CardFiliationForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
