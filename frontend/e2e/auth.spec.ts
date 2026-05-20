import { test, expect } from '@playwright/test'
import { ss, expectNoError } from './helpers'

test.describe('Auth', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await ss(page, '01-auth-login-page')
  })

  test('wrong password shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'customer@dhtc.vn')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)
    const stayed = page.url().includes('/login')
    const hasErrMsg = await page.locator('text=/sai|lỗi|incorrect|invalid/i').isVisible().catch(() => false)
    expect(stayed || hasErrMsg).toBe(true)
    await ss(page, '02-auth-wrong-password')
  })

  test('admin login → /admin/dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@dhtc.vn')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin/, { timeout: 12000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await expectNoError(page)
    await ss(page, '03-auth-admin-dashboard')
  })

  test('seller login → /seller', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'seller@dhtc.vn')
    await page.fill('input[type="password"]', 'seller123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/seller/, { timeout: 12000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await ss(page, '04-auth-seller-dashboard')
  })

  test('customer login → /shop', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'customer@dhtc.vn')
    await page.fill('input[type="password"]', 'customer123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/shop/, { timeout: 12000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await ss(page, '05-auth-customer-shop')
  })

  test('register page renders', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await ss(page, '06-auth-register-page')
  })
})
