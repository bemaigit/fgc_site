interface AddressResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export async function fetchAddressByCep(cep: string) {
  try {
    // Limpa qualquer caractere que não seja número
    const cleanedCep = cep.replace(/\D/g, '');
    
    // Se o CEP não tiver 8 dígitos após a limpeza, não faz nada
    if (cleanedCep.length !== 8) {
      return;
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
    
    if (!response.ok) {
      return;
    }
    
    const data: AddressResponse = await response.json();
    
    if (data.erro) {
      return;
    }

    return {
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf
    };
  } catch (error) {
    console.error('Erro na busca de CEP:', error);
    return;
  }
}
