export interface AddressData {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

export interface RegistrationDetails {
  id: string
  protocol: string
  eventId: string
  eventTitle: string
  eventStartDate?: string
  eventEndDate?: string
  name: string
  email: string
  cpf: string | null
  phone: string | null
  birthdate: Date | null
  modalityid: string | null
  categoryid: string | null
  genderid: string | null
  tierid: string | null
  modalityName?: string
  categoryName?: string
  genderName?: string
  tierName?: string
  addressdata: AddressData | null
  status: string
  createdAt: Date
  isFree: boolean
  price?: number
  originalPrice?: number
  discountAmount?: number
  discountPercentage?: number
  couponCode?: string | null
  paidAmount?: number
  paymentMethod?: string
  paymentDate?: Date
}
