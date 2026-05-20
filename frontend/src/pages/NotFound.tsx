import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center bg-cream">
      <p
        className="text-[120px] font-medium leading-none text-green/10 select-none"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        404
      </p>
      <div className="-mt-8">
        <h1
          className="text-3xl font-medium tracking-tight text-ink mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Trang không tồn tại
        </h1>
        <p className="text-ink-mute text-sm max-w-xs">
          URL này không hợp lệ hoặc đã bị xóa.
        </p>
      </div>
      <Link
        to="/"
        className="mt-2 px-6 py-2.5 bg-green text-white text-sm font-semibold rounded-xl hover:bg-green/90 transition-colors"
      >
        Về trang chủ
      </Link>
    </div>
  )
}
