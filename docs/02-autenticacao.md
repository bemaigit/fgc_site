# Sistema de Autenticação

## Visão Geral

O sistema de autenticação da Plataforma FGC foi desenvolvido com foco em segurança e usabilidade, utilizando NextAuth.js como provedor de autenticação e Prisma para persistência dos dados.

## Páginas de Autenticação

### Login (`/auth/login`)
- Email e senha
- Opção "Lembrar-me"
- Link para recuperação de senha
- Redirecionamento para registro
- Validação em tempo real
- Feedback visual de erros

### Registro (`/auth/register`)
- Nome de usuário
- Email
- Senha com confirmação
- Validações:
  - Email válido
  - Senha forte
  - Username único
  - Confirmação de senha

### Recuperação de Senha (`/auth/forgot-password`)
- Formulário de email
- Envio de link de recuperação
- Feedback de sucesso
- Validação de email

## Componentes

### PasswordInput
```typescript
interface PasswordInputProps {
  id: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  error?: string
}
```

Características:
- Toggle de visibilidade
- Feedback de erro
- Estilização consistente
- Acessibilidade

## Fluxos de Autenticação

### Login
1. Usuário insere credenciais
2. Validação client-side com Zod
3. Requisição ao NextAuth
4. Armazenamento de sessão
5. Redirecionamento

### Registro
1. Preenchimento do formulário
2. Validações em tempo real
3. Criação de conta via API Route
4. Criação de perfil no Prisma
5. Login automático via NextAuth

### Recuperação de Senha
1. Solicitação de reset
2. Envio de email via API Route
3. Token de reset seguro
4. Reset de senha
5. Login automático

## Proteção de Rotas

### Middleware
```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token
  },
  pages: {
    signIn: '/auth/login'
  }
})

export const config = {
  matcher: ['/dashboard/:path*']
}
```

### Contexto de Autenticação
- SessionProvider do NextAuth
- useSession hook
- Estado de loading
- Informações do usuário

## Segurança

### Validações
- Senhas fortes (zod)
- Emails válidos
- Rate limiting
- Proteção contra bots

### Armazenamento
- Senhas hasheadas (bcrypt)
- Tokens JWT seguros
- Sessões com expiração
- Logout em múltiplos dispositivos

## Integração com NextAuth

### Configuração
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          return null
        }

        const isValid = await compare(credentials.password, user.password)

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt'
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

## Próximos Passos

1. **Autenticação Social**
   - Google
   - Facebook
   - Apple

2. **Melhorias de Segurança**
   - 2FA
   - Captcha
   - Análise de dispositivos

3. **Perfis de Usuário**
   - Avatares
   - Preferências
   - Notificações

4. **Logs e Auditoria**
   - Registro de ações
   - Histórico de login
   - Alertas de segurança
