import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { ImageUploader, MAX_IMAGES } from '@/features/products/ImageUploader'
import { ToastProvider } from '@/components/ui/Toast'
import type { ProductImage } from '@/features/products/types'
import { renderWithProviders } from '../test-utils'

vi.mock('@/features/products/productImages.api', () => ({
  uploadProductImage: vi.fn(),
  deleteProductImage: vi.fn(),
}))

vi.mock('browser-image-compression', () => ({
  default: vi.fn(async (file: File) => file),
}))

// jsdom doesn't implement object URLs — stub them so previews render.
beforeEach(() => {
  if (!('createObjectURL' in URL)) {
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: vi.fn(() => 'blob:mock'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', { writable: true, value: vi.fn() })
  }
})

function wrap(node: React.ReactNode) {
  return renderWithProviders(<ToastProvider>{node}</ToastProvider>)
}

function makeImage(id: string, order: number): ProductImage {
  return {
    id,
    order,
    urls: {
      original: `/u/${id}/o.webp`,
      large: `/u/${id}/l.webp`,
      medium: `/u/${id}/m.webp`,
      thumb: `/u/${id}/t.webp`,
    },
  }
}

describe('ImageUploader', () => {
  it('renders empty dropzone with remaining slot hint', () => {
    wrap(<ImageUploader value={[]} onChange={() => {}} />)
    expect(screen.getByText(/Kéo thả ảnh/i)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`còn ${MAX_IMAGES}/${MAX_IMAGES} ảnh`))).toBeInTheDocument()
  })

  it('hides dropzone once MAX_IMAGES tiles are present', () => {
    const full = Array.from({ length: MAX_IMAGES }, (_, i) => makeImage(`img-${i}`, i))
    wrap(<ImageUploader value={full} onChange={() => {}} />)
    expect(screen.queryByText(/Kéo thả ảnh/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Đã đạt tối đa/)).toBeInTheDocument()
  })

  it('rejects non-image MIME with a Vietnamese toast', async () => {
    const { uploadProductImage } = await import('@/features/products/productImages.api')
    const onChange = vi.fn()
    const { container } = wrap(<ImageUploader value={[]} onChange={onChange} />)

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const badFile = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' })
    fireEvent.change(input, { target: { files: [badFile] } })

    // Toast surface uses the file name verbatim — sellers see exactly which file failed.
    expect(await screen.findByText(/không phải định dạng ảnh hỗ trợ/)).toBeInTheDocument()
    expect(uploadProductImage).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders primary badge only on the first tile', () => {
    const items = [makeImage('a', 0), makeImage('b', 1)]
    wrap(<ImageUploader value={items} onChange={() => {}} />)
    const badges = screen.getAllByText('Ảnh chính')
    expect(badges).toHaveLength(1)
  })
})
