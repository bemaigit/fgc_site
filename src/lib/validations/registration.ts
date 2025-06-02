import { z } from 'zod'

// Validação de CPF
function validateCPF(cpf: string) {
  cpf = cpf.replace(/[^\d]+/g, '')
  
  if (cpf.length !== 11) return false
  
  // Elimina CPFs inválidos conhecidos
  if (/^(\d)\1{10}$/.test(cpf)) return false
  
  // Valida 1o dígito	
  let add = 0
  for (let i = 0; i < 9; i++) {
    add += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let rev = 11 - (add % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cpf.charAt(9))) return false
  
  // Valida 2o dígito
  add = 0
  for (let i = 0; i < 10; i++) {
    add += parseInt(cpf.charAt(i)) * (11 - i)
  }
  rev = 11 - (add % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cpf.charAt(10))) return false
  
  return true
}

// Validação de telefone
function validatePhone(phone: string) {
  phone = phone.replace(/[^\d]+/g, '')
  return phone.length >= 10 && phone.length <= 11
}

// Validação de CEP
function validateCEP(cep: string) {
  // Remove caracteres não numéricos
  const cepNumbers = cep.replace(/[^\d]+/g, '');
  
  // Verifica se tem 8 dígitos
  return cepNumbers.length === 8;
}

// Schema do CEP
export const addressSchema = z.object({
  cep: z.string()
    .refine(validateCEP, 'CEP inválido')
    .transform(val => val.replace(/[^\d]+/g, '')), // Normaliza o CEP removendo caracteres não numéricos
  street: z.string().min(3, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(3, 'Bairro é obrigatório'),
  city: z.string().min(3, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado inválido')
})

// Schema principal do formulário de inscrição
export const registrationFormSchema = z.object({
  // Dados pessoais
  name: z.string().min(3, 'Nome completo é obrigatório'),
  cpf: z.string().refine(validateCPF, 'CPF inválido'),
  birthDate: z.string()
    .refine(val => {
      // Verifica se a string não está vazia
      if (!val) return false;
      
      // Tenta converter para Date e verifica se é válida
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Data de nascimento é obrigatória')
    .transform(val => new Date(val)), // Transforma a string em Date após validação
  
  // Contato
  email: z.string().email('Email inválido'),
  phone: z.string().refine(validatePhone, 'Telefone inválido'),
  
  // Endereço
  address: addressSchema,
  
  // Dados do evento
  eventId: z.string().min(1, 'ID do evento é obrigatório'),
  modalityId: z.string().min(1, 'Modalidade é obrigatória'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  genderId: z.string().min(1, 'Gênero é obrigatório'),
  tierId: z.string().min(1, 'Lote é obrigatório')
})

export type RegistrationFormData = z.infer<typeof registrationFormSchema>
