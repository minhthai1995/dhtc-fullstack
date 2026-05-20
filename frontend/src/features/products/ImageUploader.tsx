import { useRef, useState, type DragEvent } from 'react'
import { ImagePlus } from 'lucide-react'

export const MAX_IMAGES = 9

export interface ImageUploaderProps {
  /** Existing/uploaded images (controlled). Empty array means nothing uploaded yet. */
  value: never[]
  /** Called when images change (add/remove/reorder). Wired in later tasks. */
  onChange: (next: never[]) => void
}

export function ImageUploader(_props: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handlePick = () => inputRef.current?.click()

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    // File handling wired in T21
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        className="hidden"
        onChange={() => { /* wired in T21 */ }}
      />
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
        <p className="text-xs text-ink-mute">JPG / PNG / WebP / HEIC · tối đa {MAX_IMAGES} ảnh · 2MB mỗi ảnh</p>
      </div>
    </div>
  )
}
