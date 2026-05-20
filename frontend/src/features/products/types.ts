export interface ProductImageUrls {
  original: string
  large: string
  medium: string
  thumb: string
}

export interface ProductImage {
  id: string
  urls: ProductImageUrls
  order: number
}

export interface LegacyProductImage {
  id?: number
  url: string
  alt?: string
  is_primary?: boolean
}

export type AnyProductImage = ProductImage | LegacyProductImage

export function isLegacyImage(img: AnyProductImage): img is LegacyProductImage {
  return 'url' in img && !('urls' in img)
}

export function imageThumbUrl(img: AnyProductImage): string {
  return isLegacyImage(img) ? img.url : img.urls.medium
}
