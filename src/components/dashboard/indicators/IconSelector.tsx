'use client'

import { useState } from 'react'
import { 
  FiActivity, FiAward, FiCalendar, FiUsers, FiMapPin, FiFlag, 
  FiTrendingUp, FiStar, FiTarget, FiShield,
  FiHeart, FiBriefcase, FiClock, FiThumbsUp, FiAperture, FiZap
} from 'react-icons/fi'

import {
  FaBicycle, FaRunning, FaSwimmer, FaMedal, FaTrophy, 
  FaStopwatch, FaShapes, FaMountain, FaRoute, FaMapMarkedAlt
} from 'react-icons/fa'

import {
  MdDirectionsBike, MdSportsScore, MdSportsHandball, MdEmojiEvents,
  MdOutlineSportsMotorsports, MdSportsMartialArts, MdTimer
} from 'react-icons/md'

// Definição de tipos para o mapeamento de ícones
type IconName = 
  // Feather Icons
  | 'users' | 'calendar' | 'map-pin' | 'award' | 'trending-up' | 'star' 
  | 'aperture' | 'map' | 'target' | 'shield' | 'activity' | 'heart' 
  | 'briefcase' | 'clock' | 'flag' | 'thumbs-up' | 'zap'
  // Font Awesome Icons
  | 'bicycle' | 'running' | 'swimmer' | 'medal' | 'trophy' 
  | 'stopwatch' | 'shapes' | 'mountain' | 'route' | 'map-marked'
  // Material Design Icons
  | 'bike' | 'score' | 'handball' | 'events' | 'motorsports' | 'martial-arts' | 'timer'

type IconComponentType = React.ComponentType<{ size?: number; className?: string }>

// Mapeamento de nomes de ícones para componentes React
const iconComponents: Record<IconName, IconComponentType> = {
  // Feather Icons (Fi)
  'users': FiUsers,
  'calendar': FiCalendar,
  'map-pin': FiMapPin,
  'award': FiAward,
  'trending-up': FiTrendingUp,
  'star': FiStar,
  'aperture': FiAperture, // Substituído trophy por aperture
  'map': FiMapPin, // FiMap não está disponível, usando FiMapPin
  'target': FiTarget,
  'shield': FiShield,
  'activity': FiActivity,
  'heart': FiHeart,
  'briefcase': FiBriefcase,
  'clock': FiClock,
  'flag': FiFlag,
  'thumbs-up': FiThumbsUp,
  'zap': FiZap,
  
  // Font Awesome Icons (Fa) - Esportes
  'bicycle': FaBicycle,
  'running': FaRunning,
  'swimmer': FaSwimmer,
  'medal': FaMedal,
  'trophy': FaTrophy,
  'stopwatch': FaStopwatch,
  'shapes': FaShapes,
  'mountain': FaMountain,
  'route': FaRoute,
  'map-marked': FaMapMarkedAlt,
  
  // Material Design Icons (Md) - Esportes
  'bike': MdDirectionsBike,
  'score': MdSportsScore,
  'handball': MdSportsHandball,
  'events': MdEmojiEvents,
  'motorsports': MdOutlineSportsMotorsports,
  'martial-arts': MdSportsMartialArts,
  'timer': MdTimer
}

interface IconSelectorProps {
  selectedIcon: string
  onSelectIcon: (icon: string) => void
}

export function IconSelector({ selectedIcon, onSelectIcon }: IconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'feather' | 'fontawesome' | 'material'>('all')
  
  // Componente para o ícone atual selecionado
  let SelectedIconComponent: IconComponentType | null = null
  if (selectedIcon && selectedIcon in iconComponents) {
    SelectedIconComponent = iconComponents[selectedIcon as IconName]
  }

  // Função de filtragem para exibir ícones por categoria
  const getFilteredIcons = () => {
    const allIcons = Object.entries(iconComponents) as [IconName, IconComponentType][]
    
    let filteredByCategory = allIcons
    if (selectedCategory === 'feather') {
      filteredByCategory = allIcons.filter(([name]) => 
        ['users', 'calendar', 'map-pin', 'award', 'trending-up', 'star', 
         'aperture', 'map', 'target', 'shield', 'activity', 'heart', 
         'briefcase', 'clock', 'flag', 'thumbs-up', 'zap'].includes(name)
      )
    } else if (selectedCategory === 'fontawesome') {
      filteredByCategory = allIcons.filter(([name]) => 
        ['bicycle', 'running', 'swimmer', 'medal', 'trophy', 
         'stopwatch', 'shapes', 'mountain', 'route', 'map-marked'].includes(name)
      )
    } else if (selectedCategory === 'material') {
      filteredByCategory = allIcons.filter(([name]) => 
        ['bike', 'score', 'handball', 'events', 'motorsports', 'martial-arts', 'timer'].includes(name)
      )
    }
    
    // Filtra por termo de busca se houver
    if (searchTerm.trim()) {
      return filteredByCategory.filter(([name]) => 
        name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    return filteredByCategory
  }

  return (
    <div className="relative">
      <div 
        className="border rounded-md p-2 flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          {SelectedIconComponent ? (
            <SelectedIconComponent className="mr-2 text-[#08285d]" size={20} />
          ) : (
            <span className="mr-2 text-gray-400">Selecione um ícone</span>
          )}
          <span className="text-sm">{selectedIcon || 'Nenhum ícone selecionado'}</span>
        </div>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-[400px] overflow-auto">
          {/* Área de busca e filtros */}
          <div className="p-2 border-b sticky top-0 bg-white z-20">
            <input
              type="text"
              placeholder="Buscar ícones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded-md mb-2 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="flex space-x-1 text-xs">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory('all');
                }}
                className={`px-2 py-1 rounded ${selectedCategory === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
              >
                Todos
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory('feather');
                }}
                className={`px-2 py-1 rounded ${selectedCategory === 'feather' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
              >
                Gerais
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory('fontawesome');
                }}
                className={`px-2 py-1 rounded ${selectedCategory === 'fontawesome' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
              >
                Esportes 1
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory('material');
                }}
                className={`px-2 py-1 rounded ${selectedCategory === 'material' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
              >
                Esportes 2
              </button>
            </div>
          </div>
          
          <div className="p-2 grid grid-cols-4 gap-2">
            {/* Opção para remover ícone */}
            <div 
              className={`p-2 rounded-md cursor-pointer flex flex-col items-center justify-center ${
                !selectedIcon ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100'
              }`}
              onClick={() => {
                onSelectIcon('')
                setIsOpen(false)
              }}
            >
              <div className="w-6 h-6 flex items-center justify-center text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-xs mt-1 text-center">Nenhum</span>
            </div>
            
            {/* Lista de ícones disponíveis */}
            {getFilteredIcons().map(([iconName, IconComponent]) => (
              <div 
                key={iconName}
                className={`p-2 rounded-md cursor-pointer flex flex-col items-center justify-center ${
                  selectedIcon === iconName ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100'
                }`}
                onClick={() => {
                  onSelectIcon(iconName)
                  setIsOpen(false)
                }}
              >
                <IconComponent className="text-[#08285d]" size={24} />
                <span className="text-xs mt-1 text-center">{iconName}</span>
              </div>
            ))}
            
            {/* Mensagem quando não há resultados */}
            {getFilteredIcons().length === 0 && (
              <div className="col-span-4 p-4 text-center text-gray-500">
                Nenhum ícone encontrado para &quot;{searchTerm}&quot;.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
