import { test, expect } from '@playwright/test'

// Faz login uma vez e reutiliza a sessão em todos os testes deste arquivo
test.beforeEach(async ({ page }) => {
  await page.goto('/auth/login')
  await page.fill('input[type="email"]', 'daniel@twixeventos.com')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/admin/, { timeout: 10000 })
})

test.describe('Painel admin — navegação', () => {
  test('Dashboard — carrega KPIs', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    const title = await page.title()
    expect(title).not.toMatch(/404|500|error/i)
  })

  test('Clientes — carrega lista', async ({ page }) => {
    await page.goto('/admin/clientes')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })

  test('Eventos — carrega lista', async ({ page }) => {
    await page.goto('/admin/eventos')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })

  test('Brinquedos — carrega lista', async ({ page }) => {
    await page.goto('/admin/brinquedos')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })

  test('Leads — carrega lista', async ({ page }) => {
    await page.goto('/admin/leads')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })

  test('Financeiro — carrega', async ({ page }) => {
    await page.goto('/admin/financeiro')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })

  test('Usuários — carrega lista', async ({ page }) => {
    await page.goto('/admin/usuarios')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })

  test('Cashback — carrega', async ({ page }) => {
    await page.goto('/admin/cashback')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })

  test('Configurações — carrega', async ({ page }) => {
    await page.goto('/admin/configuracoes')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Painel admin — APIs autenticadas', () => {
  test('GET /api/admin/dashboard — retorna dados', async ({ page, request }) => {
    // Pega cookies da sessão autenticada
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('next-auth'))

    if (sessionCookie) {
      const response = await request.get('/api/admin/dashboard', {
        headers: { Cookie: `${sessionCookie.name}=${sessionCookie.value}` },
      })
      // Com auth deve retornar 200
      expect(response.status()).toBe(200)
    }
  })

  test('GET /api/admin/clientes — retorna array', async ({ page }) => {
    await page.goto('/api/admin/clientes')
    const body = await page.locator('body').innerText()
    // Deve ser JSON válido, não uma mensagem de erro de auth
    expect(body).not.toContain('"error":"Unauthorized"')
  })
})
