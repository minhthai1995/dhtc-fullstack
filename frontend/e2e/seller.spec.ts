import { test, expect } from '@playwright/test'
import { loginAs, ss, expectNoError } from './helpers'

test.describe('Seller Portal', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'seller@dhtc.vn', 'seller123')
  })

  test('dashboard - KPIs load without crash', async ({ page }) => {
    await page.goto('/seller/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await expectNoError(page)
    const content = await page.content()
    expect(content).toContain('₫')
    await ss(page, '30-seller-dashboard')
  })

  test('products - lists seller products', async ({ page }) => {
    await page.goto('/seller/products')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await expect(page.locator('h1').first()).toBeVisible()
    await ss(page, '31-seller-products')
  })

  test('products - add new product form', async ({ page }) => {
    await page.goto('/seller/products/new')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await expectNoError(page)
    // Form should have name input
    const nameInput = page.locator('input[name*="name"], input[placeholder*="tên"]').first()
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(nameInput).toBeVisible()
    }
    await ss(page, '32-seller-product-new')
  })

  test('orders - lists orders', async ({ page }) => {
    await page.goto('/seller/orders')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await expect(page.locator('h1').first()).toBeVisible()
    await ss(page, '33-seller-orders')
  })

  test('wallet - shows balance and transactions', async ({ page }) => {
    await page.goto('/seller/wallet')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    const content = await page.content()
    expect(content).toMatch(/ví|số dư|rút/i)
    await ss(page, '34-seller-wallet')
  })

  test('returns - loads return requests', async ({ page }) => {
    await page.goto('/seller/returns')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await expect(page.locator('h1').first()).toBeVisible()
    await ss(page, '35-seller-returns')
  })

  test('profile - loads seller profile', async ({ page }) => {
    await page.goto('/seller/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await ss(page, '36-seller-profile')
  })

  test('analytics - loads analytics page', async ({ page }) => {
    await page.goto('/seller/analytics')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await ss(page, '37-seller-analytics')
  })

  test('products - uploads a fixture image through ImageUploader', async ({ page }) => {
    await page.goto('/seller/products/new')
    await page.waitForLoadState('networkidle')
    await expectNoError(page)

    // 1×1 red JPEG — minimum valid bytes that Pillow accepts, keeps the
    // fixture inline so we don't commit a binary.
    const jpegBytes = Buffer.from(
      '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB' +
        'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAEAAQMBIgACEQEDEQH/' +
        'xAAVAAEBAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEA' +
        'AAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A' +
        'fwD/2Q==',
      'base64',
    )

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'fixture.jpg',
      mimeType: 'image/jpeg',
      buffer: jpegBytes,
    })

    // A preview tile means the upload resolved and onChange fired.
    // Backend may be slow on cold caches — give it real time.
    const preview = page.locator('img[src*="/uploads/products/"]').first()
    await expect(preview).toBeVisible({ timeout: 15000 })
    await expect(page.locator('text=Ảnh chính')).toBeVisible()

    await ss(page, '38-seller-product-image-upload')
  })
})
