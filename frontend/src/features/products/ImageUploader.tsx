import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { uploadProductImage } from './productImages.api'
import type { ProductImage } from './types'

export const MAX_IMAGES = 9

export interface ImageUploaderProps {
  value: ProductImage[]
  onChange: (next: ProductImage[]) => void
}

interface PendingItem {
  localId: string
  file: File
  previewUrl: string
  progress: number
  error?: string
}

let pendingCounter = 0
const nextLocalId = () => `pending-${++pendingCounter}`

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [pending, setPending] = useState<PendingItem[]>([])

  useEffect(() => {
    return () => {
      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
  }, [pending])

  const handlePick = () => inputRef.current?.click()
  const remaining = MAX_IMAGES - value.length - pending.length

  const startUpload = (files: File[]) => {
    if (files.length === 0) return
    const slots = Math.max(0, MAX_IMAGES - value.length - pending.length)
    const accepted = files.slice(0, slots)
    const items: PendingItem[] = accepted.map((file) => ({
      localId: nextLocalId(),
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
    }))
    setPending((prev) => [...prev, ...items])

    items.forEach((item) => {
      uploadProductImage(item.file, (percent) => {
        setPending((prev) =>
          prev.map((p) => (p.localId === item.localId ? { ...p, progress: percent } : p)),
        )
      })
        .then((uploaded) => {
          onChange([...value, uploaded])
          setPending((prev) => {
            const target = prev.find((p) => p.localId === item.localId)
            if (target) URL.revokeObjectURL(target.previewUrl)
            return prev.filter((p) => p.localId !== item.localId)
          })
        })
        .catch(() => {
          setPending((prev) =>
            prev.map((p) =>
              p.localId === item.localId ? { ...p, error: 'Tải lên thất bại' } : p,
            ),
          )
        })
    })
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // allow same file twice
    startUpload(files)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files ?? [])
    startUpload(files)
  }

  const removeUploaded = (id: string) => {
    onChange(value.filter((img) => img.id !== id))
  }

  const removePending = (localId: string) => {
    setPending((prev) => {
      const target = prev.find((p) => p.localId === localId)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((p) => p.localId !== localId)
    })
  }

  const totalCount = value.length + pending.length
  const showGrid = totalCount > 0

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />

      {showGrid && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-3">
          {value.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square rounded-xl overflow-hidden border border-border bg-white group"
            >
              <img src={img.urls.medium} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeUploaded(img.id)}
                aria-label="Xoá ảnh"
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-danger hover:text-white transition-all"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {pending.map((p) => (
            <div
              key={p.localId}
              className="relative aspect-square rounded-xl overflow-hidden border border-border bg-white"
            >
              <img src={p.previewUrl} alt="" className="w-full h-full object-cover opacity-70" />
              {!p.error && (
                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1">
                  <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green transition-all"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-white font-mono mt-0.5">{p.progress}%</p>
                </div>
              )}
              {p.error && (
                <div className="absolute inset-x-0 bottom-0 bg-danger/90 px-2 py-1">
                  <p className="text-[10px] text-white font-semibold">{p.error}</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => removePending(p.localId)}
                aria-label="Huỷ ảnh đang tải"
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white/90 border border-border flex items-center justify-center hover:bg-danger hover:text-white transition-all"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <div
          role="button"
          tabIndex={0}
          onClick={handlePick}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handlePick()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={
            'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 cursor-pointer transition-all ' +
            (dragOver
              ? 'border-green bg-green/5'
              : 'border-border bg-cream hover:border-green/60 hover:bg-cream-dark/40')
          }
        >
          <ImagePlus size={28} className="text-ink-mute" />
          <p className="text-sm font-semibold text-ink">Kéo thả ảnh vào đây hoặc bấm để chọn</p>
          <p className="text-xs text-ink-mute">
            JPG / PNG / WebP / HEIC · còn {remaining}/{MAX_IMAGES} ảnh · 2MB mỗi ảnh
          </p>
        </div>
      )}

      {remaining === 0 && (
        <p className="text-xs text-ink-mute italic mt-2">
          Đã đạt tối đa {MAX_IMAGES} ảnh. Xoá bớt để thêm mới.
        </p>
      )}
    </div>
  )
}
