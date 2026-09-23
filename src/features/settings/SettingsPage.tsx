import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, LogOut, Upload, UserRound } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { fetchProfile, updateDisplayName, deleteAllUserData } from '@/services/profileService'
import { fetchAllForExport } from '@/services/promptService'
import { exportPromptsToFile } from '@/lib/importExport'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryClient'
import { AccentPicker, ThemeModeSwitcher } from '@/components/ThemeSwitcher'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { Tabs, Tab, TabList, TabPanel } from '@/components/ui/Tabs'
import { useUI } from '@/components/UIContext'
import { useToast } from '@/components/Toast'
import { storage } from '@/lib/utils'
import type { SortKey } from '@/types'
import { SORT_OPTIONS } from '@/types'

type SettingsTab = 'account' | 'appearance' | 'library' | 'data' | 'danger'

export function SettingsPage() {
  const [params] = useSearchParams()
  const initial = (params.get('tab') as SettingsTab) || 'account'
  const [tab, setTab] = useState<SettingsTab>(
    ['account', 'appearance', 'library', 'data', 'danger'].includes(initial) ? initial : 'account',
  )

  return (
    <div className="page-enter mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
      <h1 className="text-h1">Settings</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Manage your account, appearance, library defaults, and data.
      </p>

      <Tabs value={tab} onChange={(v) => setTab(v as SettingsTab)} label="Settings" className="mt-6">
        <TabList className="overflow-x-auto no-scrollbar border-b border-border pb-2.5 sm:pb-3">
          <Tab value="account">Account</Tab>
          <Tab value="appearance">Appearance</Tab>
          <Tab value="library">Library</Tab>
          <Tab value="data">Data</Tab>
          <Tab value="danger">Danger Zone</Tab>
        </TabList>

        <div className="pt-6">
          <TabPanel value="account">
            <AccountSection />
          </TabPanel>
          <TabPanel value="appearance">
            <AppearanceSection />
          </TabPanel>
          <TabPanel value="library">
            <LibrarySection />
          </TabPanel>
          <TabPanel value="data">
            <DataSection />
          </TabPanel>
          <TabPanel value="danger">
            <DangerSection />
          </TabPanel>
        </div>
      </Tabs>
    </div>
  )
}

/* ------------------------------------------------------------------ */
function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-border bg-surface-elevated p-5 shadow-card">
      <h2 className="text-h3">{title}</h2>
      {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function AccountSection() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const client = useQueryClient()

  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => fetchProfile(user?.id ?? ''),
    enabled: Boolean(user?.id),
  })

  const [name, setName] = useState('')
  useEffect(() => {
    if (profileQuery.data?.displayName) setName(profileQuery.data.displayName)
  }, [profileQuery.data])

  const saveName = useMutation({
    mutationFn: (displayName: string) => updateDisplayName(user?.id ?? '', displayName),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.profile })
      toast('Display name saved.', 'success')
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Could not save your name.', 'error'),
  })

  return (
    <div className="space-y-4">
      <SectionCard title="Profile" description="How your account appears inside Prompt Stash.">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary"
          >
            {(user?.email?.[0] ?? 'u').toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Signed in with Supabase Auth</p>
          </div>
        </div>

        <form
          className="mt-5 flex max-w-md flex-col gap-2 sm:flex-row sm:items-start"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) saveName.mutate(name)
          }}
        >
          <div className="flex-1">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={60}
            />
          </div>
          <Button type="submit" className="sm:mt-7" loading={saveName.isPending} disabled={!name.trim()}>
            Save
          </Button>
        </form>
      </SectionCard>

      <SectionCard title="Session">
        <Button
          variant="secondary"
          onClick={async () => {
            await supabase.auth.signOut()
            toast('Signed out.', 'info')
            navigate('/login')
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log out
        </Button>
      </SectionCard>
    </div>
  )
}

function AppearanceSection() {
  return (
    <div className="space-y-4">
      <SectionCard
        title="Theme"
        description="System follows your OS preference. Your choice is saved on this device."
      >
        <ThemeModeSwitcher className="w-full max-w-xs" />
      </SectionCard>

      <SectionCard
        title="Accent color"
        description="A restrained accent applied to buttons, active navigation, focus rings, and highlights."
      >
        <AccentPicker />
      </SectionCard>
    </div>
  )
}

function LibrarySection() {
  const { toast } = useToast()
  const [sort, setSort] = useState<SortKey>(() => storage.get<SortKey>('default-sort', 'updated'))
  const [view, setView] = useState<'grid' | 'list'>(() => storage.get<'grid' | 'list'>('view-mode', 'grid'))

  return (
    <SectionCard title="Library defaults" description="Applied every time you open the library.">
      <div className="grid max-w-md gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="default-sort">Default sort</Label>
          <Select
            id="default-sort"
            className="w-full"
            value={sort}
            onChange={(e) => {
              const next = e.target.value as SortKey
              setSort(next)
              storage.set('default-sort', next)
              toast('Default sort updated.', 'success')
            }}
            options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>
        <div>
          <Label htmlFor="default-view">Default view</Label>
          <Select
            id="default-view"
            className="w-full"
            value={view}
            onChange={(e) => {
              const next = e.target.value as 'grid' | 'list'
              setView(next)
              storage.set('view-mode', next)
              toast('Default view updated.', 'success')
            }}
            options={[
              { value: 'grid', label: 'Grid' },
              { value: 'list', label: 'List' },
            ]}
          />
        </div>
      </div>
    </SectionCard>
  )
}

function DataSection() {
  const { toast } = useToast()
  const { openImport } = useUI()
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const prompts = await fetchAllForExport()
      exportPromptsToFile(prompts)
      toast(`Exported ${prompts.length} prompts to JSON.`, 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Export failed. Please try again.', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <SectionCard
      title="Your data"
      description="Export your full library (except trashed prompts) or import from a previous export."
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" onClick={() => void handleExport()} loading={exporting}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Export library (JSON)
        </Button>
        <Button variant="secondary" onClick={openImport}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          Import prompts…
        </Button>
      </div>
      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Exports contain titles, descriptions, content, notes, favorite state, and tags — everything
        you need to move libraries or back up your work.
      </p>
    </SectionCard>
  )
}

function DangerSection() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const client = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [working, setWorking] = useState(false)

  const handleDelete = async () => {
    setWorking(true)
    try {
      await deleteAllUserData()
      client.clear()
      await supabase.auth.signOut()
      toast('All library data deleted. You have been signed out.', 'info')
      navigate('/login')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Deletion failed. Please try again.', 'error')
    } finally {
      setWorking(false)
      setConfirmOpen(false)
    }
  }

  return (
    <SectionCard
      title="Delete account"
      description="Permanently removes every prompt and tag you own, then signs you out."
    >
      <div className="rounded-md border border-danger/25 bg-danger/5 p-4">
        <p className="text-[13px] leading-relaxed text-foreground/90">
          This deletes your entire Prompt Stash library from the database. It cannot be undone.
          Consider exporting your data first.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Note: for safety, Supabase does not let a signed-in client remove its own auth record —
          your library data is erased immediately, and the remaining account record can be removed
          by an administrator from the Supabase dashboard.
        </p>
        <Button variant="danger" className="mt-4" onClick={() => setConfirmOpen(true)}>
          Delete account…
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete account and all data?"
        description="Every prompt, tag, and favorite you own will be permanently erased from the database."
        confirmLabel="Erase everything"
        destructive
        requirePhrase="DELETE MY ACCOUNT"
        loading={working}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </SectionCard>
  )
}
