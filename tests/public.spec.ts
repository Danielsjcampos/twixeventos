import { test, expect } from '@playwright/test'

test.describe('Páginas públicas', () => {
  test('Home — carrega e tem título correto', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Twix/i)
    await expect(page.locator('body')).toBeVisible()
  })

  test('Home — não tem erros de hidratação', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const hydrationErrors = errors.filter(e => e.includes('Hydration') || e.includes('hydrat'))
    expect(hydrationErrors).toHaveLength(0)
  })

  test('Catálogo de brinquedos — carrega lista', async ({ page }) => {
    await page.goto('/brinquedos')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    // Verifica que a página não caiu em erro 500
    const status = await page.evaluate(() => document.title)
    expect(status).not.toMatch(/500|error/i)
  })

  test('Blog — carrega lista de posts', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    const status = await page.evaluate(() => document.title)
    expect(status).not.toMatch(/500|error/i)
  })

  test('Bio (link na bio) — carrega links', async ({ page }) => {
    await page.goto('/bio')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    // Deve ter pelo menos o link de WhatsApp
    await expect(page.getByText(/WhatsApp|Reservar/i).first()).toBeVisible()
  })

  test('Sobre — carrega', async ({ page }) => {
    await page.goto('/sobre')
    await expect(page.locator('body')).toBeVisible()
  })

  test('Contato — carrega', async ({ page }) => {
    await page.goto('/contato')
    await expect(page.locator('body')).toBeVisible()
  })

  test('Minha área — carrega página de acesso', async ({ page }) => {
    await page.goto('/minha-area')
    await expect(page.locator('body')).toBeVisible()
  })

  test('Sitemap.xml — retorna XML válido', async ({ page }) => {
    const response = await page.goto('/sitemap.xml')
    expect(response?.status()).toBe(200)
    const content = await page.content()
    expect(content).toContain('urlset')
  })

  test('Robots.txt — retorna conteúdo', async ({ page }) => {
    const response = await page.goto('/robots.txt')
    expect(response?.status()).toBe(200)
  })
})
