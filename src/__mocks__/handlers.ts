import { rest } from 'msw'

export const handlers = [
  // Mock para autenticação
  rest.post('*/auth/v1/token', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        access_token: 'mock-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: '1',
          email: 'teste@exemplo.com',
          role: 'admin'
        }
      })
    )
  }),

  // Mock para buscar perfil
  rest.get('*/rest/v1/profiles', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          username: 'admin',
          role: 'admin',
          email: 'teste@exemplo.com'
        }
      ])
    )
  }),

  // Mock para buscar permissões
  rest.get('*/rest/v1/permissions', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          profile_id: '1',
          resource: 'news',
          actions: ['create', 'read', 'update', 'delete']
        }
      ])
    )
  })
]
