'use client'

import { useState, useEffect } from 'react'
import './SmallBanners.css'

interface SmallBanner {
  id: string
  title: string
  image: string
  link?: string | null
  position: number
  active: boolean
}

export function SmallBanners() {
  const [banners, setBanners] = useState<SmallBanner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch('/api/small-banners')
        if (!response.ok) throw new Error('Erro ao buscar banners')
        const data = await response.json()
        setBanners(data)
      } catch (error) {
        console.error('Erro ao buscar banners:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [])

  if (loading) return null
  if (!banners || banners.length === 0) return null

  return (
    <div className="small-banners-container">
      <div className="small-banners-grid">
        {banners.map((banner) => (
          <div key={banner.id} className="small-banner">
            {banner.link ? (
              <a 
                href={banner.link} 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label={banner.title}
              >
                <img
                  src={banner.image}
                  alt={banner.title}
                  loading="lazy"
                />
              </a>
            ) : (
              <img
                src={banner.image}
                alt={banner.title}
                loading="lazy"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}