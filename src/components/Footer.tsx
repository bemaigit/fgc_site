import { FooterConfig, FooterMenu } from '@prisma/client'
import Link from 'next/link'
import Image from 'next/image'
import { processFooterLogoUrl } from '@/lib/processFooterLogoUrl'

interface FooterProps {
  config: FooterConfig & {
    menus: FooterMenu[]
  }
}

export function Footer({ config }: FooterProps) {
  return (
    <footer
      style={{ backgroundColor: config.background }}
      className="w-full py-4 md:py-8"
    >
      <div className="container mx-auto px-4">
        {/* Seção Principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8 mb-4 md:mb-8">
          {/* Coluna 1: Logo e Descrição */}
          <div className="flex flex-col items-center md:items-start">
            <Link href="/">
              <Image
                src={config.logo ? processFooterLogoUrl(config.logo) : '/images/logo-fgc.png'}
                alt="Logo FGC"
                width={120}
                height={30}
                className="h-[22px] md:h-[30px] w-auto mb-2 md:mb-4"
              />
            </Link>
            <p 
              className="text-xs md:text-sm text-center md:text-left"
              style={{ color: config.textColor }}
            >
              A Federação Goiana de Ciclismo<br />
              é a entidade máxima do ciclismo<br />
              no estado de Goiás.
            </p>
            <div className="mt-4 text-xs text-center md:text-left" style={{ color: config.textColor }}>
              <p>CNPJ: {config.cnpj || "XX.XXX.XXX/0001-XX"}</p>
              <p>Endereço: {config.endereco || "Rua XX, nº XXX"}</p>
              <p>{config.cidade || "Goiânia"} - {config.estado || "GO"}</p>
            </div>
          </div>

          {/* Coluna 2: Links Principais */}
          <div>
            <h3 
              className="text-sm md:text-lg font-semibold mb-2 md:mb-4 text-center md:text-left"
              style={{ color: config.textColor }}
            >
              Links Principais
            </h3>
            <nav className="flex flex-row flex-wrap justify-center md:justify-start gap-x-4 gap-y-1">
              {config.menus
                .filter(menu => menu.isActive)
                .sort((a, b) => a.order - b.order)
                .slice(0, Math.ceil(config.menus.length / 2))
                .map(menu => (
                  <Link
                    key={menu.id}
                    href={menu.url}
                    style={{ 
                      color: config.textColor,
                      transition: 'color 0.2s ease-in-out'
                    }}
                    className="text-xs md:text-sm hover:opacity-80"
                  >
                    {menu.label}
                  </Link>
                ))}
            </nav>
          </div>

          {/* Coluna 3: Links Adicionais */}
          <div>
            <h3 
              className="text-sm md:text-lg font-semibold mb-2 md:mb-4 text-center md:text-left"
              style={{ color: config.textColor }}
            >
              Links Adicionais
            </h3>
            <nav className="flex flex-row flex-wrap justify-center md:justify-start gap-x-4 gap-y-1">
              {config.menus
                .filter(menu => menu.isActive)
                .sort((a, b) => a.order - b.order)
                .slice(Math.ceil(config.menus.length / 2))
                .map(menu => (
                  <Link
                    key={menu.id}
                    href={menu.url}
                    style={{ 
                      color: config.textColor,
                      transition: 'color 0.2s ease-in-out'
                    }}
                    className="text-xs md:text-sm hover:opacity-80"
                  >
                    {menu.label}
                  </Link>
                ))}
            </nav>
          </div>

          {/* Coluna 4: Legal e Contato */}
          <div>
            <h3 
              className="text-sm md:text-lg font-semibold mb-2 md:mb-4 text-center md:text-left"
              style={{ color: config.textColor }}
            >
              Legal
            </h3>
            <nav className="flex flex-row flex-wrap justify-center md:justify-start gap-x-4 gap-y-1">
              <Link
                href="/legal/politica-privacidade"
                style={{ color: config.textColor }}
                className="text-xs md:text-sm hover:opacity-80"
              >
                Política de Privacidade
              </Link>
              <Link
                href="/legal/termos-uso"
                style={{ color: config.textColor }}
                className="text-xs md:text-sm hover:opacity-80"
              >
                Termos de Uso
              </Link>
              <Link
                href="/legal/lgpd"
                style={{ color: config.textColor }}
                className="text-xs md:text-sm hover:opacity-80"
              >
                LGPD
              </Link>
            </nav>

            <h3 
              className="text-sm md:text-lg font-semibold mt-4 mb-2 md:mb-4 text-center md:text-left"
              style={{ color: config.textColor }}
            >
              Contato
            </h3>
            <div className="flex flex-col items-center md:items-start gap-1">
              <a
                href="mailto:contato@fgc.org.br"
                style={{ color: config.textColor }}
                className="text-xs md:text-sm hover:opacity-80"
              >
                contato@fgc.org.br
              </a>
              <a
                href="tel:+556230000000"
                style={{ color: config.textColor }}
                className="text-xs md:text-sm hover:opacity-80"
              >
                (62) 3000-0000
              </a>
              <a
                href="https://wa.me/5562900000000"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: config.textColor }}
                className="text-xs md:text-sm hover:opacity-80"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Linha Divisória */}
        <div 
          className="w-full h-px mb-4 md:mb-6"
          style={{ backgroundColor: `${config.textColor}20` }}
        />

        {/* Copyright e Redes Sociais */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4">
          <div 
            className="text-xs md:text-sm text-center md:text-left"
            style={{ color: config.textColor }}
          >
            {new Date().getFullYear()} Federação Goiana de Ciclismo. Todos os direitos reservados.
          </div>
          
          {/* Redes Sociais */}
          <div className="flex gap-4">
            <Link
              href="https://www.instagram.com/fgc.ciclismo/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: config.textColor }}
              className="hover:opacity-80"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </Link>
            <Link
              href="https://www.facebook.com/FGCiclismo/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: config.textColor }}
              className="hover:opacity-80"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
