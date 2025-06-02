'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, ChevronRight, LayoutDashboard, Image as ImageIcon, BarChart, Users, Calendar, Newspaper, Trophy, FileText, Handshake, Settings, Home, X, Tag, Layers, FileImage, Bell, MessageSquare } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  onClose?: () => void;
}

interface MenuItem {
  title: string
  icon?: React.ReactNode
  href?: string
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    title: 'Gestão de Conteúdo',
    icon: <LayoutDashboard className="w-5 h-5" />,
    children: [
      { title: 'Header', icon: <ImageIcon className="w-5 h-5" />, href: '/dashboard/header' },
      { title: 'Banners', icon: <ImageIcon className="w-5 h-5" />, children: [
        { title: 'Banner Principal', href: '/dashboard/banners' },
        { title: 'Banner Menor', href: '/dashboard/banners/menor' },
        { title: 'Banner Conheça Atletas', href: '/dashboard/atletas-banner' }
      ]},
      { title: 'Galeria de Imagens', icon: <FileImage className="w-5 h-5" />, href: '/dashboard/galeria' },
      { title: 'Indicadores', icon: <BarChart className="w-5 h-5" />, href: '/dashboard/indicadores' },
      { title: 'Filia-se', icon: <Users className="w-5 h-5" />, href: '/dashboard/filiase' },
      { 
        title: 'Filiação Clube', 
        icon: <Handshake className="w-5 h-5" />, 
        children: [
          { title: 'Gerenciamento', href: '/dashboard/filiase/clube' },
          { title: 'Taxas', href: '/dashboard/filiase/clube-taxas' }
        ]
      }
    ]
  },
  {
    title: 'Eventos e Notícias',
    icon: <Calendar className="w-5 h-5" />,
    children: [
      { 
        title: 'Eventos',
        icon: <Calendar className="w-5 h-5" />,
        children: [
          { title: 'Lista de Eventos', href: '/dashboard/eventos' },
          { title: 'Modalidades', icon: <Tag className="w-5 h-5" />, href: '/dashboard/events/modalities' },
          { title: 'Categorias', icon: <Layers className="w-5 h-5" />, href: '/dashboard/events/categories' },
          { title: 'Configurações', icon: <Settings className="w-5 h-5" />, href: '/dashboard/eventos/configuracoes' }
        ]
      },
      { title: 'Notícias', icon: <Newspaper className="w-5 h-5" />, href: '/dashboard/noticias' },
      { title: 'Calendário', icon: <Calendar className="w-5 h-5" />, href: '/dashboard/calendario' }
    ]
  },
  {
    title: 'Competição',
    icon: <Trophy className="w-5 h-5" />,
    children: [
      { title: 'Rankings', href: '/dashboard/rankings' },
      { title: 'Gerenciar Atletas', icon: <Users className="w-5 h-5" />, href: '/dashboard/manage-athletes' },
      { title: 'Campeões Goianos', href: '/dashboard/campeoes' }
    ]
  },
  {
    title: 'Institucional',
    icon: <FileText className="w-5 h-5" />,
    children: [
      { title: 'Documentos', href: '/dashboard/documentos' },
      { title: 'Parceiros', icon: <Handshake className="w-5 h-5" />, href: '/dashboard/institucional/parceiros' },
      { title: 'Patrocinadores', icon: <Handshake className="w-5 h-5" />, href: '/dashboard/institucional/patrocinadores' }
    ]
  },
  {
    title: 'Sistema',
    icon: <Settings className="w-5 h-5" />,
    children: [
      { title: 'Footer', href: '/dashboard/footer' },
      { title: 'Configurações', href: '/dashboard/configuracoes' },
      { 
        title: 'Notificações', 
        icon: <Bell className="w-5 h-5" />, 
        children: [
          { title: 'Painel', href: '/dashboard/notificacoes' },
          { title: 'Configurações', href: '/dashboard/notificacoes/configuracoes' },
          { title: 'Envio Individual', href: '/dashboard/notificacoes/envio-individual' },
          { title: 'Envio em Massa', href: '/dashboard/notificacoes/envio-massa' }
        ]
      }
    ]
  }
]

export function Sidebar({ isOpen, setIsOpen, onClose }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // Fecha o menu ao mudar o tamanho da tela para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Usar setIsOpen se disponível, caso contrário, tentar onClose
        if (setIsOpen) {
          setIsOpen(false);
        } else if (onClose) {
          onClose();
        }
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setIsOpen, onClose])

  const toggleItem = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title)
    
    return (
      <div key={item.title} className="w-full">
        <div
          onClick={() => hasChildren && toggleItem(item.title)}
          className={`
            flex items-center px-4 py-3 text-sm text-gray-100 hover:bg-[#0A3171] transition-colors duration-200
            ${level > 0 ? 'pl-' + (level * 4 + 4) : ''}
            ${item.href ? 'hover:bg-[#0A3171]' : ''}
          `}
        >
          {item.icon && <span className="mr-2 opacity-80">{item.icon}</span>}
          {item.href ? (
            <Link href={item.href} className="flex-1">
              {item.title}
            </Link>
          ) : (
            <span className="flex-1 font-medium">{item.title}</span>
          )}
          {hasChildren && (
            <span className="ml-auto text-gray-400">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1 bg-[#061D43]">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 h-screen bg-[#08285d] flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-[#0A3171]">
          <div className="relative h-10 w-full">
            <Image
              src="/images/logo-fgc.png"
              alt="FGC Logo"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 256px"
            />
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#0A3171] rounded-lg lg:hidden"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <Link 
          href="/"
          target="_blank"
          className="flex items-center px-4 py-4 text-sm text-white hover:bg-[#0A3171] transition-colors duration-200 border-b border-[#0A3171]"
        >
          <Home className="w-5 h-5 mr-2" />
          Visualizar Site
        </Link>

        <div className="flex-1 overflow-y-auto py-2 space-y-2">
          {menuItems.map(item => renderMenuItem(item))}
        </div>
      </div>
    </>
  )
}
