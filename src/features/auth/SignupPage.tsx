import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MailCheck, Sparkles } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { RedirectIfAuthed } from './RequireAuth'
import { Button } from '@/components/ui/Button'
import { FieldError, Input, Label } from '@/components/ui/Field'
import { isSupabaseConfigured, supabase, supabaseErrorMessage } from '@/lib/supabase'

const signupSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .max(60, 'Keep your name under 60 characters')
      .optional()
      .or(z.literal('')),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .max(72, 'Keep your password under 72 characters'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type SignupForm = z.infer<typeof signupSchema>

export function SignupPage() {
  const [formError, setFormError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) })

  const onSubmit = async (values: SignupForm) => {
    setFormError(null)
    if (!isSupabaseConfigured) return

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { display_name: values.displayName?.trim() || undefined } },
    })

    if (error) {
      setFormError(supabaseErrorMessage(error))
      return
    }

    if (data.user && !data.session) {
      // Email confirmation is enabled for this project.
      setNeedsConfirmation(true)
      return
    }

    // Auto sign-in: router guard will redirect to /app.
  }

  if (needsConfirmation) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We sent you a confirmation link."
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center rounded-lg border border-border bg-surface-elevated px-6 py-10 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
            <MailCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Confirm your email address to activate your account, then sign in to start building
            your prompt library.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <RedirectIfAuthed>
      <AuthLayout
        title="Create your account"
        subtitle="Start building your personal prompt library."
        footer={
          <>
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
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
              Sign up with any mock email to create a new session instantly, or{' '}
              <Link to="/login" className="font-medium text-primary underline underline-offset-2">
                use 1-Click Demo Login
              </Link>
              .
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {formError && (
              <div role="alert" className="rounded-md border border-danger/25 bg-danger/8 px-3 py-2.5 text-[13px] text-danger">
                {formError}
              </div>
            )}

            <div>
              <Label htmlFor="signup-name">Display name</Label>
            <Input
              id="signup-name"
              autoComplete="name"
              placeholder="Ada Lovelace"
              invalid={Boolean(errors.displayName)}
              {...register('displayName')}
            />
            <FieldError>{errors.displayName?.message}</FieldError>
          </div>

          <div>
            <Label htmlFor="signup-email" required>
              Email
            </Label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              invalid={Boolean(errors.email)}
              {...register('email')}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </div>

          <div>
            <Label htmlFor="signup-password" required>
              Password
            </Label>
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              invalid={Boolean(errors.password)}
              {...register('password')}
            />
            <FieldError>{errors.password?.message}</FieldError>
          </div>

          <div>
            <Label htmlFor="signup-confirm" required>
              Confirm password
            </Label>
            <Input
              id="signup-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              invalid={Boolean(errors.confirm)}
              {...register('confirm')}
            />
            <FieldError>{errors.confirm?.message}</FieldError>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
            Create account
          </Button>

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            By creating an account you agree to keep your library yours — data is stored per user
            and protected by Row Level Security.
          </p>
        </form>
        </div>
      </AuthLayout>
    </RedirectIfAuthed>
  )
}
