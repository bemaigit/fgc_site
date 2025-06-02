import {
  BringToFront,
  FolderKanban,
  Image,
  Users,
  ScrollText,
  LineChart,
  Settings,
  AreaChart,
  Award,
  Trophy,
  Link,
  Newspaper,
  Gem,
  MessageSquare,
  Gift,
  FileImage
} from 'lucide-react'

export const dashboardMenu = [
  {
    title: 'Gestão de Conteúdo',
    items: [
      {
        label: 'Notícias',
        href: '/dashboard/noticias',
        icon: Newspaper,
        roles: ['ADMIN', 'SUPER_ADMIN']
      },
      {
        label: 'Galeria de Imagens',
        href: '/dashboard/galeria',
        icon: FileImage,
        roles: ['ADMIN', 'SUPER_ADMIN']
      },
      {
        label: 'Banner Principal',
        href: '/dashboard/banner',
        icon: BringToFront,
        roles: ['ADMIN', 'SUPER_ADMIN']
      },
      {
        label: 'Banners Pequenos',
        href: '/dashboard/small-banner',
        icon: Image,
        roles: ['ADMIN', 'SUPER_ADMIN']
      },
      {
        label: 'Banner Conheça Atletas',
        href: '/dashboard/atletas-banner',
        icon: Users,
        roles: ['ADMIN', 'SUPER_ADMIN']
      },
      {
        label: 'Links Úteis',
        href: '/dashboard/links',
        icon: Link,
        roles: ['ADMIN', 'SUPER_ADMIN']
      },
      {
        label: 'Parceiros',
        href: '/dashboard/parceiros',
        icon: Gift,
        roles: ['ADMIN', 'SUPER_ADMIN']
      },
      {
        label: 'Documentos',
        href: '/dashboard/documentos',
        icon: ScrollText,
        roles: ['ADMIN', 'SUPER_ADMIN']
      }
    ]
  },
  {
    title: 'Gestão de Eventos',
    items: [
      {
        label: 'Eventos',
        href: '/dashboard/eventos',
        icon: FolderKanban,
        roles: ['ADMIN', 'SUPER_ADMIN']
      },
      {
        label: 'Inscrições',
        href: '/dashboard/inscricoes',
        icon: Users,
        roles: ['ADMIN', 'SUPER_ADMIN']
      }
    ]
  },
  {
    title: 'Rankings e Resultados',
    items: [
      {
        label: 'Rankings',
        href: '/dashboard/rankings',
        icon: LineChart,
        roles: ['ADMIN', 'SUPER_ADMIN']
      },
      {
        label: 'Etapas',
        href: '/dashboard/etapas',
        icon: AreaChart,
        roles: ['ADMIN', 'SUPER_ADMIN']
      },
      {
        label: 'Campeões',
        href: '/dashboard/campeoes',
        icon: Trophy,
        roles: ['ADMIN', 'SUPER_ADMIN']
      }
    ]
  },
  {
    title: 'Filiação',
    items: [
      {
        label: 'Atletas',
        href: '/dashboard/atletas',
        icon: Users,
        roles: ['ADMIN', 'SUPER_ADMIN']
      },
      {
        label: 'Clubes',
        href: '/dashboard/clubes',
        icon: Award,
        roles: ['ADMIN', 'SUPER_ADMIN']
      },
      {
        label: 'Modalidades',
        href: '/dashboard/modalidades',
        icon: Gem,
        roles: ['ADMIN', 'SUPER_ADMIN']
      }
    ]
  },
  {
    title: 'Sistema',
    items: [
      {
        label: 'Configurações',
        href: '/dashboard/configuracoes',
        icon: Settings,
        roles: ['SUPER_ADMIN']
      },
      {
        label: 'Notificações',
        href: '/dashboard/notificacoes',
        icon: MessageSquare,
        roles: ['SUPER_ADMIN']
      }
    ]
  }
]
