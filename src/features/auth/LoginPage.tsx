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
import { isSupabaseConfigured, supabase, supabaseErrorMessage } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false)

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
