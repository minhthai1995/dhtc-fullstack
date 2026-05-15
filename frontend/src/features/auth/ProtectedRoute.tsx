import { Navigate, Outlet } from 'react-router-dom'
import { useIsAuthenticated } from './useAuth'

export function ProtectedRoute() {
  const isAuth = useIsAuthenticated()
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />
}
