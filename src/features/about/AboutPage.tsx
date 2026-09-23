import { Link, useNavigate } from 'react-router-dom'
import {
  Archive,
  ArrowRight,
  BadgeCheck,
  Braces,
  Database,
  Download,
  FolderOpen,
  Globe,
  Keyboard,
  LayoutGrid,
  Lock,
  Palette,
  PenLine,
  Play,
  Repeat,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Terminal,
  Upload,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'
import {
  HeroCommandPalette,
  HeroPromptCard,
  HeroSearchBar,
  MiniTag,
  TesterFragment,
  ViewToggleFragment,
} from './AboutFragments'

/* ------------------------------------------------------------------ */
/* Shared section primitives                                           */
/* ------------------------------------------------------------------ */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="reveal text-label uppercase tracking-[0.14em] text-primary">{children}</p>
  )
}

function SectionHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        'reveal mt-3 text-[clamp(1.6rem,3.2vw,2.4rem)] font-bold leading-tight tracking-tight text-foreground',
        className,
      )}
    >
      {children}
    </h2>
  )
}

function SectionLead({ children }: { children: React.ReactNode }) {
  return (
    <p className="reveal mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
      {children}
    </p>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function AboutPage() {
  const navigate = useNavigate()
  const rootRef = useReveal<HTMLDivElement>()

  return (
    <div ref={rootRef} className="overflow-x-clip">
      <div className="mx-auto w-full max-w-editorial px-4 sm:px-6 lg:px-8">
        {/* ---------------- 01 · Hero ---------------- */}
        <section className="relative pb-20 pt-14 sm:pt-20">
          <div className="bg-grid pointer-events-none absolute inset-x-0 -top-14 h-[420px]" aria-hidden="true" />
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Eyebrow>About Prompt Stash</Eyebrow>
              <h1 className="reveal mt-4 text-display text-foreground" style={{ '--reveal-delay': '60ms' } as React.CSSProperties}>
                Your prompts, organized for the way you work.
              </h1>
              <p className="reveal mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground" style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
                Prompt Stash gives you a focused workspace to save, organize, refine, and reuse the
                prompts you rely on every day.
              </p>
              <div className="reveal mt-8 flex flex-wrap gap-3" style={{ '--reveal-delay': '180ms' } as React.CSSProperties}>
                <Button size="lg" onClick={() => navigate('/app/prompts')}>
                  Explore Prompt Stash
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth' })}>
                  View Features
                </Button>
              </div>
            </div>

            {/* Hero visual — real UI fragments */}
            <div className="relative mx-auto h-[420px] w-full max-w-md" aria-hidden="true">
              <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
              <HeroSearchBar className="absolute left-0 top-4" delay="150ms" />
              <HeroPromptCard className="absolute left-1/2 top-24 -translate-x-1/2 lg:left-8 lg:translate-x-0" delay="280ms" />
              <HeroCommandPalette className="absolute bottom-0 left-2" delay="400ms" />
              <div className="reveal absolute right-0 top-0 hidden sm:block" style={{ '--reveal-delay': '330ms' } as React.CSSProperties}>
                <ViewToggleFragment />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- 02 · Product introduction ---------------- */}
        <section className="border-t border-border py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Eyebrow>02 · The idea</Eyebrow>
              <SectionHeading>Built for prompts you actually want to keep.</SectionHeading>
              <SectionLead>
                Great prompts are hard-won. You iterate, you test, you finally find the phrasing
                that works — and then it disappears into a chat history you will never open again.
                Prompt Stash exists so that work compounds instead of evaporating: one library,
                always searchable, always yours.
              </SectionLead>
            </div>
            <div className="grid content-center gap-3 sm:grid-cols-2">
              {[
                { icon: <FolderOpen className="h-4.5 w-4.5 h-[18px] w-[18px]" />, title: 'Unlimited prompt storage', text: 'Save as many prompts as you need — there is no artificial cap.' },
                { icon: <Tag className="h-[18px] w-[18px]" />, title: 'Smart organization', text: 'Tags, favorites, archives, and trash keep any library tidy.' },
                { icon: <Search className="h-[18px] w-[18px]" />, title: 'Instant search', text: 'Find anything across titles, content, notes, and tags.' },
                { icon: <Zap className="h-[18px] w-[18px]" />, title: 'Fast retrieval', text: 'One click to copy a prompt and get back to your work.' },
              ].map((f, i) => (
                <div
                  key={f.title}
                  className="reveal rounded-lg border border-border bg-surface-elevated p-4 shadow-card transition-transform duration-200 hover:-translate-y-0.5"
                  style={{ '--reveal-delay': `${i * 70}ms` } as React.CSSProperties}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary">
                    {f.icon}
                  </span>
                  <p className="mt-3 text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- 03 · Why Prompt Stash ---------------- */}
        <section className="border-t border-border py-20">
          <Eyebrow>03 · Why Prompt Stash</Eyebrow>
          <SectionHeading>Less searching. More creating.</SectionHeading>
          <SectionLead>
            Four habits, one workspace. Prompt Stash is shaped around the way prompt work actually
            happens.
          </SectionLead>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <PenLine className="h-5 w-5" />, title: 'Capture', text: 'Save useful prompts the moment you find or write them — before they vanish.' },
              { icon: <Tag className="h-5 w-5" />, title: 'Organize', text: 'Use tags, favorites, and archives so structure grows with your library.' },
              { icon: <Repeat className="h-5 w-5" />, title: 'Reuse', text: 'Copy prompts instantly, with variables filled in exactly how you need them.' },
              { icon: <Sparkles className="h-5 w-5" />, title: 'Refine', text: 'Edit and improve prompts over time — your library gets better, not bigger.' },
            ].map((f, i) => (
              <div
                key={f.title}
                className="reveal rounded-lg border border-border bg-surface-elevated p-5 shadow-card transition-transform duration-200 hover:-translate-y-0.5"
                style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                  {f.icon}
                </span>
                <p className="mt-4 text-[15px] font-semibold text-foreground">{f.title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- 04 · Capability showcase ---------------- */}
        <section id="capabilities" className="border-t border-border py-20">
          <Eyebrow>04 · Core capabilities</Eyebrow>
          <SectionHeading>Everything a prompt library should do.</SectionHeading>
          <SectionLead>
            The Prompt Library is the center of gravity — search, tags, favorites, testing, and
            data portability orbit around it.
          </SectionLead>

          <div className="mt-10 grid gap-3 lg:grid-cols-3">
            {/* Dominant capability */}
            <div className="reveal relative overflow-hidden rounded-lg border border-primary/25 bg-surface-elevated p-6 shadow-card lg:col-span-2 lg:row-span-2">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <LayoutGrid className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-lg font-semibold">Prompt Library</p>
              </div>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                A dense but comfortable grid of prompt cards with tags, descriptions, previews, and
                one-click actions. Grid or list — your choice, remembered.
              </p>

              {/* Mini library illustration */}
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2" aria-hidden="true">
                {[
                  { tags: ['Writing', 'Ideas'], title: 'Story Idea Generator', fav: true },
                  { tags: ['Dev', 'Review'], title: 'Code Review Assistant', fav: false },
                ].map((c) => (
                  <div key={c.title} className="rounded-md border border-border bg-surface p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {c.tags.map((t) => (
                          <MiniTag key={t}>{t}</MiniTag>
                        ))}
                      </div>
                      {c.fav && <Star className="h-3.5 w-3.5 fill-warning text-warning" />}
                    </div>
                    <p className="mt-2 text-[13px] font-semibold text-foreground">{c.title}</p>
                    <div className="mt-2 h-1.5 w-4/5 rounded bg-muted" />
                    <div className="mt-1 h-1.5 w-3/5 rounded bg-muted" />
                  </div>
                ))}
              </div>
            </div>

            {/* Supporting capabilities */}
            {[
              { icon: <Search className="h-4 w-4" />, title: 'Search', text: 'Across titles, content, notes, and tags — debounced and fast.' },
              { icon: <Tag className="h-4 w-4" />, title: 'Tags', text: 'Create, rename, and filter. Counts stay accurate automatically.' },
              { icon: <Star className="h-4 w-4" />, title: 'Favorites', text: 'Star what matters; favorites sync to your account.' },
              { icon: <Play className="h-4 w-4" />, title: 'Prompt Tester', text: 'Preview {{variables}} with example values before reuse.' },
              { icon: <Archive className="h-4 w-4" />, title: 'Archive & Trash', text: 'Soft deletion everywhere — nothing disappears by accident.' },
              { icon: <Keyboard className="h-4 w-4" />, title: 'Shortcuts', text: '⌘K palette, ⌘N new prompt, ⌘⇧C copy. Keyboard-first.' },
              { icon: <Palette className="h-4 w-4" />, title: 'Themes', text: 'Obsidian Pro, Paper Pro, system mode, six accents.' },
            ].map((f, i) => (
              <div
                key={f.title}
                className="reveal flex items-start gap-3 rounded-lg border border-border bg-surface-elevated p-4 shadow-card transition-transform duration-200 hover:-translate-y-0.5"
                style={{ '--reveal-delay': `${(i % 4) * 60}ms` } as React.CSSProperties}
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                  {f.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{f.text}</p>
                </div>
              </div>
            ))}

            {/* Import/export wide card */}
            <div className="reveal flex items-start gap-3 rounded-lg border border-border bg-surface-elevated p-4 shadow-card lg:col-span-2">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                <Download className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Import &amp; Export</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  Your library is portable JSON. Export anytime; import validates every row and
                  never trusts ids from the file.
                </p>
              </div>
              <span className="ml-auto hidden items-center gap-1.5 text-muted-foreground sm:flex">
                <Upload className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          </div>
        </section>

        {/* ---------------- 05 · How it works ---------------- */}
        <section className="border-t border-border py-20">
          <Eyebrow>05 · How it works</Eyebrow>
          <SectionHeading>From discovery to daily use.</SectionHeading>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
            <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {[
                { n: '01', title: 'Capture', text: 'Hit New Prompt and paste or write the prompt worth keeping.' },
                { n: '02', title: 'Organize', text: 'Add tags and a description so future-you can find it in seconds.' },
                { n: '03', title: 'Refine', text: 'Edit over time. Autosave keeps every improvement without friction.' },
                { n: '04', title: 'Reuse', text: 'Search, test variables, copy — and get back to creating.' },
              ].map((step, i) => (
                <li
                  key={step.n}
                  className="reveal relative rounded-lg border border-border bg-surface-elevated p-5 shadow-card"
                  style={{ '--reveal-delay': `${i * 110}ms` } as React.CSSProperties}
                >
                  <span className="text-[13px] font-bold tabular-nums text-primary">{step.n}</span>
                  <p className="mt-2 text-[15px] font-semibold text-foreground">{step.title}</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
            <div className="flex items-start justify-center lg:justify-end" aria-hidden="true">
              <TesterFragment delay="220ms" className="lg:sticky lg:top-10" />
            </div>
          </div>
        </section>

        {/* ---------------- 06 · Design philosophy ---------------- */}
        <section className="border-t border-border py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>06 · Design philosophy</Eyebrow>
            <SectionHeading className="mx-auto">Designed to stay out of your way.</SectionHeading>
            <SectionLead>
              <span className="mx-auto block">
                A tool you use every day should feel calm. Prompt Stash follows four principles in
                every screen we ship.
              </span>
            </SectionLead>
          </div>
          <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {[
              { title: 'Clarity', text: 'Every element has a purpose. If it does not help you find or use a prompt, it does not appear.' },
              { title: 'Speed', text: 'Common actions take one keystroke or one click. Search, copy, favorite — all within reach.' },
              { title: 'Focus', text: 'Restrained color, controlled elevation, and quiet motion support your work instead of competing with it.' },
              { title: 'Consistency', text: 'The same spacing, typography, and interaction patterns from day one to prompt one thousand.' },
            ].map((p, i) => (
              <div key={p.title} className="reveal text-center sm:text-left" style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}>
                <p className="text-[17px] font-semibold text-foreground">{p.title}</p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground sm:mx-0">
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- 07 · Privacy & security ---------------- */}
        <section className="border-t border-border py-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <Eyebrow>07 · Privacy &amp; security</Eyebrow>
              <SectionHeading>Your prompt library belongs to you.</SectionHeading>
              <SectionLead>
                Prompt Stash is built on boring, dependable security — the kind you can inspect.
              </SectionLead>
            </div>
            <ul className="space-y-4">
              {[
                { icon: <Lock className="h-4 w-4" />, title: 'Real authentication', text: 'Sign-up, sign-in, and password recovery are handled by Supabase Auth. No homemade password storage.' },
                { icon: <Database className="h-4 w-4" />, title: 'Per-user data isolation', text: 'Every prompt and tag is scoped to your account in PostgreSQL.' },
                { icon: <ShieldCheck className="h-4 w-4" />, title: 'Row Level Security', text: 'Access rules are enforced in the database itself — not just in the interface. One user can never read or change the library of another user.' },
                { icon: <BadgeCheck className="h-4 w-4" />, title: 'No privileged keys in the client', text: 'The app ships only the publishable key. Service-role credentials are never part of the web or desktop bundle.' },
              ].map((item, i) => (
                <li
                  key={item.title}
                  className="reveal flex items-start gap-3.5 rounded-lg border border-border bg-surface-elevated p-4 shadow-card"
                  style={{ '--reveal-delay': `${i * 70}ms` } as React.CSSProperties}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-success/10 text-success">
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------------- 08 · Technology foundation ---------------- */}
        <section className="border-t border-border py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>08 · Technology foundation</Eyebrow>
            <SectionHeading className="mx-auto">Modern, boring, dependable.</SectionHeading>
            <SectionLead>
              <span className="mx-auto block">
                One frontend powers both the web app and the Windows desktop app.
              </span>
            </SectionLead>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {[
              { icon: <Globe className="h-4 w-4" />, name: 'React' },
              { icon: <Braces className="h-4 w-4" />, name: 'TypeScript' },
              { icon: <Zap className="h-4 w-4" />, name: 'Vite' },
              { icon: <Palette className="h-4 w-4" />, name: 'Tailwind CSS' },
              { icon: <Database className="h-4 w-4" />, name: 'Supabase' },
              { icon: <ShieldCheck className="h-4 w-4" />, name: 'PostgreSQL' },
              { icon: <Terminal className="h-4 w-4" />, name: 'Tauri' },
              { icon: <ArrowRight className="h-4 w-4" />, name: 'Vercel' },
            ].map((tech, i) => (
              <span
                key={tech.name}
                className="reveal inline-flex items-center gap-2 rounded-md border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium text-foreground shadow-card"
                style={{ '--reveal-delay': `${i * 45}ms` } as React.CSSProperties}
              >
                <span className="text-primary" aria-hidden="true">
                  {tech.icon}
                </span>
                {tech.name}
              </span>
            ))}
          </div>
        </section>

        {/* ---------------- 09 · Product vision ---------------- */}
        <section className="border-t border-border py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>09 · Product vision</Eyebrow>
            <SectionHeading className="mx-auto">A better home for the prompts that matter.</SectionHeading>
            <p className="reveal mt-4 text-[15px] leading-relaxed text-muted-foreground">
              Today, Prompt Stash does the essentials exceptionally well. Where it goes next is
              guided by the same principle: make prompt work easier without adding noise. Ideas on
              the horizon include collections and shared libraries, prompt history, and
              model-specific variants — each only when it genuinely earns its place. Nothing here
              is promised; everything here is considered.
            </p>
          </div>
        </section>

        {/* ---------------- 10 · Final CTA ---------------- */}
        <section className="border-t border-border pb-24 pt-20">
          <div className="reveal relative overflow-hidden rounded-xl border border-primary/25 bg-surface-elevated px-6 py-14 text-center shadow-card">
            <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-96 rounded-full bg-primary/12 blur-3xl" aria-hidden="true" />
            <h2 className="mx-auto max-w-xl text-[clamp(1.6rem,3vw,2.2rem)] font-bold leading-tight tracking-tight">
              Ready to build your prompt library?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
              Save the prompts you use. Organize the ones you love. Find them instantly.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={() => navigate('/app/prompts')}>
                Open Prompt Stash
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/app/prompts/new')}>
                Create Your First Prompt
              </Button>
            </div>
          </div>

          <footer className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row">
            <p>Prompt Stash — Your prompts, organized.</p>
            <p>
              Built with React, Supabase &amp; Tauri ·{' '}
              <Link to="/app/settings" className="text-primary hover:underline">
                Settings
              </Link>
            </p>
          </footer>
        </section>
      </div>
    </div>
  )
}
