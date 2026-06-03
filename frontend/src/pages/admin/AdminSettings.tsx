import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Save } from 'lucide-react'
import { useSettings, useSaveSettings } from '@/features/admin/useSettings'
import { useToast } from '@/components/ui/Toast'
import { useT } from '@/i18n/useT'

function getVal(configs: { key: string; value: string }[], key: string, fallback: string): string {
  return configs.find((c) => c.key === key)?.value ?? fallback
}

export function AdminSettings() {
  const { t } = useT()
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
      { key: 'platform_name', value: platformName, description: t('adminSettings.descPlatformName') },
      { key: 'fee_rate', value: feeRate, description: t('adminSettings.descFeeRate') },
      { key: 'min_withdrawal', value: minWithdrawal, description: t('adminSettings.descMinWithdrawal') },
    ]
    try {
      await save.mutateAsync(items)
      toast(t('adminSettings.saveSuccess'), 'success')
    } catch {
      toast(t('adminSettings.saveFailed'), 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title={t('adminSettings.title')}
        subtitle={t('adminSettings.subtitle')}
        actions={
          <button
            onClick={handleSave}
            disabled={save.isPending || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold hover:bg-green-soft transition-colors disabled:opacity-60"
          >
            <Save size={15} />
            {save.isPending ? t('adminSettings.saving') : t('adminSettings.saveChanges')}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Platform settings */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            {t('adminSettings.platformConfig')}
          </h2>
          {isLoading ? (
            <div className="text-sm text-ink-mute">{t('adminSettings.loading')}</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">{t('adminSettings.platformName')}</label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">{t('adminSettings.feeRate')}</label>
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
                <label className="block text-sm font-semibold text-ink mb-1.5">{t('adminSettings.minWithdrawal')}</label>
                <input
                  type="number"
                  value={minWithdrawal}
                  onChange={(e) => setMinWithdrawal(e.target.value)}
                  step="100000"
                  min="0"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Security settings */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            {t('adminSettings.security')}
          </h2>
          <div className="text-sm text-ink-mute italic py-4">
            {t('adminSettings.securityComingSoon')}
          </div>
        </div>
      </div>
    </div>
  )
}
