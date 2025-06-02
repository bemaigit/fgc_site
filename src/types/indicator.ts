export interface Indicator {
  id: string
  title: string
  subtitle?: string
  value: string
  icon: string
  iconColor: string
  backgroundColor: string
  textColor: string
  order: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface IndicatorFormData {
  title: string
  subtitle?: string
  value: string
  icon: string
  iconColor: string
  backgroundColor: string
  textColor: string
  order?: number
  active?: boolean
}
