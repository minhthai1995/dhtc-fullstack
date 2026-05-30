import { useCurrentUser, useLogout } from '@/features/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useT } from '@/i18n/useT'

export function Home() {
  const { data: user, isLoading } = useCurrentUser()
  const logout = useLogout()
  const { t } = useT()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('home.title')}</h1>
        <Button variant="secondary" onClick={() => logout.mutate()}>
          {t('home.logout')}
        </Button>
      </div>

      {user && (
        <Card className="mt-8 max-w-sm">
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">{t('home.accountInfo')}</h2>
          </CardHeader>
          <CardBody>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-20 text-gray-500">{t('home.fieldId')}</dt>
                <dd className="font-mono text-gray-900">{user.id}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 text-gray-500">{t('home.fieldEmail')}</dt>
                <dd className="text-gray-900">{user.email}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 text-gray-500">{t('home.fieldStatus')}</dt>
                <dd className={user.is_active ? 'text-green-600' : 'text-red-600'}>
                  {user.is_active ? t('home.statusActive') : t('home.statusLocked')}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      )}

      <p className="mt-8 text-sm text-gray-500">{t('home.placeholder')}</p>
    </div>
  )
}
