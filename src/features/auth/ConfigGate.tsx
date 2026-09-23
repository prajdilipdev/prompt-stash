import { Database, Terminal } from 'lucide-react'
import { Logo } from '@/components/Logo'

/**
 * Shown when VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are missing.
 * Honest setup guidance instead of a fake demo mode.
 */
export function ConfigGate() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg animate-fade-up">
        <div className="rounded-lg border border-border bg-surface-elevated p-8 shadow-card">
          <Logo size={32} />
          <h1 className="mt-6 text-h1">Connect your Supabase project</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Prompt Stash stores every prompt in your own Supabase project with Row Level Security.
            To run the app, point it at a project:
          </p>

          <ol className="mt-5 space-y-3 text-sm text-foreground/90">
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
                1
              </span>
              <span>
                Create a project at <span className="font-medium text-primary">supabase.com</span>{' '}
                and apply the migrations in{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  supabase/migrations
                </code>
                .
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
                2
              </span>
              <span>
                Copy{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.env.example</code>{' '}
                to{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.env</code> and
                fill in your project URL and publishable key.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
                3
              </span>
              <span>
                Restart the dev server — the app picks the configuration up automatically.
              </span>
            </li>
          </ol>

          <div className="mt-6 flex items-start gap-2.5 rounded-md border border-border bg-surface p-3.5">
            <Terminal className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-muted-foreground">
{`VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`}
            </pre>
          </div>

          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Only the publishable key belongs in the frontend. Never add a service-role key — all
            access control is enforced by PostgreSQL RLS.
          </p>
        </div>
      </div>
    </div>
  )
}
