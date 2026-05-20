import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Save } from 'lucide-react'
import { useSettings, useSaveSettings } from '@/features/admin/useSettings'
import { useToast } from '@/components/ui/Toast'

function getVal(configs: { key: string; value: string }[], key: string, fallback: string): string {
  return configs.find((c) => c.key === key)?.value ?? fallback
}

export function AdminSettings() {
  const { data: configs = [], isLoading } = useSettings()
  const save = useSaveSettings()
  const toast = useToast()

  const [platformName, setPlatformName] = useState('DHTC Đà Nẵng')
  const [feeRate, setFeeRate] = useState('3.5')
  const [minWithdrawal, setMinWithdrawal] = useState('500000')

  useEffect(() => {
    if (configs.length === 0) return
    setPlatformName(getVal(configs, 'platform_name', 'DHTC Đà Nẵng'))
    setFeeRate(getVal(configs, 'fee_rate', '3.5'))
    setMinWithdrawal(getVal(configs, 'min_withdrawal', '500000'))
  }, [configs])

  const handleSave = async () => {
    const items = [
      { key: 'platform_name', value: platformName, description: 'Tên nền tảng' },
      { key: 'fee_rate', value: feeRate, description: 'Phí sàn (%)' },
      { key: 'min_withdrawal', value: minWithdrawal, description: 'Rút tiền tối thiểu (VND)' },
    ]
    try {
      await save.mutateAsync(items)
      toast('Đã lưu cài đặt thành công', 'success')
    } catch {
      toast('Lưu cài đặt thất bại', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Quyền & Cài đặt"
        subtitle="Cấu hình hệ thống và quản lý người dùng"
        actions={
          <button
            onClick={handleSave}
            disabled={save.isPending || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold hover:bg-green-soft transition-colors disabled:opacity-60"
          >
            <Save size={15} />
            {save.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Platform settings */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Cấu hình nền tảng
          </h2>
          {isLoading ? (
            <div className="text-sm text-ink-mute">Đang tải...</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Tên nền tảng</label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Phí sàn (%)</label>
                <input
                  type="number"
                  value={feeRate}
                  onChange={(e) => setFeeRate(e.target.value)}
                  step="0.1"
                  min="0"
                  max="20"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Rút tiền tối thiểu (VND)</label>
                <input
                  type="number"
                  value={minWithdrawal}
                  onChange={(e) => setMinWithdrawal(e.target.value)}
                  step="100000"
                  min="0"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Ngôn ngữ mặc định</label>
                <select className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all">
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Security settings */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Bảo mật
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Xác thực 2 bước (2FA)', enabled: true },
              { label: 'Ghi log hoạt động admin', enabled: true },
              { label: 'Giới hạn đăng nhập thất bại', enabled: true },
              { label: 'Thông báo đăng nhập qua email', enabled: false },
              { label: 'Tự động khoá tài khoản không hoạt động', enabled: false },
            ].map((setting) => (
              <div key={setting.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-ink">{setting.label}</span>
                <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${setting.enabled ? 'bg-green' : 'bg-border'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${setting.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
