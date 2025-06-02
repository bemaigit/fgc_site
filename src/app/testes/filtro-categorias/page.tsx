"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface Modalidade {
  id: string;
  name: string;
  price: number;
}

interface Categoria {
  id: string;
  name: string;
}

export default function TesteFiltroCategorias() {
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [categorias, setCategories] = useState<Categoria[]>([]);
  const [selectedModalidades, setSelectedModalidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Função para adicionar logs
  const adicionarLog = (mensagem: string) => {
    setLogs((logs) => [...logs, `${new Date().toLocaleTimeString()}: ${mensagem}`]);
  };

  // Carregar todas as modalidades
  useEffect(() => {
    const carregarModalidades = async () => {
      try {
        adicionarLog("Carregando modalidades...");
        
        try {
          // Verificar se a API está respondendo com debugging completo
          const testResponse = await fetch("/api/filiacao/modalidades");
          adicionarLog(`Status da resposta: ${testResponse.status}`);
          
          if (!testResponse.ok) {
            const errorText = await testResponse.text();
            adicionarLog(`Texto de erro: ${errorText}`);
            throw new Error(`Erro ${testResponse.status}: ${errorText}`);
          }
          
          // Tentar verificar o conteúdo da resposta
          const responseText = await testResponse.text();
          adicionarLog(`Resposta bruta: ${responseText.substring(0, 100)}...`);
          
          // Converter texto para JSON
          const data = JSON.parse(responseText);
          
          adicionarLog(`Carregadas ${data.length} modalidades`);
          console.log('Modalidades:', data);
          setModalidades(data);
        } catch (apiError) {
          adicionarLog(`Erro no parsing da API: ${apiError}`);
          
          // Buscar modalidades diretamente via Prisma
          adicionarLog("Tentando buscar modalidades via API de teste...");
          const testModalidades = await fetch("/api/filiacao/teste-modal-cat");
          
          if (testModalidades.ok) {
            const modalidadesData = await testModalidades.json();
            adicionarLog(`API de teste retornou ${modalidadesData.resultados?.length || 0} modalidades`);
            
            if (modalidadesData.resultados && modalidadesData.resultados.length > 0) {
              const modalidadesFormatadas = modalidadesData.resultados.map((m: any) => ({
                id: m.modalidadeId,
                name: m.modalidade,
                price: 0 // Preço padrão já que não temos esse dado no endpoint de teste
              }));
              
              adicionarLog(`Usando ${modalidadesFormatadas.length} modalidades do endpoint de teste`);
              setModalidades(modalidadesFormatadas);
            }
          }
        }
      } catch (error) {
        adicionarLog(`Erro geral ao carregar modalidades: ${error}`);
      }
    };

    carregarModalidades();
  }, []);

  // Filtrar categorias quando as modalidades selecionadas mudarem
  useEffect(() => {
    const filtrarCategorias = async () => {
      if (selectedModalidades.length === 0) {
        adicionarLog("Nenhuma modalidade selecionada. Limpando categorias.");
        setCategories([]);
        return;
      }

      try {
        setLoading(true);
        adicionarLog(`Filtrando categorias para modalidades: ${selectedModalidades.join(", ")}`);
        
        // Fazer requisição para API
        const response = await fetch("/api/filiacao/categorias/filtrar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modalityIds: selectedModalidades }),
        });

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        adicionarLog(`Recebidas ${data.length} categorias filtradas`);
        if (data.length > 0) {
          adicionarLog(`Categorias: ${data.map((c: Categoria) => c.name).join(", ")}`);
        }
        
        setCategories(data);
      } catch (error) {
        adicionarLog(`Erro ao filtrar categorias: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    filtrarCategorias();
  }, [selectedModalidades]);

  // Alternar seleção de modalidade
  const toggleModalidade = (id: string) => {
    setSelectedModalidades(prev => 
      prev.includes(id) 
        ? prev.filter(m => m !== id) 
        : [...prev, id]
    );
  };

  // Limpar logs
  const limparLogs = () => setLogs([]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Teste de Filtro de Categorias por Modalidade</h1>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Modalidades</h2>
          <div className="border rounded-md p-4 h-72 overflow-y-auto">
            {modalidades.length === 0 ? (
              <p className="text-gray-500">Carregando modalidades...</p>
            ) : (
              <ul className="space-y-2">
                {modalidades.map((modalidade) => (
                  <li key={modalidade.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={modalidade.id}
                      checked={selectedModalidades.includes(modalidade.id)}
                      onChange={() => toggleModalidade(modalidade.id)}
                      className="mr-2"
                    />
                    <label htmlFor={modalidade.id}>
                      {modalidade.name} (R$ {Number(modalidade.price).toFixed(2)})
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Categorias Filtradas</h2>
          <div className="border rounded-md p-4 h-72 overflow-y-auto">
            {loading ? (
              <p className="text-gray-500">Carregando categorias...</p>
            ) : selectedModalidades.length === 0 ? (
              <p className="text-gray-500">Selecione modalidades para ver categorias</p>
            ) : categorias.length === 0 ? (
              <p className="text-gray-500">Nenhuma categoria encontrada para as modalidades selecionadas</p>
            ) : (
              <ul className="space-y-2">
                {categorias.map((categoria) => (
                  <li key={categoria.id} className="flex items-center">
                    <span className="block px-2 py-1 bg-blue-100 rounded">
                      {categoria.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Logs</h2>
        <div className="border rounded-md p-4 h-64 overflow-y-auto bg-gray-50 font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">Nenhum log disponível</p>
          ) : (
            <ul className="space-y-1">
              {logs.map((log, index) => (
                <li key={index}>{log}</li>
              ))}
            </ul>
          )}
        </div>
        <Button className="mt-2" variant="outline" onClick={limparLogs}>
          Limpar Logs
        </Button>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Diagnóstico</h2>
        <Button onClick={async () => {
          try {
            adicionarLog("Executando diagnóstico completo...");
            const response = await fetch("/api/filiacao/teste-modal-cat");
            if (!response.ok) throw new Error(`Erro ${response.status}`);
            
            const data = await response.json();
            adicionarLog("Diagnóstico concluído");
            console.log("Diagnóstico completo:", data);
            
            // Exibir resultados simplificados
            data.resultados.forEach((resultado: any) => {
              adicionarLog(`Modalidade: ${resultado.modalidade} (${resultado.categorias.length} categorias)`);
              if (resultado.categorias.length > 0) {
                adicionarLog(`  - Categorias: ${resultado.categorias.map((c: any) => c.name).join(", ")}`);
              }
            });
          } catch (error) {
            adicionarLog(`Erro no diagnóstico: ${error}`);
          }
        }}>
          Executar Diagnóstico Completo
        </Button>
      </div>
    </div>
  );
}
