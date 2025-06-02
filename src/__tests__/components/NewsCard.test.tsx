import { render, screen, fireEvent } from '@testing-library/react'
import { NewsCard } from '@/components/NewsCard'
import { usePermissions } from '@/hooks/core/usePermissions'

// Mock do hook de permissões
jest.mock('@/hooks/core/usePermissions')

describe('NewsCard', () => {
  const mockNews = {
    id: '1',
    title: 'Notícia de Teste',
    content: 'Conteúdo da notícia de teste',
    created_at: new Date().toISOString()
  }

  beforeEach(() => {
    // Configura o mock do hook de permissões
    ;(usePermissions as jest.Mock).mockReturnValue({
      canUpdate: () => true,
      canDelete: () => true
    })
  })

  it('deve renderizar o card com as informações corretas', () => {
    render(<NewsCard news={mockNews} />)
    
    expect(screen.getByText('Notícia de Teste')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo da notícia de teste')).toBeInTheDocument()
  })

  it('deve chamar onEdit quando o botão de editar for clicado', () => {
    const onEdit = jest.fn()
    render(<NewsCard news={mockNews} onEdit={onEdit} />)
    
    fireEvent.click(screen.getByText('Editar'))
    expect(onEdit).toHaveBeenCalledWith(mockNews)
  })

  it('deve chamar onDelete quando o botão de deletar for clicado', () => {
    const onDelete = jest.fn()
    render(<NewsCard news={mockNews} onDelete={onDelete} />)
    
    fireEvent.click(screen.getByText('Excluir'))
    expect(onDelete).toHaveBeenCalledWith(mockNews.id)
  })

  it('não deve mostrar botões de ação se usuário não tiver permissão', () => {
    // Altera o mock para retornar false nas permissões
    ;(usePermissions as jest.Mock).mockReturnValue({
      canUpdate: () => false,
      canDelete: () => false
    })

    render(<NewsCard news={mockNews} />)
    
    expect(screen.queryByText('Editar')).not.toBeInTheDocument()
    expect(screen.queryByText('Excluir')).not.toBeInTheDocument()
  })
})
