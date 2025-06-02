'use client'

import { useEffect, useState } from 'react'
import { Workbox } from 'workbox-window'

export function PWAManager() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Verifica se o navegador suporta Service Worker
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined &&
      process.env.NODE_ENV === 'production'
    ) {
      const wb = new Workbox('/sw.js')

      // Notifica quando há uma atualização disponível
      wb.addEventListener('waiting', () => {
        setIsUpdateAvailable(true)
      })

      // Registra o service worker
      wb.register()
        .then((r) => {
          setRegistration(r)
          console.log('Service Worker registrado com sucesso')
        })
        .catch((err) => {
          console.error('Erro ao registrar Service Worker:', err)
        })

      // Monitora o estado da conexão
      setIsOnline(navigator.onLine)
      window.addEventListener('online', () => setIsOnline(true))
      window.addEventListener('offline', () => setIsOnline(false))
    }
  }, [])

  // Função para atualizar o PWA
  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      // Envia mensagem para o Service Worker atualizar
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      
      // Recarrega a página para aplicar as atualizações
      window.location.reload()
    }
  }

  // Solicita permissão para notificações
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        // Registra para push notifications se necessário
        if (registration) {
          try {
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            })
            console.log('Push Notification subscription:', subscription)
          } catch (err) {
            console.error('Erro ao registrar push notifications:', err)
          }
        }
      }
    }
  }

  // Renderiza notificações e botões de atualização quando necessário
  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-lg">
        <p className="font-bold">Você está offline</p>
        <p className="text-sm">Algumas funcionalidades podem estar indisponíveis</p>
      </div>
    )
  }

  if (isUpdateAvailable) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-lg">
        <p className="font-bold">Nova versão disponível!</p>
        <p className="text-sm">Atualize para ter acesso às últimas funcionalidades</p>
        <button
          onClick={updateServiceWorker}
          className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Atualizar agora
        </button>
      </div>
    )
  }

  return null
}
