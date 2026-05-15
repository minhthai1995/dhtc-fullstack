export interface ApiError {
  detail: string | { msg: string; type: string }[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface TokenResponse {
  access_token: string
  token_type: 'bearer'
}
