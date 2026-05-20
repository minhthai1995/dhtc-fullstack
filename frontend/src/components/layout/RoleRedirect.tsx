import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '@/features/auth/useAuth'
import { Spinner } from '@/components/ui/Spinner'

export function RoleRedirect() {
  const { data: user, isLoading } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    )
  }

  if (!sessionStorage.getItem('access_token') || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (user.role === 'seller') return <Navigate to="/seller/dashboard" replace />
  return <Navigate to="/shop" replace />
}
