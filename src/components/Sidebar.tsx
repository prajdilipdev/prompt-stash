import { NavLink, useNavigate } from 'react-router-dom'
import {
  Archive,
  ArchiveRestore,
  Clock,
  Inbox,
  Info,
  LogOut,
  Plus,
  Settings,
  SlidersHorizontal,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button, IconButton } from '@/components/ui/Button'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { TagBadge } from '@/components/TagBadge'
import { useTagsWithCounts } from '@/hooks/useTags'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useUI } from './UIContext'
import { useToast } from './Toast'
import { ThemeSwitcher } from './ThemeSwitcher'

const navItemClasses = ({ isActive }: { isActive: boolean }) =>
  cn(
    'group relative flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13.5px] font-medium transition-colors duration-150',
    isActive
      ? 'bg-primary-soft text-primary'
      : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
  )

function NavCount({ value }: { value?: number }) {
  if (value === undefined) return null
  return (
    <span className="ml-auto rounded-[5px] bg-muted px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums text-muted-foreground group-hover:bg-surface-hover">
      {value > 999 ? '1k+' : value}
    </span>
  )
}

export function SidebarContent({ onCollapse }: { onCollapse?: () => void }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const { openTagManager, setMobileNavOpen, openCreatePrompt } = useUI()
  const { data: tagData } = useTagsWithCounts()

  const tags = tagData?.tags ?? []
  const totalPrompts = tagData?.totalActivePrompts

  const closeMobile = () => setMobileNavOpen(false)
  const go = (to: string) => {
    navigate(to)
    closeMobile()
  }

  const email = user?.email ?? ''

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Brand */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <button
          type="button"
          onClick={() => go('/app/prompts')}
          className="rounded-md"
          aria-label="Prompt Stash home"
        >
          <Logo size={26} />
        </button>
        {onCollapse && (
          <IconButton label="Collapse sidebar" size="sm" className="hidden lg:inline-flex" onClick={onCollapse}>
            <svg viewBox="0 0 8 14" className="h-3 w-3" fill="none" aria-hidden="true">
              <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </IconButton>
        )}
        <IconButton
          label="Close menu"
          size="sm"
          className="lg:hidden text-muted-foreground hover:text-foreground"
          onClick={closeMobile}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </div>

      {/* Primary action */}
      <div className="px-3 pb-2 pt-2">
        <Button
          className="w-full"
          onClick={() => {
            openCreatePrompt()
            closeMobile()
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Prompt
        </Button>
      </div>

      {/* Primary nav */}
      <nav aria-label="Primary" className="px-3 pt-2">
        <p className="px-2.5 pb-1.5 text-label uppercase text-muted-foreground">Library</p>
        <div className="space-y-0.5">
          <NavLink to="/app/prompts" end className={navItemClasses} onClick={closeMobile}>
            <Inbox className="h-4 w-4" aria-hidden="true" />
            All Prompts
            <NavCount value={totalPrompts} />
          </NavLink>
          <NavLink to="/app/favorites" className={navItemClasses} onClick={closeMobile}>
            <Star className="h-4 w-4" aria-hidden="true" />
            Favorites
          </NavLink>
          <NavLink to="/app/recent" className={navItemClasses} onClick={closeMobile}>
            <Clock className="h-4 w-4" aria-hidden="true" />
            Recent
          </NavLink>
          <NavLink to="/app/archived" className={navItemClasses} onClick={closeMobile}>
            <Archive className="h-4 w-4" aria-hidden="true" />
            Archived
          </NavLink>
          <NavLink to="/app/trash" className={navItemClasses} onClick={closeMobile}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Trash
          </NavLink>
        </div>
      </nav>

      {/* Tags */}
      <div className="mt-5 flex min-h-0 flex-1 flex-col px-3">
        <div className="flex items-center justify-between px-2.5 pb-1.5">
          <p className="text-label uppercase text-muted-foreground">Tags</p>
          <IconButton
            label="Manage tags"
            size="sm"
            onClick={() => {
              openTagManager()
              closeMobile()
            }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pb-2 pr-0.5">
          {tags.length === 0 ? (
            <p className="px-2.5 py-1 text-xs leading-relaxed text-muted-foreground">
              No tags yet. Add tags while creating a prompt.
            </p>
          ) : (
            tags.map((tag) => (
              <NavLink
                key={tag.id}
                to={`/app/tags/${encodeURIComponent(tag.id)}`}
                className={navItemClasses}
                onClick={closeMobile}
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary/60" aria-hidden="true" />
                <span className="truncate">{tag.name}</span>
                <NavCount value={tag.count} />
              </NavLink>
            ))
          )}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-border px-3 py-3">
        <ThemeSwitcher compact />
        <div className="mt-2 space-y-0.5">
          <NavLink to="/app/settings" className={navItemClasses} onClick={closeMobile}>
            <Settings className="h-4 w-4" aria-hidden="true" />
            Settings
          </NavLink>
          <NavLink to="/app/about" className={navItemClasses} onClick={closeMobile}>
            <Info className="h-4 w-4" aria-hidden="true" />
            About
          </NavLink>
        </div>

        {/* Account */}
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
          >
            {(email[0] ?? 'u').toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-tight">{email}</p>
            <p className="text-[11px] text-muted-foreground">Prompt Stash account</p>
          </div>
          <Menu
            side="right"
            align="end"
            width="w-48"
            trigger={
              <IconButton label="Account menu">
                <ArchiveRestore className="hidden" aria-hidden="true" />
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
                  <circle cx="3" cy="8" r="1.4" fill="currentColor" />
                  <circle cx="8" cy="8" r="1.4" fill="currentColor" />
                  <circle cx="13" cy="8" r="1.4" fill="currentColor" />
                </svg>
              </IconButton>
            }
          >
            <MenuItem
              icon={<Settings className="h-4 w-4" aria-hidden="true" />}
              onSelect={() => go('/app/settings')}
            >
              Settings
            </MenuItem>
            <MenuItem
              icon={<LogOut className="h-4 w-4" aria-hidden="true" />}
              onSelect={async () => {
                await supabase.auth.signOut()
                toast('Signed out.', 'info')
                navigate('/login')
              }}
            >
              Log out
            </MenuItem>
          </Menu>
        </div>
      </div>
    </div>
  )
}

/** Tag chip used inside the sidebar's tag row (kept for reuse in filters). */
export function SidebarTagChip({ name, count }: { name: string; count: number }) {
  return (
    <TagBadge name={`${name} (${count})`} />
  )
}
