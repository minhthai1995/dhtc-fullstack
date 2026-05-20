import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
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

  it('skips compression for files under threshold and uploads them', async () => {
    const { uploadProductImage } = await import('@/features/products/productImages.api')
    const imageCompression = (await import('browser-image-compression')).default
    vi.mocked(uploadProductImage).mockResolvedValueOnce(makeImage('new-1', 0))

    const onChange = vi.fn()
    const { container } = wrap(<ImageUploader value={[]} onChange={onChange} />)

    // 200KB JPEG — well below 1.5MB threshold.
    const small = new File([new Uint8Array(200 * 1024)], 'small.jpg', { type: 'image/jpeg' })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [small] } })

    await waitFor(() => expect(onChange).toHaveBeenCalled())
    expect(imageCompression).not.toHaveBeenCalled()
    expect(uploadProductImage).toHaveBeenCalledWith(small, expect.any(Function))
    expect(onChange.mock.calls[0][0]).toEqual([makeImage('new-1', 0)])
  })

  it('compresses files above the 1.5MB threshold before upload', async () => {
    const { uploadProductImage } = await import('@/features/products/productImages.api')
    const imageCompression = (await import('browser-image-compression')).default
    vi.mocked(uploadProductImage).mockResolvedValueOnce(makeImage('big-1', 0))
    const compressed = new File([new Uint8Array(800 * 1024)], 'compressed.jpg', { type: 'image/jpeg' })
    vi.mocked(imageCompression).mockResolvedValueOnce(compressed)

    const onChange = vi.fn()
    const { container } = wrap(<ImageUploader value={[]} onChange={onChange} />)

    // 2.5MB JPEG — triggers client-side compression (camera-shot size).
    const big = new File([new Uint8Array(2.5 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [big] } })

    await waitFor(() => expect(uploadProductImage).toHaveBeenCalled())
    expect(imageCompression).toHaveBeenCalledWith(big, expect.objectContaining({ maxSizeMB: 1.8 }))
    expect(uploadProductImage).toHaveBeenCalledWith(compressed, expect.any(Function))
  })

  it('reorders tiles via native HTML5 drag-drop and re-numbers order', () => {
    const items = [makeImage('a', 0), makeImage('b', 1), makeImage('c', 2)]
    const onChange = vi.fn()
    const { container } = wrap(<ImageUploader value={items} onChange={onChange} />)

    const tiles = container.querySelectorAll('[draggable="true"]')
    expect(tiles.length).toBe(3)

    // dataTransfer is required by the component to flag a real drag in Firefox.
    const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' }
    fireEvent.dragStart(tiles[0], { dataTransfer })
    fireEvent.dragOver(tiles[2], { dataTransfer })
    fireEvent.drop(tiles[2], { dataTransfer })

    expect(onChange).toHaveBeenCalledTimes(1)
    const reordered = onChange.mock.calls[0][0]
    expect(reordered.map((i: ProductImage) => i.id)).toEqual(['b', 'c', 'a'])
    expect(reordered.map((i: ProductImage) => i.order)).toEqual([0, 1, 2])
  })
})
