import { type FormEvent, useState } from 'react'
import { useLogin } from '@/features/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const login = useLogin()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    login.mutate({ username, password })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="text-xl font-semibold text-gray-900">Đăng nhập</h1>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Tên đăng nhập
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                           placeholder:text-gray-400
                           focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                           placeholder:text-gray-400
                           focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {login.isError && (
              <p role="alert" className="text-sm text-red-600">
                Sai tên đăng nhập hoặc mật khẩu.
              </p>
            )}

            <Button type="submit" className="w-full" loading={login.isPending}>
              Đăng nhập
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
