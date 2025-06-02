import { ComponentType } from 'react'

export type IconName = 'users' | 'calendar' | 'map-pin' | 'award' | 'trending-up' | 'star' | 
                'aperture' | 'map' | 'target' | 'shield' | 'activity' | 'heart' | 
                'briefcase' | 'clock' | 'flag' | 'thumbs-up' | 'zap'

export type IconComponentType = ComponentType<{ size?: number; className?: string }>

export interface IconSelectorProps {
  selectedIcon: string
  onSelectIcon: (icon: string) => void
}

export declare function IconSelector(props: IconSelectorProps): JSX.Element
