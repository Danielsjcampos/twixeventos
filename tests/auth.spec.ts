import { test, expect } from '@playwright/test'

test.describe('Autenticação', () => {
  test('Página de login — carrega formulário', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('Login com credenciais erradas — exibe erro', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('input[type="email"]', 'naoexiste@twixeventos.com')
    await page.fill('input[type="password"]', 'senhaerrada')
    await page.click('button[type="submit"]')
    // Aguarda feedback (toast ou mensagem de erro)
    await expect(
      page.getByText(/incorretos|inválid|erro/i).first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('Acesso direto ao admin — redireciona para login', async ({ page }) => {
    await page.goto('/admin/dashboard')
    // Deve ser redirecionado para /auth/login
    await expect(page).toHaveURL(/auth\/login/)
  })

  test('Login com credenciais corretas — redireciona para dashboard', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('input[type="email"]', 'daniel@twixeventos.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    // Aguarda redirecionamento para o admin
    await expect(page).toHaveURL(/admin/, { timeout: 10000 })
  })
})
