import { test, expect } from '@playwright/test'

// Verifica que todas as rotas admin retornam 401 sem autenticação
const ADMIN_ROUTES = [
  '/api/admin/dashboard',
  '/api/admin/clientes',
  '/api/admin/eventos',
  '/api/admin/brinquedos',
  '/api/admin/leads',
  '/api/admin/financeiro',
  '/api/admin/usuarios',
  '/api/admin/monitores',
  '/api/admin/lancamentos',
]

test.describe('Segurança das APIs admin', () => {
  for (const route of ADMIN_ROUTES) {
    test(`GET ${route} — requer autenticação (401)`, async ({ request }) => {
      const response = await request.get(route)
      expect(response.status()).toBe(401)
    })
  }

  test('POST /api/admin/interacoes — requer autenticação (401)', async ({ request }) => {
    const response = await request.post('/api/admin/interacoes', {
      data: { clienteId: 'test', tipo: 'ligacao', descricao: 'test' },
    })
    expect(response.status()).toBe(401)
  })

  test('POST /api/admin/usuarios — requer autenticação (401)', async ({ request }) => {
    const response = await request.post('/api/admin/usuarios', {
      data: { email: 'hacker@test.com', nome: 'Hacker', role: 'admin' },
    })
    expect(response.status()).toBe(401)
  })

  test('DELETE /api/admin/usuarios/qualquer-id — requer autenticação (401)', async ({ request }) => {
    const response = await request.delete('/api/admin/usuarios/qualquer-id')
    expect(response.status()).toBe(401)
  })

  test('POST /api/admin/clientes/qualquer-id/giros — requer autenticação (401)', async ({ request }) => {
    const response = await request.post('/api/admin/clientes/qualquer-id/giros', {
      data: { quantidade: 10 },
    })
    expect(response.status()).toBe(401)
  })
})

test.describe('Rotas públicas de API', () => {
  test('POST /api/leads — aceita requisição (sem auth necessária)', async ({ request }) => {
    // Esta rota é pública — leads do site
    const response = await request.post('/api/leads', {
      data: { nome: 'Teste', telefone: '12999999999', origem: 'site' },
    })
    // 200, 201, 400 ou 422 são aceitáveis — o que NÃO deve ser é 401
    expect(response.status()).not.toBe(401)
  })
})
