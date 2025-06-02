import { Footer } from '@/components/Footer'
import { prisma } from '@/lib/prisma'
import { FooterConfig, FooterMenu } from '@prisma/client'

type FooterResult = FooterConfig & {
  FooterMenu: FooterMenu[]
}

export async function HomeFooter() {
  const footerConfig = await prisma.footerConfig.findUnique({
    where: { id: 'default-footer' },
    include: {
      FooterMenu: {
        orderBy: {
          order: 'asc'
        }
      }
    }
  }) as FooterResult | null

  if (!footerConfig) {
    return null
  }

  const configWithMenus = {
    ...footerConfig,
    menus: footerConfig.FooterMenu
  }

  return <Footer config={configWithMenus} />
}
