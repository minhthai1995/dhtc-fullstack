/**
 * FacebookLoginButton — kicks off the OAuth redirect flow.
 *
 * Navigates the whole window (not React Router) to the backend `/start`
 * endpoint so the server can set the CSRF state cookie before redirecting
 * to facebook.com. The user returns to `/auth/fb-return?token=...|error=...`.
 *
 * Visual: full-width pill button, FB blue background, white "f" mark.
 */
const FB_OAUTH_START_PATH = '/api/v1/auth/facebook/start'

type Props = {
  label?: string
  className?: string
  disabled?: boolean
}

export function FacebookLoginButton({
  label = 'Tiếp tục với Facebook',
  className = '',
  disabled = false,
}: Props) {
  const handleClick = () => {
    if (disabled) return
    window.location.href = FB_OAUTH_START_PATH
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      className={
        'w-full py-3 rounded-xl font-semibold text-sm text-white ' +
        'bg-[#1877F2] hover:bg-[#166fe5] disabled:opacity-60 disabled:cursor-not-allowed ' +
        'transition-colors flex items-center justify-center gap-2 ' +
        className
      }
    >
      <FacebookIcon className="w-4 h-4" />
      {label}
    </button>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.408.593 24 1.325 24h11.494v-9.294H9.691v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.464.099 2.796.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.592 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" />
    </svg>
  )
}
