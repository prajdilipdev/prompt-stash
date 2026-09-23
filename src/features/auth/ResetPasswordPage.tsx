import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/Button'
import { FieldError, Input, Label } from '@/components/ui/Field'
import { isSupabaseConfigured, supabase, supabaseErrorMessage } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

const schema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters').max(72),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type Form = z.infer<typeof schema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [ready, setReady] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)

  // The reset link signs the user in with a recovery session. If there is
  // none after a moment, the link is stale or was already used.
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === 'PASSWORD_RECOVERY' || (session && session.user.recovery_sent_at)) {
        setReady(true)
      }
    })
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) setReady(true)
    })
    const timer = window.setTimeout(() => {
      if (!cancelled) {
        setReady((r) => {
          if (!r) setExpired(true)
          return r
        })
      }
    }, 4000)
    return () => {
      cancelled = true
      subscription.unsubscribe()
      window.clearTimeout(timer)
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: Form) => {
    setFormError(null)
    const { error } = await supabase.auth.updateUser({ password: values.password })
    if (error) {
      setFormError(supabaseErrorMessage(error))
      return
    }
    toast('Password updated. You are signed in.', 'success')
    navigate('/app/prompts', { replace: true })
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Pick something memorable and unique."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {expired ? (
        <div className="rounded-lg border border-border bg-surface-elevated px-6 py-8 text-center">
          <p className="text-sm leading-relaxed text-muted-foreground">
            This reset link is no longer valid. Request a new one from the{' '}
            <Link to="/forgot-password" className="font-medium text-primary hover:underline">
              reset page
            </Link>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError && (
            <div role="alert" className="rounded-md border border-danger/25 bg-danger/8 px-3 py-2.5 text-[13px] text-danger">
              {formError}
            </div>
          )}
          <div>
            <Label htmlFor="reset-password" required>
              New password
            </Label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              disabled={!ready}
              invalid={Boolean(errors.password)}
              {...register('password')}
            />
            <FieldError>{errors.password?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="reset-confirm" required>
              Confirm new password
            </Label>
            <Input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              disabled={!ready}
              invalid={Boolean(errors.confirm)}
              {...register('confirm')}
            />
            <FieldError>{errors.confirm?.message}</FieldError>
          </div>
          <Button type="submit" className="w-full" size="lg" loading={isSubmitting} disabled={!ready}>
            Update password
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
