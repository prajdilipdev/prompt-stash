import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { isSupabaseConfigured } from '@/lib/supabase'
import { ThemeProvider } from '@/hooks/useTheme'
import { ToastProvider } from '@/components/Toast'
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { ConfigGate } from '@/features/auth/ConfigGate'
import { UIProvider } from '@/components/UIContext'
import { AppShell } from '@/components/AppShell'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { LibraryPage } from '@/features/prompts/LibraryPage'
import { PromptDetailPage } from '@/features/prompts/PromptDetailPage'
import { PromptEditorPage } from '@/features/prompts/PromptEditorPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { AboutPage } from '@/features/about/AboutPage'
import { Button } from '@/components/ui/Button'

function RootRedirect() {
  const { user, initializing } = useAuth()
  if (initializing) return null
  return <Navigate to={user ? '/app/prompts' : '/login'} replace />
}

function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="text-label uppercase tracking-widest text-muted-foreground">404</p>
      <h1 className="text-h1">This page wandered off.</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you are looking for does not exist. Your prompts, however, are safe.
      </p>
      <Button onClick={() => (window.location.href = '/')}>Back to Prompt Stash</Button>
    </div>
  )
}

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <ThemeProvider>
        <ToastProvider>
          <ConfigGate />
        </ToastProvider>
      </ThemeProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                <Route
                  path="/app"
                  element={
                    <RequireAuth>
                      <UIProvider>
                        <AppShell />
                      </UIProvider>
                    </RequireAuth>
                  }
                >
                  <Route index element={<Navigate to="/app/prompts" replace />} />
                  <Route path="prompts" element={<LibraryPage view="all" />} />
                  <Route path="prompts/new" element={<Navigate to="/app/prompts?new=1" replace />} />
                  <Route path="prompts/:id" element={<PromptDetailPage />} />
                  <Route path="prompts/:id/edit" element={<PromptEditorPage />} />
                  <Route path="favorites" element={<LibraryPage view="favorites" />} />
                  <Route path="recent" element={<LibraryPage view="recent" />} />
                  <Route path="archived" element={<LibraryPage view="archived" />} />
                  <Route path="trash" element={<LibraryPage view="trash" />} />
                  <Route path="tags/:tagId" element={<LibraryPage view="tag" />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="about" element={<AboutPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
