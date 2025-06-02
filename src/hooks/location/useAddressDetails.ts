import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface AddressDetails {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
}

export function useAddressDetails(zipCode: string | null) {
  const { toast } = useToast();
  const [addressDetails, setAddressDetails] = useState<AddressDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddressDetails = useCallback(async (cep: string) => {
    try {
      setIsLoading(true);
      // Remove caracteres não numéricos do CEP
      const cleanCep = cep.replace(/\D/g, '');
      
      if (cleanCep.length !== 8) {
        throw new Error('CEP inválido');
      }

      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      setAddressDetails(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar detalhes do endereço:', err);
      setAddressDetails(null);
      setError(err instanceof Error ? err.message : 'Erro ao buscar detalhes do endereço');
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao buscar detalhes do endereço',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (zipCode && zipCode.length >= 8) {
      fetchAddressDetails(zipCode);
    } else {
      setAddressDetails(null);
    }
  }, [zipCode, fetchAddressDetails]);

  return {
    addressDetails,
    isLoading,
    error,
    refetch: fetchAddressDetails,
  };
}
