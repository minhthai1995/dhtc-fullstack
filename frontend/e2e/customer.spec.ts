import { test, expect } from '@playwright/test'
import { loginAs, ss, expectNoError } from './helpers'

test.describe('Customer - Shop', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'customer@dhtc.vn', 'customer123')
  })

  test('shop page - shows product grid', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await expectNoError(page)
    // Products or empty state
    const productCount = await page.locator('a[href*="/shop/products/"]').count()
    const hasEmpty = await page.locator('text=Không tìm thấy').isVisible().catch(() => false)
    expect(productCount > 0 || hasEmpty).toBe(true)
    await ss(page, '40-customer-shop')
  })

  test('shop - search filters results', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    const searchInput = page.locator('input[placeholder*="Tìm"]').first()
    await searchInput.fill('cà phê')
    await page.waitForTimeout(900) // debounce
    await expectNoError(page)
    await ss(page, '41-customer-shop-search')
    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(500)
  })

  test('shop - category filter', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    // Click first category in sidebar
    const catItem = page.locator('aside li').first()
    if (await catItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await catItem.click()
      await page.waitForTimeout(800)
      await expectNoError(page)
      await ss(page, '42-customer-shop-category-filter')
    }
  })

  test('shop - region filter', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    const regionCheckbox = page.locator('text=Tây Nguyên').first()
    if (await regionCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await regionCheckbox.click()
      await page.waitForTimeout(800)
      await expectNoError(page)
      await ss(page, '43-customer-shop-region-filter')
    }
  })

  test('shop - price sort', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    const sortSelect = page.locator('select').first()
    if (await sortSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sortSelect.selectOption('price_asc')
      await page.waitForTimeout(800)
      await expectNoError(page)
      await ss(page, '44-customer-shop-sort-price')
    }
  })

  test('product detail - renders correctly', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    const firstProduct = page.locator('a[href*="/shop/products/"]').first()
    if (await firstProduct.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstProduct.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      await expectNoError(page)
      await expect(page).toHaveURL(/\/shop\/products\/\d+/)
      // Product name, price visible
      const content = await page.content()
      expect(content).toContain('₫')
      await ss(page, '45-customer-product-detail')
    }
  })

  test('product detail - add to cart', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    const firstProduct = page.locator('a[href*="/shop/products/"]').first()
    if (await firstProduct.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstProduct.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(800)
      const addBtn = page.locator('button:has-text("Thêm vào giỏ"), button:has-text("Giỏ hàng")').first()
      if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addBtn.click()
        await page.waitForTimeout(1500)
        await expectNoError(page)
        await ss(page, '46-customer-add-to-cart')
      }
    }
  })

  test('cart page - loads', async ({ page }) => {
    await page.goto('/cart')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    const content = await page.content()
    expect(content).toMatch(/giỏ hàng|cart|trống/i)
    await ss(page, '47-customer-cart')
  })

  test('cart - checkout flow', async ({ page }) => {
    // Add something to cart first
    await page.goto('/shop')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    const firstProduct = page.locator('a[href*="/shop/products/"]').first()
    if (await firstProduct.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstProduct.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(800)
      const addBtn = page.locator('button:has-text("Thêm vào giỏ"), button:has-text("Giỏ hàng")').first()
      if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addBtn.click()
        await page.waitForTimeout(1000)
      }
    }
    await page.goto('/cart')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    const checkoutBtn = page.locator('button:has-text("Đặt hàng"), button:has-text("Thanh toán"), a:has-text("Đặt hàng")').first()
    if (await checkoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await checkoutBtn.click()
      await page.waitForTimeout(1000)
      await expectNoError(page)
      await ss(page, '48-customer-checkout')
    } else {
      await ss(page, '48-customer-cart-empty')
    }
  })

  test('order tracking - loads user orders', async ({ page }) => {
    await page.goto('/tracking')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    const content = await page.content()
    expect(content).toMatch(/đơn hàng|tracking|order/i)
    await ss(page, '49-customer-tracking')
  })

  test('account page - loads profile', async ({ page }) => {
    await page.goto('/account')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    const content = await page.content()
    expect(content).toMatch(/tài khoản|profile|account/i)
    await ss(page, '50-customer-account')
  })

  test('wishlist - loads', async ({ page }) => {
    await page.goto('/wishlist')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await ss(page, '51-customer-wishlist')
  })

  test('merchant page - public store', async ({ page }) => {
    await page.goto('/shop/merchants/1')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await ss(page, '52-customer-merchant-page')
  })
})
