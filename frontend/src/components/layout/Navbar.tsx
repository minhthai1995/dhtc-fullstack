import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLogout, useIsAuthenticated } from '@/features/auth/useAuth'
import { useT } from '@/i18n/useT'

export function Navbar() {
  const isAuth = useIsAuthenticated()
  const logoutMutation = useLogout()
  const { t } = useT()

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-brand hover:text-brand-dark">
          {t('navbar.brand')}
        </Link>

        {isAuth && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            loading={logoutMutation.isPending}
          >
            <LogOut className="size-4" />
            {t('navbar.logout')}
          </Button>
        )}
      </nav>
    </header>
  )
}
