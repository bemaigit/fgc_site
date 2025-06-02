'use client'

import { motion } from 'framer-motion'
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

interface IndicatorProps {
  title: string
  subtitle?: string
  value: string
  icon?: string
  backgroundColor?: string
  textColor?: string
  iconColor?: string
}

// Mapeamento de nomes de ícones para componentes React
const iconComponents = {
  // Feather Icons (Fi)
  'users': FiUsers,
  'calendar': FiCalendar,
  'map-pin': FiMapPin,
  'award': FiAward,
  'trending-up': FiTrendingUp,
  'star': FiStar,
  'aperture': FiAperture,
  'map': FiMapPin, // Usando FiMapPin como alternativa
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

export function IndicatorCard({ 
  title, 
  subtitle, 
  value, 
  icon, 
  backgroundColor = '#ffffff', 
  textColor = '#000000',
  iconColor = '#08285d' 
}: IndicatorProps) {
  // Debug: visualizar propriedades
  console.log('IndicatorCard props:', { title, subtitle, value, textColor });

  // Renderiza o ícone dinamicamente baseado no nome
  const renderIcon = () => {
    if (!icon) return null;
    
    const IconComponent = iconComponents[icon as keyof typeof iconComponents];
    if (IconComponent) {
      return (
        <div className="scale-[var(--indicator-icon-scale,0.75)]">
          <IconComponent size="1em" className="text-[calc(0.6rem+0.35vw)]" color={iconColor} />
        </div>
      );
    }
    
    return null;
  };

  return (
    <motion.div 
      className="rounded-lg shadow-sm overflow-hidden h-full text-[calc(0.35rem+0.3vw)]"
      style={{ 
        backgroundColor, 
        color: textColor,
        // Aumentando o texto numeral mas mantendo outros elementos reduzidos
        '--indicator-value-scale': 'clamp(0.85rem, 0.7rem + 0.45vw, 1.3rem)',
        '--indicator-title-scale': 'clamp(0.55rem, 0.42rem + 0.24vw, 0.72rem)',
        '--indicator-subtitle-scale': 'clamp(0.42rem, 0.36rem + 0.18vw, 0.6rem)',
        '--indicator-icon-scale': 'clamp(0.45, 0.39 + 0.18vw, 0.6)'
      } as React.CSSProperties}
    >
      <div className="p-1.5 sm:p-2 flex flex-col h-auto">
        <div className="flex items-center mb-1">
          <div className="mr-2">
            {renderIcon()}
          </div>
          <h3 className="leading-tight font-bold tracking-tight" style={{ 
            fontSize: 'var(--indicator-value-scale)',
            display: 'block',
            visibility: 'visible',
            letterSpacing: '-0.02em'
          }}>{value}</h3>
        </div>
        
        <div className="w-full flex flex-col mb-0">
          <div style={{ marginBottom: '1px' }}>
            <h4 className="font-medium block" style={{ 
              fontSize: 'var(--indicator-title-scale)',
              maxWidth: '100%',
              lineHeight: 1.2
            }}>{title}</h4>
          </div>
          
          {subtitle && (
            <div>
              <p className="font-normal block" style={{ 
                fontSize: 'var(--indicator-subtitle-scale)',
                maxWidth: '100%',
                lineHeight: 1.2
              }}>{subtitle}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
