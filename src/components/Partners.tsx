'use client'

import { useState, useEffect } from 'react'
import './Partners.css'
import { processPartnerImageUrl } from '@/lib/processPartnerImageUrl'

interface Partner {
  id: string
  name: string
  logo: string
  link?: string | null
  order: number
  active: boolean
}

export function Partners() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await fetch('/api/public/partners')
        if (!response.ok) throw new Error('Erro ao buscar parceiros')
        const data = await response.json()
        setPartners(data)
      } catch (error) {
        console.error('Erro ao buscar parceiros:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPartners()
  }, [])

  if (loading) return null
  if (!partners || partners.length === 0) return null

  return (
    <section className="partners-section bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#08285d]">Parceiros</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Conheça as empresas e instituições que apoiam o ciclismo goiano</p>
        </div>
        <div className="partners-grid">
          {partners.map((partner) => (
            <div key={partner.id} className="partner-item">
              {partner.link ? (
                <a 
                  href={partner.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={partner.name}
                  className="partner-link"
                >
                  <img
                    src={partner.logo ? processPartnerImageUrl(partner.logo) : '/images/partner-placeholder.jpg'}
                    alt={partner.name}
                    loading="lazy"
                    className="partner-logo"
                  />
                </a>
              ) : (
                <img
                  src={partner.logo ? processPartnerImageUrl(partner.logo) : '/images/partner-placeholder.jpg'}
                  alt={partner.name}
                  loading="lazy"
                  className="partner-logo"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
