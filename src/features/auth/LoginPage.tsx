import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { RedirectIfAuthed } from './RequireAuth'
import { Button } from '@/components/ui/Button'
import { FieldError, Input, Label } from '@/components/ui/Field'
import { isMockMode, isSupabaseConfigured, supabase, supabaseErrorMessage } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

function GoogleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginForm) => {
    setFormError(null)
    if (!isSupabaseConfigured) return

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      setFormError(supabaseErrorMessage(error))
      return
    }

    toast('Welcome back.', 'success')
    const from = (location.state as { from?: string } | null)?.from
    navigate(from ?? '/app/prompts', { replace: true })
  }

  const handleGoogleLogin = async () => {
    setFormError(null)
    setIsGoogleLoading(true)
    try {
      const from = (location.state as { from?: string } | null)?.from
      const redirectTo = `${window.location.origin}${from ?? '/app/prompts'}`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      })
      if (error) {
        setFormError(supabaseErrorMessage(error))
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not initiate Google sign in.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setFormError(null)
    setIsDemoSubmitting(true)
    setValue('email', 'qa@promptstash.dev')
    setValue('password', 'password123')
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'qa@promptstash.dev',
        password: 'password123',
      })

      if (error) {
        setFormError(supabaseErrorMessage(error))
        return
      }

      toast('Logged in with Mock QA Account.', 'success')
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? '/app/prompts', { replace: true })
    } finally {
      setIsDemoSubmitting(false)
    }
  }

  return (
    <RedirectIfAuthed>
      <AuthLayout
        title="Welcome back"
        subtitle="Sign in to your prompt library."
        footer={
          <>
            New to Prompt Stash?{' '}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </>
        }
      >
        <div className="space-y-4">
          {/* Google Sign In */}
          {!isMockMode && (
            <>
              <Button
                type="button"
                variant="outline"
                size="lg"
                loading={isGoogleLoading}
                onClick={handleGoogleLogin}
                className="w-full gap-2.5 border-border bg-surface hover:bg-surface-hover text-foreground font-medium shadow-sm active:scale-[0.98]"
              >
                <GoogleIcon className="h-4 w-4" />
                Continue with Google
              </Button>

              <div className="relative my-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <span className="relative bg-surface-elevated px-2.5 text-xs text-muted-foreground">
                  or sign in with email
                </span>
              </div>
            </>
          )}

          {isMockMode && (
            <>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span>Mock Authentication Mode Active</span>
                </div>
                <p className="mt-1 leading-relaxed">
                  Use <strong>1-Click Demo Login</strong> below or enter any email and password to test the app locally.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary active:bg-primary/25"
                size="lg"
                loading={isDemoSubmitting}
                onClick={handleDemoLogin}
              >
                <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                1-Click Demo Login (QA User)
              </Button>

              <div className="relative my-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <span className="relative bg-surface-elevated px-2.5 text-xs text-muted-foreground">
                  or sign in with email
                </span>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {formError && (
              <div role="alert" className="rounded-md border border-danger/25 bg-danger/8 px-3 py-2.5 text-[13px] text-danger">
                {formError}
              </div>
            )}

            <div>
              <Label htmlFor="login-email" required>
                Email
              </Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              invalid={Boolean(errors.email)}
              {...register('email')}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" required>
                Password
              </Label>
              <Link
                to="/forgot-password"
                className="mb-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pr-10"
                invalid={Boolean(errors.password)}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <FieldError>{errors.password?.message}</FieldError>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
            Sign in
          </Button>
        </form>
        </div>
      </AuthLayout>
    </RedirectIfAuthed>
  )
}
