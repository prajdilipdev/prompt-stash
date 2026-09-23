import { useCallback, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Inbox, Layers, Menu, Plus, Search, Star } from 'lucide-react'
import { SidebarContent } from '@/components/Sidebar'
import { CommandPalette } from '@/components/CommandPalette'
import { ImportDialog } from '@/components/ImportDialog'
import { TagManagerDialog } from '@/components/TagManagerDialog'
import { Logo } from '@/components/Logo'
import { IconButton, Button } from '@/components/ui/Button'
import { useUI } from '@/components/UIContext'
import { useHotkey } from '@/hooks/useHotkeys'
import { storage, cn } from '@/lib/utils'

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

/**
 * Application shell: sidebar (fixed on desktop, drawer on mobile) + main
 * content, plus global overlays: command palette, import, tag manager.
 * Also registers the app-wide keyboard shortcuts.
 */
export function AppShell() {
  const navigate = useNavigate()
  const {
    paletteOpen,
    openPalette,
    closePalette,
    importOpen,
    closeImport,
    tagManagerOpen,
    closeTagManager,
    mobileNavOpen,
    setMobileNavOpen,
  } = useUI()

  const [collapsed, setCollapsed] = useState(() => storage.get(SIDEBAR_COLLAPSED_KEY, false))

  const toggleCollapsed = useCallback(() => {
    setCollapsed((v) => {
      storage.set(SIDEBAR_COLLAPSED_KEY, !v)
      return !v
    })
  }, [])

  // Global shortcuts
  useHotkey('k', openPalette, { mod: true, ignoreInputs: false })
  useHotkey('n', () => navigate('/app/prompts/new'), { mod: true })

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden shrink-0 border-r border-border transition-[width] duration-200 lg:block',
          collapsed ? 'w-0 overflow-hidden border-r-0' : 'w-[var(--sidebar-width)]',
        )}
      >
        <SidebarContent onCollapse={toggleCollapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px] animate-fade-in"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-[min(86vw,320px)] border-r border-border shadow-overlay animate-slide-in-left">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface/95 backdrop-blur-md px-3.5 py-2 lg:hidden">
          <div className="flex items-center gap-2">
            <IconButton label="Open navigation" onClick={() => setMobileNavOpen(true)}>
              <Menu className="h-5 w-5" aria-hidden="true" />
            </IconButton>
            <Logo size={24} />
          </div>
          <div className="flex items-center gap-1">
            <IconButton label="Search prompts" onClick={openPalette}>
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </IconButton>
            <Button size="sm" onClick={() => navigate('/app/prompts/new')}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New
            </Button>
          </div>
        </header>

        {/* Desktop collapse rail */}
        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            className="fixed bottom-4 left-0 z-40 hidden h-10 w-5 items-center justify-center rounded-r-md border border-l-0 border-border bg-surface text-muted-foreground transition-colors hover:text-foreground lg:flex"
          >
            <svg viewBox="0 0 8 14" className="h-3 w-3" fill="none" aria-hidden="true">
              <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        )}

        <main id="main-content" className="min-h-0 flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom navigation bar */}
        <nav
          aria-label="Mobile Navigation"
          className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t border-border bg-surface/95 backdrop-blur-lg px-2 lg:hidden"
        >
          <NavLink
            to="/app/prompts"
            end
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            <Inbox className="h-5 w-5" aria-hidden="true" />
            <span>Library</span>
          </NavLink>

          <NavLink
            to="/app/favorites"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            <Star className="h-5 w-5" aria-hidden="true" />
            <span>Favorites</span>
          </NavLink>

          <button
            type="button"
            onClick={() => navigate('/app/prompts/new')}
            className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pop transition-transform active:scale-95"
            aria-label="Create new prompt"
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={openPalette}
            className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Search prompts"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
            <span>Search</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Open menu and tags"
          >
            <Layers className="h-5 w-5" aria-hidden="true" />
            <span>Menu</span>
          </button>
        </nav>
      </div>

      {/* Global overlays */}
      <CommandPalette open={paletteOpen} onClose={closePalette} />
      <ImportDialog open={importOpen} onClose={closeImport} />
      <TagManagerDialog open={tagManagerOpen} onClose={closeTagManager} />
    </div>
  )
}
