'use client'

import { useState, useEffect } from 'react'
import AtletasBannerEditor from './AtletasBannerEditor'

export default function AtletasBannerPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Banner Conheça Nossos Atletas</h1>
      <p className="text-gray-600 mb-6">
        Configure o banner da seção "Conheça Nossos Atletas" que será exibido na página inicial.
      </p>
      <AtletasBannerEditor />
    </div>
  )
}
