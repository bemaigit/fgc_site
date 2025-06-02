import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EventBasicInfoEditor } from '@/components/dashboard/events/basic/EventBasicInfoEditor'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Criar um cliente de query para testes
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

// Wrapper com os providers necessários
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
)

describe('EventBasicInfoEditor', () => {
  beforeEach(() => {
    // Limpar o queryClient entre os testes
    queryClient.clear()
  })

  it('deve renderizar todos os campos corretamente', () => {
    render(<EventBasicInfoEditor />, { wrapper })

    // Verificar campos obrigatórios
    expect(screen.getByLabelText(/título/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/url personalizada/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/data de início/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/data de término/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/data limite de inscrição/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/evento gratuito/i)).toBeInTheDocument()
  })

  it('deve gerar slug automático quando título é digitado', async () => {
    render(<EventBasicInfoEditor />, { wrapper })

    const titleInput = screen.getByLabelText(/título/i)
    const slugInput = screen.getByLabelText(/url personalizada/i)

    fireEvent.change(titleInput, { target: { value: 'Meu Evento Teste' } })

    await waitFor(() => {
      expect(slugInput).toHaveValue('meu-evento-teste')
    })
  })

  it('deve permitir edição manual do slug', async () => {
    render(<EventBasicInfoEditor />, { wrapper })

    const slugInput = screen.getByLabelText(/url personalizada/i)

    fireEvent.change(slugInput, { target: { value: 'meu-slug-customizado' } })

    await waitFor(() => {
      expect(slugInput).toHaveValue('meu-slug-customizado')
    })
  })

  it('deve mostrar erro quando campos obrigatórios estão vazios', async () => {
    const onSave = jest.fn()
    render(<EventBasicInfoEditor onSave={onSave} />, { wrapper })

    const submitButton = screen.getByRole('button', { name: /salvar/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/título deve ter no mínimo 3 caracteres/i)).toBeInTheDocument()
      expect(screen.getByText(/descrição deve ter no mínimo 10 caracteres/i)).toBeInTheDocument()
      expect(onSave).not.toHaveBeenCalled()
    })
  })

  it('deve validar datas relacionadas', async () => {
    render(<EventBasicInfoEditor />, { wrapper })

    // Definir data de início depois da data de término
    const startDateInput = screen.getByLabelText(/data de início/i)
    const endDateInput = screen.getByLabelText(/data de término/i)

    fireEvent.change(startDateInput, { target: { value: '2025-12-31' } })
    fireEvent.change(endDateInput, { target: { value: '2025-12-30' } })

    await waitFor(() => {
      expect(screen.getByText(/a data de término deve ser após a data de início/i)).toBeInTheDocument()
    })
  })
})
