import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Check } from 'lucide-react'

const highlights = [
  'Unlimited prompt storage with tags and favorites',
  'Instant search across titles, content, and tags',
  'Test prompts with variables before you reuse them',
  'Private by design — your data, protected by RLS',
]

/** Split-screen layout shared by all auth pages. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-h-dvh bg-background">
      {/* Brand panel */}
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden border-r border-border bg-surface p-10 lg:flex">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <Link to="/" className="relative z-10 inline-flex w-fit" aria-label="Prompt Stash home">
          <Logo size={30} />
        </Link>

        <div className="relative z-10">
          <h2 className="max-w-md text-[1.7rem] font-semibold leading-snug tracking-tight">
            Your prompts, organized.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Save, organize, refine, and reuse the prompts you rely on every day — in one focused
            workspace.
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/85">
                <span className="mt-0.5 flex h-4.5 w-4.5 h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-caption text-muted-foreground">
          Prompt Stash · React · TypeScript · Supabase · Tauri
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 lg:hidden">
            <Logo size={30} />
          </div>
          <h1 className="text-h1">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-center text-[13px] text-muted-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
