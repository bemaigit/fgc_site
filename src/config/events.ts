// Opções para filtros de eventos
export const modalities = ['Karatê', 'Judô', 'Jiu-jitsu', 'Taekwondo'] as const
export const categories = ['Infantil', 'Juvenil', 'Adulto', 'Master'] as const
export const genders = ['Masculino', 'Feminino', 'Misto'] as const

export type Modality = typeof modalities[number]
export type Category = typeof categories[number]
export type Gender = typeof genders[number]
