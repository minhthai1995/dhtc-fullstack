import { describe, it, expect } from 'vitest'

// Vietnamese currency formatting utilities (pure functions, no component rendering)
function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN')
}

function formatVNDFull(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}₫`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
  }
  return statusMap[status] ?? status
}

describe('Vietnamese Currency Formatting', () => {
  it('formats 680000 as 680.000', () => {
    expect(formatVND(680000)).toBe('680.000')
  })

  it('formats 1000 as 1.000', () => {
    expect(formatVND(1000)).toBe('1.000')
  })

  it('formats 1000000 as 1.000.000', () => {
    expect(formatVND(1000000)).toBe('1.000.000')
  })

  it('formats 0 as 0', () => {
    expect(formatVND(0)).toBe('0')
  })

  it('formats 500 as 500 (no separator needed)', () => {
    expect(formatVND(500)).toBe('500')
  })

  it('formats 12500000 as 12.500.000', () => {
    expect(formatVND(12500000)).toBe('12.500.000')
  })

  it('formats 250000 with dong symbol', () => {
    expect(formatVNDFull(250000)).toBe('250.000₫')
  })

  it('formats large amounts correctly', () => {
    expect(formatVND(999999999)).toBe('999.999.999')
  })
})

describe('Date Formatting', () => {
  it('formats ISO date string to vi-VN locale', () => {
    const result = formatDate('2025-01-15T00:00:00.000Z')
    // vi-VN uses DD/MM/YYYY
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })

  it('includes day, month, year', () => {
    const result = formatDate('2025-06-20T00:00:00.000Z')
    expect(result).toContain('2025')
  })

  it('formats datetime with hours and minutes', () => {
    const result = formatDateTime('2025-03-10T14:30:00.000Z')
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    // Should include time part
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})

describe('Text Utilities', () => {
  it('does not truncate text shorter than maxLength', () => {
    expect(truncateText('Cà phê Đà Lạt', 50)).toBe('Cà phê Đà Lạt')
  })

  it('truncates text longer than maxLength and appends ...', () => {
    const result = truncateText('Cà phê Đà Lạt hương vị đặc biệt', 10)
    expect(result).toBe('Cà phê Đà ...')
    expect(result.length).toBe(13) // 10 chars + '...'
  })

  it('does not truncate text equal to maxLength', () => {
    const text = 'Hello World'
    expect(truncateText(text, 11)).toBe('Hello World')
  })
})

describe('Order Status Formatting', () => {
  it('maps pending to Chờ xử lý', () => {
    expect(formatOrderStatus('pending')).toBe('Chờ xử lý')
  })

  it('maps processing to Đang xử lý', () => {
    expect(formatOrderStatus('processing')).toBe('Đang xử lý')
  })

  it('maps shipped to Đang giao', () => {
    expect(formatOrderStatus('shipped')).toBe('Đang giao')
  })

  it('maps delivered to Đã giao', () => {
    expect(formatOrderStatus('delivered')).toBe('Đã giao')
  })

  it('maps cancelled to Đã hủy', () => {
    expect(formatOrderStatus('cancelled')).toBe('Đã hủy')
  })

  it('returns unknown status as-is', () => {
    expect(formatOrderStatus('unknown_status')).toBe('unknown_status')
  })
})
