import { useT } from '@/i18n/useT'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPage: (page: number) => void
}

export function Pagination({ page, pageSize, total, onPage }: PaginationProps) {
  const { t } = useT()
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <span className="text-xs text-ink-mute">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} {t('pagination.of')} {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-ink-soft disabled:opacity-40 hover:border-green hover:text-green transition-colors disabled:cursor-not-allowed"
        >
          ←
        </button>
        <span className="px-3 py-1.5 text-xs text-ink-mute">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-ink-soft disabled:opacity-40 hover:border-green hover:text-green transition-colors disabled:cursor-not-allowed"
        >
          →
        </button>
      </div>
    </div>
  )
}
