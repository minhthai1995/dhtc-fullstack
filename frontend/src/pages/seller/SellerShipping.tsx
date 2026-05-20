import { useState } from 'react'
import { useShippingZones, useCreateShippingZone, useDeleteShippingZone } from '@/features/seller/useSeller'
import { PageHeader } from '@/components/ui/PageHeader'
import { Plus, Truck, Trash2, X, Calculator } from 'lucide-react'
import type { ShippingZoneRead } from '@/types/api'

// DHL calculator mock
const calcShipping = (weight: number, zone: ShippingZoneRead) => {
  return zone.base_rate + zone.per_kg_rate * weight
}

export function SellerShipping() {
  const { data: zones } = useShippingZones()
  const createZone = useCreateShippingZone()
  const deleteZone = useDeleteShippingZone()
  const [showForm, setShowForm] = useState(false)
  const [calcWeight, setCalcWeight] = useState('')
  const [calcZoneId, setCalcZoneId] = useState<number>(1)

  const source = zones ?? []

  const selectedZone = source.find((z) => z.id === calcZoneId)
  const calcResult = calcWeight && selectedZone ? calcShipping(parseFloat(calcWeight), selectedZone) : null

  return (
    <div>
      <PageHeader
        title="DHL Waybill & Vận chuyển"
        subtitle={`${source.length} vùng vận chuyển`}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold hover:bg-green-soft transition-colors"
          >
            <Plus size={15} />
            Thêm vùng
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Zones list */}
        <div className="lg:col-span-2 space-y-3">
          {source.map((zone) => (
            <div key={zone.id} className="bg-white border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center flex-shrink-0">
                    <Truck size={18} className="text-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">{zone.zone_name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {zone.countries.map((c) => (
                        <span key={c} className="text-[10px] font-mono font-bold text-ink-mute bg-cream-dark px-1.5 py-0.5 rounded">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteZone.mutate(zone.id)}
                  className="text-ink-mute hover:text-danger transition-colors flex-shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                <div>
                  <div className="text-[10px] text-ink-mute uppercase tracking-wider mb-1">Phí cơ bản</div>
                  <div className="text-sm font-semibold text-green" style={{ fontFamily: 'var(--font-display)' }}>
                    {(zone.base_rate / 1000).toFixed(0)}K₫
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-ink-mute uppercase tracking-wider mb-1">Phí/kg</div>
                  <div className="text-sm font-semibold text-ink" style={{ fontFamily: 'var(--font-mono)' }}>
                    {(zone.per_kg_rate / 1000).toFixed(0)}K₫
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-ink-mute uppercase tracking-wider mb-1">Thời gian</div>
                  <div className="text-sm font-semibold text-ink">
                    {zone.estimated_days_min}–{zone.estimated_days_max} ngày
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* DHL Calculator */}
        <div>
          <div className="bg-white border border-border rounded-2xl p-5 sticky top-20">
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={16} className="text-green" />
              <h3 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
                Tính phí vận chuyển
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink-mute mb-1.5 uppercase tracking-wider">
                  Vùng đích
                </label>
                <select
                  value={calcZoneId}
                  onChange={(e) => setCalcZoneId(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                >
                  {source.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.zone_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-mute mb-1.5 uppercase tracking-wider">
                  Khối lượng (kg)
                </label>
                <input
                  type="number"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(e.target.value)}
                  placeholder="1.5"
                  step="0.1"
                  min="0"
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                />
              </div>

              {calcResult !== null && (
                <div
                  className="rounded-xl p-4 mt-2"
                  style={{ background: 'linear-gradient(135deg, var(--color-green) 0%, var(--color-green-soft) 100%)' }}
                >
                  <div className="text-cream/70 text-xs mb-1">Ước tính phí DHL</div>
                  <div
                    className="text-cream text-2xl font-medium"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {calcResult.toLocaleString('vi-VN')}₫
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-white/10 rounded-lg p-2">
                      <div className="text-cream/60 text-[9px] uppercase tracking-wider">Thời gian</div>
                      <div className="text-cream text-sm font-semibold mt-0.5">
                        {selectedZone?.estimated_days_min}–{selectedZone?.estimated_days_max} ngày
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                      <div className="text-cream/60 text-[9px] uppercase tracking-wider">Dịch vụ</div>
                      <div className="text-cream text-sm font-semibold mt-0.5">DHL Express</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add zone modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
                Thêm vùng vận chuyển
              </h3>
              <button onClick={() => setShowForm(false)} className="text-ink-mute hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <form
              className="p-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                createZone.mutate({
                  zone_name: fd.get('zone_name') as string,
                  countries: (fd.get('countries') as string).split(',').map((c) => c.trim().toUpperCase()),
                  base_rate: parseFloat(fd.get('base_rate') as string),
                  per_kg_rate: parseFloat(fd.get('per_kg_rate') as string),
                  estimated_days_min: parseInt(fd.get('days_min') as string),
                  estimated_days_max: parseInt(fd.get('days_max') as string),
                }, { onSuccess: () => setShowForm(false) })
              }}
            >
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Tên vùng</label>
                <input name="zone_name" type="text" required placeholder="Đông Nam Á" className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Mã quốc gia (phân cách bởi dấu phẩy)</label>
                <input name="countries" type="text" required placeholder="SG, MY, TH" className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Phí cơ bản (₫)</label>
                  <input name="base_rate" type="number" required min="0" placeholder="250000" className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Phí/kg (₫)</label>
                  <input name="per_kg_rate" type="number" required min="0" placeholder="45000" className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Ngày tối thiểu</label>
                  <input name="days_min" type="number" required min="1" placeholder="3" className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Ngày tối đa</label>
                  <input name="days_max" type="number" required min="1" placeholder="7" className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createZone.isPending} className="flex-1 py-2.5 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green-soft disabled:opacity-60 transition-colors">
                  {createZone.isPending ? 'Đang tạo...' : 'Thêm vùng'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-border rounded-xl font-semibold text-sm text-ink-mute hover:border-ink transition-colors">
                  Huỷ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
