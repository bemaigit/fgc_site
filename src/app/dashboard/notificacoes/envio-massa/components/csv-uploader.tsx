'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileSpreadsheet, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

interface CSVUploaderProps {
  onFileSelected: (file: File) => void;
  onFileRemoved: () => void;
  isProcessing: boolean;
  channel: 'whatsapp' | 'email';
}

interface FilePreviewProps {
  file: File;
  previewData: any[];
  onRemove: () => void;
  isProcessing: boolean;
}

export const CSVUploader: React.FC<CSVUploaderProps> = ({
  onFileSelected,
  onFileRemoved,
  isProcessing,
  channel
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download modelo de CSV
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`/api/notifications/csv?channel=${channel}`);
      if (!response.ok) throw new Error('Falha ao baixar o modelo');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `modelo_${channel}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Erro ao baixar o modelo de CSV');
      console.error(error);
    }
  };

  // Validar arquivo CSV
  const validateFile = (file: File): boolean => {
    if (!file.name.endsWith('.csv')) {
      setError('Por favor, selecione um arquivo CSV');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError('O arquivo é muito grande. Limite máximo: 5MB');
      return false;
    }

    return true;
  };

  // Processar arquivo para preview
  const processFileForPreview = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      
      if (lines.length < 2) {
        setError('O arquivo CSV deve conter pelo menos um cabeçalho e uma linha de dados');
        return false;
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Verificar se tem colunas necessárias
      const requiredColumn = channel === 'whatsapp' 
        ? ['telefone', 'phone', 'celular', 'whatsapp'].some(col => headers.map(h => h.toLowerCase()).includes(col))
        : ['email', 'e-mail'].some(col => headers.map(h => h.toLowerCase()).includes(col));
      
      if (!requiredColumn) {
        setError(
          channel === 'whatsapp' 
            ? 'O CSV deve conter uma coluna de telefone/celular para envio via WhatsApp'
            : 'O CSV deve conter uma coluna de email para envio via email'
        );
        return false;
      }
      
      // Preparar dados para preview
      const preview = [];
      const maxPreviewRows = 5;
      
      for (let i = 1; i < Math.min(lines.length, maxPreviewRows + 1); i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        preview.push(row);
      }
      
      setPreviewData(preview);
      return true;
    } catch (error) {
      console.error('Erro ao processar CSV:', error);
      setError('Erro ao processar o arquivo CSV');
      return false;
    }
  };

  // Lidar com arquivo selecionado
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = event.target.files;
    
    if (files && files.length > 0) {
      const selectedFile = files[0];
      
      if (validateFile(selectedFile)) {
        const isValid = await processFileForPreview(selectedFile);
        
        if (isValid) {
          setFile(selectedFile);
          onFileSelected(selectedFile);
        }
      }
    }
  };

  // Lidar com drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    
    const files = e.dataTransfer.files;
    
    if (files && files.length > 0) {
      const droppedFile = files[0];
      
      if (validateFile(droppedFile)) {
        const isValid = await processFileForPreview(droppedFile);
        
        if (isValid) {
          setFile(droppedFile);
          onFileSelected(droppedFile);
        }
      }
    }
  };

  // Remover arquivo
  const handleRemoveFile = () => {
    setFile(null);
    setPreviewData([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileRemoved();
  };

  // Acionar seleção de arquivo
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full space-y-4">
      {!file ? (
        <>
          <div
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
            <h3 className="text-lg font-semibold mb-1">Upload do arquivo CSV</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Arraste e solte seu arquivo CSV aqui ou clique para selecionar
            </p>
            <div className="flex gap-2">
              <Button onClick={handleButtonClick}>
                Selecionar Arquivo
              </Button>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Baixar Modelo
              </Button>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertTitle>Erro no arquivo</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Nota:</strong> O arquivo CSV deve conter:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              {channel === 'whatsapp' ? (
                <>
                  <li>Uma coluna com números de telefone (telefone, celular, whatsapp, phone)</li>
                  <li>Preferencialmente uma coluna "nome" para personalização</li>
                  <li>Números no formato internacional (+5562XXXXXXXX) ou nacional (62XXXXXXXXX)</li>
                </>
              ) : (
                <>
                  <li>Uma coluna com endereços de email (email, e-mail)</li>
                  <li>Preferencialmente uma coluna "nome" para personalização</li>
                </>
              )}
              <li>Tamanho máximo: 5MB</li>
            </ul>
          </div>
        </>
      ) : (
        <FilePreview 
          file={file} 
          previewData={previewData} 
          onRemove={handleRemoveFile}
          isProcessing={isProcessing} 
        />
      )}
    </div>
  );
};

// Componente de preview do arquivo
const FilePreview: React.FC<FilePreviewProps> = ({ file, previewData, onRemove, isProcessing }) => {
  // Obter cabeçalhos das colunas
  const headers = previewData.length > 0 
    ? Object.keys(previewData[0]) 
    : [];
  
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">{file.name}</h3>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(2)} KB • {previewData.length > 0 ? `${previewData.length}+ registros` : 'Carregando...'}
            </p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onRemove}
          disabled={isProcessing}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Processando...</span>
            <span>Aguarde</span>
          </div>
          <Progress value={33} className="h-2" />
        </div>
      )}
      
      <div>
        <h4 className="text-sm font-medium mb-2">Prévia dos dados:</h4>
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.map((row, index) => (
                <TableRow key={index}>
                  {headers.map((header) => (
                    <TableCell key={`${index}-${header}`}>{row[header]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Mostrando {previewData.length} de {previewData.length}+ registros
        </p>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check className="h-4 w-4" />
        <span>Arquivo validado com sucesso</span>
      </div>
    </div>
  );
};

export default CSVUploader;
