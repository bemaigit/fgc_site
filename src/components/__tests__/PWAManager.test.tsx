import { render, screen } from '@testing-library/react'
import { PWAManager } from '../PWAManager'

// Mock do navigator.serviceWorker
const mockServiceWorker = {
  register: jest.fn().mockResolvedValue({
    waiting: null,
  }),
}

// Mock do window.workbox
const mockWorkbox = {
  addEventListener: jest.fn(),
}

describe('PWAManager', () => {
  beforeEach(() => {
    // Limpa todos os mocks
    jest.clearAllMocks()

    // Mock das APIs do navegador
    Object.defineProperty(window, 'navigator', {
      value: { serviceWorker: mockServiceWorker },
      writable: true,
    })

    Object.defineProperty(window, 'workbox', {
      value: mockWorkbox,
      writable: true,
    })

    // Mock do process.env
    process.env.NODE_ENV = 'production'
  })

  it('não deve renderizar nada quando online e sem atualizações', () => {
    render(<PWAManager />)
    
    // Não deve encontrar mensagens de offline ou atualização
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/nova versão/i)).not.toBeInTheDocument()
  })

  it('deve mostrar mensagem quando offline', () => {
    // Mock do navigator.onLine
    Object.defineProperty(window, 'navigator', {
      value: { 
        serviceWorker: mockServiceWorker,
        onLine: false 
      },
      writable: true,
    })

    render(<PWAManager />)
    
    // Deve mostrar mensagem de offline
    expect(screen.getByText(/você está offline/i)).toBeInTheDocument()
  })
})
