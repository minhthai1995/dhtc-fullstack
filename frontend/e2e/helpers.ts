import { Page, expect } from '@playwright/test'

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.fill('input[type="email"], input[name="email"]', email)
  await page.fill('input[type="password"], input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(admin|seller|shop|account|tracking)/, { timeout: 12000 })
  await page.waitForLoadState('networkidle')
}

export async function ss(page: Page, name: string) {
  await page.waitForTimeout(600)
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true })
}

export async function expectNoError(page: Page) {
  const errorText = await page.locator('text=Cannot read').isVisible().catch(() => false)
  const crashed = await page.locator('text=Đã xảy ra lỗi').isVisible().catch(() => false)
  expect(errorText || crashed, 'Page should not show a crash error').toBe(false)
}
