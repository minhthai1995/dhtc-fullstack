import { api } from '@/lib/axios'
import type { CategoryRead } from '@/types/api'

export interface CategoryWithCount extends CategoryRead {
  product_count: number
}

export interface CategoryCreate {
  name_vi: string
  name_en: string
  slug: string
  parent_id?: number | null
  icon_url?: string | null
  sort_order?: number
}

export async function getAdminCategories(): Promise<CategoryWithCount[]> {
  const { data } = await api.get<CategoryWithCount[]>('/admin/categories')
  return data
}

export async function createCategory(body: CategoryCreate): Promise<CategoryRead> {
  const { data } = await api.post<CategoryRead>('/admin/categories', body)
  return data
}

export async function updateCategory(id: number, body: Partial<CategoryCreate>): Promise<CategoryRead> {
  const { data } = await api.put<CategoryRead>(`/admin/categories/${id}`, body)
  return data
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/admin/categories/${id}`)
}
