import { test, expect } from '@playwright/test'
import { loginAs, ss, expectNoError } from './helpers'

test.describe('Admin Portal', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin@dhtc.vn', 'admin123')
  })

  test('dashboard - loads KPIs and chart without crash', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await expectNoError(page)
    // KPI cards visible
    await expect(page.locator('text=/GMV|tổng đơn|tiểu thương/i').first()).toBeVisible()
    await ss(page, '10-admin-dashboard')
  })

  test('merchants list - shows merchant rows', async ({ page }) => {
    await page.goto('/admin/merchants')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await expect(page.locator('h1').first()).toBeVisible()
    await ss(page, '11-admin-merchants')
  })

  test('merchant detail - opens merchant page', async ({ page }) => {
    await page.goto('/admin/merchants')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    const link = page.locator('a[href*="/admin/merchants/"]').first()
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(800)
      await expectNoError(page)
      await ss(page, '12-admin-merchant-detail')
    }
  })

  test('products - loads with filters', async ({ page }) => {
    await page.goto('/admin/products')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await ss(page, '13-admin-products')
  })

  test('orders list - loads order rows', async ({ page }) => {
    await page.goto('/admin/orders')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await expect(page.locator('h1').first()).toBeVisible()
    await ss(page, '14-admin-orders')
  })

  test('customers list - loads with suspend/activate buttons', async ({ page }) => {
    await page.goto('/admin/customers')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await expect(page.locator('h1').first()).toBeVisible()
    const content = await page.content()
    expect(content).toMatch(/khách|customer/i)
    await ss(page, '15-admin-customers')
  })

  test('categories - CRUD page loads', async ({ page }) => {
    await page.goto('/admin/categories')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await expect(page.locator('h1').first()).toBeVisible()
    await ss(page, '16-admin-categories')
  })

  test('categories - create new category', async ({ page }) => {
    await page.goto('/admin/categories')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    // Click "Thêm danh mục" button
    const addBtn = page.locator('button:has-text("Thêm"), button:has-text("Tạo")').first()
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(500)
      // Fill in name
      const nameInput = page.locator('input[placeholder*="tên"], input[name*="name"]').first()
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill('Test E2E Category')
        await ss(page, '17-admin-categories-create-modal')
        // Submit
        const submitBtn = page.locator('button:has-text("Lưu"), button:has-text("Tạo"), button[type="submit"]').last()
        await submitBtn.click()
        await page.waitForTimeout(1500)
        await expectNoError(page)
        await ss(page, '18-admin-categories-after-create')
      }
    }
  })

  test('returns - loads return requests', async ({ page }) => {
    await page.goto('/admin/returns')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await expect(page.locator('h1').first()).toBeVisible()
    await ss(page, '19-admin-returns')
  })

  test('reports - loads analytics', async ({ page }) => {
    await page.goto('/admin/reports')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await expectNoError(page)
    await ss(page, '20-admin-reports')
  })

  test('settings - loads and saves config', async ({ page }) => {
    await page.goto('/admin/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    // Save button visible
    const saveBtn = page.locator('button:has-text("Lưu")').first()
    await expect(saveBtn).toBeVisible()
    await saveBtn.click()
    await page.waitForTimeout(1500)
    await expectNoError(page)
    await ss(page, '21-admin-settings')
  })

  test('withdrawals - loads page', async ({ page }) => {
    await page.goto('/admin/withdrawals')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await ss(page, '22-admin-withdrawals')
  })

  test('approvals - loads pending products', async ({ page }) => {
    await page.goto('/admin/approvals')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await ss(page, '23-admin-approvals')
  })

  test('integrations - loads health page', async ({ page }) => {
    await page.goto('/admin/integrations')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expectNoError(page)
    await ss(page, '24-admin-integrations')
  })

  test('integrations - chatbot test panel visible', async ({ page }) => {
    await page.goto('/admin/integrations')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1200)
    await expectNoError(page)
    // Chatbot section
    const chatSection = page.locator('text=Facebook Messenger Chatbot')
    await expect(chatSection).toBeVisible()
    // Chat input
    const chatInput = page.locator('input[placeholder*="Nhắn tin"]')
    await expect(chatInput).toBeVisible()
    await ss(page, '25-admin-integrations-chatbot')
  })

  test('integrations - chatbot sends test message', async ({ page }) => {
    await page.goto('/admin/integrations')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1200)
    await expectNoError(page)
    const chatInput = page.locator('input[placeholder*="Nhắn tin"]')
    if (await chatInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chatInput.fill('tìm cà phê')
      const sendBtn = page.locator('button:has-text("Gửi")').first()
      await sendBtn.click()
      // Wait for response (or timeout after 10s)
      await page.waitForTimeout(3000)
      await expectNoError(page)
      await ss(page, '26-admin-integrations-chatbot-response')
    }
  })

  test('crm - all 4 tabs render without crash', async ({ page }) => {
    await page.goto('/admin/crm')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1200)
    await expectNoError(page)

    // Tab "Tổng quan" loads by default
    await expect(page.locator('button:has-text("Tổng quan")')).toBeVisible()
    await ss(page, '27-admin-crm-overview')

    // Switch to "Khách hàng"
    await page.locator('button:has-text("Khách hàng")').click()
    await page.waitForTimeout(800)
    await expectNoError(page)
    await expect(page.locator('text=/Theo nguồn|Theo quốc gia/').first()).toBeVisible()
    await ss(page, '28-admin-crm-customers')

    // Switch to "Hội thoại"
    await page.locator('button:has-text("Hội thoại")').click()
    await page.waitForTimeout(800)
    await expectNoError(page)
    await ss(page, '29-admin-crm-conversations')

    // Switch to "Hành vi" — real behavior overview must render
    await page.locator('button:has-text("Hành vi")').click()
    await page.waitForTimeout(800)
    await expectNoError(page)
    await expect(page.locator('text=Phiên hôm nay').first()).toBeVisible()
    await expect(page.locator('text=Phễu hành vi').first()).toBeVisible()
    await expect(page.locator('text=Phiên theo giờ').first()).toBeVisible()
    await ss(page, '30-admin-crm-behavior')
  })

  test('crm - behavior tab loads counts from API', async ({ page }) => {
    // Fire a customer pageview first so the day has at least 1 session
    await page.goto('/shop')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)

    // Visit admin CRM and switch to Hành vi
    await page.goto('/admin/crm')
    await page.waitForLoadState('networkidle')
    await page.locator('button:has-text("Hành vi")').click()
    await page.waitForTimeout(1200)
    await expectNoError(page)

    // KPI value for "Phiên hôm nay" should be numeric (not "—")
    const kpiBlock = page.locator('text=Phiên hôm nay').first().locator('..')
    const kpiText = await kpiBlock.innerText()
    expect(kpiText).toMatch(/\d+/)
  })

  test('crm - no AI-mockup residue in DOM', async ({ page }) => {
    await page.goto('/admin/crm')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    // Must not contain old fake-demo labels
    await expect(page.locator('text=Intent Clusters')).toHaveCount(0)
    await expect(page.locator('text=AI phân loại')).toHaveCount(0)
    await expect(page.locator('text=/Demo[ —]/')).toHaveCount(0)
  })
})
