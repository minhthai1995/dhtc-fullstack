import { Navigate, Outlet } from 'react-router-dom'
import { useCurrentUser } from './useAuth'
import { Spinner } from '@/components/ui/Spinner'

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'seller' | 'customer'
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { data: user, isLoading } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    )
  }

  if (!sessionStorage.getItem('access_token')) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user && user.role !== requiredRole) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (user.role === 'seller') return <Navigate to="/seller/dashboard" replace />
    return <Navigate to="/shop" replace />
  }

  return <Outlet />
}
