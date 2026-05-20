import { api } from '@/lib/axios'
import type { ProductImage } from './types'

export type UploadProgressHandler = (percent: number) => void

export async function uploadProductImage(
  file: File,
  onProgress?: UploadProgressHandler,
): Promise<ProductImage> {
  const form = new FormData()
  form.append('file', file)

  const { data } = await api.post<ProductImage>('/products/images', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total))
      }
    },
  })
  return data
}

export async function deleteProductImage(imageId: string): Promise<void> {
  await api.delete(`/products/images/${imageId}`)
}
