import {
  Home,
  Users,
  FolderOpen,
  Calendar,
  FileText,
  BarChart2
} from 'lucide-react'

export const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Notícias', href: '/dashboard/noticias', icon: FileText },
  { name: 'Eventos', href: '/dashboard/eventos', icon: Calendar },
  { name: 'Documentos', href: '/dashboard/documentos', icon: FolderOpen },
  { name: 'Usuários', href: '/dashboard/usuarios', icon: Users },
  { name: 'Relatórios', href: '/dashboard/relatorios', icon: BarChart2 }
]
