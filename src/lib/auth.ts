import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[NextAuth] Iniciando authorize com credenciais:', { email: credentials?.email });
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[NextAuth] Erro: Email ou senha ausentes');
          throw new Error('Email e senha são obrigatórios');
        }

        try {
          console.log('[NextAuth] Buscando usuário no banco de dados...');
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              password: true,
            },
          });
          
          console.log('[NextAuth] Resultado da busca:', { 
            encontrado: !!user, 
            temSenha: !!user?.password,
            id: user?.id,
            email: user?.email,
            role: user?.role
          });

          if (!user || !user.password) {
            console.log('[NextAuth] Erro: Usuário não encontrado ou sem senha');
            throw new Error('Usuário não encontrado');
          }

          console.log('[NextAuth] Validando senha com bcrypt...');
          // Log para verificar a senha que está armazenada (apenas para depuração)
          console.log('[NextAuth] Hash da senha armazenada:', user.password?.substring(0, 10) + '...');
          
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          
          console.log('[NextAuth] Resultado da validação de senha:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('[NextAuth] Erro: Senha incorreta');
            throw new Error('Senha incorreta');
          }
          
          console.log('[NextAuth] Autenticação bem-sucedida para:', user.email);
          
          // Retorna o usuário autenticado
          return {
            id: user.id,
            email: user.email ?? '', // Garante que seja string
            name: user.name ?? '',   // Garante que seja string
            role: user.role,
          };
        } catch (error) {
          console.error('[NextAuth] Erro durante a autenticação:', error);
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('[JWT Callback] User:', user); // Log do user no login
      if (user) {
        token.id = user.id;
        token.role = user.role;
        console.log('[JWT Callback] Token após adicionar user info:', token);
      } else {
        console.log('[JWT Callback] Token existente:', token);
      }
      return token;
    },
    async session({ session, token }) {
      console.log('[Session Callback] Token recebido:', token); // Log do token recebido
      if (session?.user) {
        session.user.id = token.sub as string; 
        session.user.role = token.role as string;
      }
      console.log('[Session Callback] Session retornada:', session); // Log da session final
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirecionamentos específicos de páginas protegidas são mantidos
      if (url.startsWith('/api') || url.startsWith('/auth')) {
        return `${baseUrl}${url}`
      }
      
      // Para URLs relativas, adicionamos o baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      
      // Para URLs absolutas, mantemos como está
      return url
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  debug: process.env.NODE_ENV === 'development'
};
