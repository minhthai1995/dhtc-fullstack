import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-8xl font-bold text-gray-100">404</p>
      <h1 className="text-2xl font-semibold text-gray-900">Trang không tồn tại</h1>
      <p className="text-gray-500">URL này không hợp lệ hoặc đã bị xóa.</p>
      <Link
        to="/"
        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium
                   text-gray-700 transition-colors hover:bg-gray-50"
      >
        Về trang chủ
      </Link>
    </div>
  )
}
