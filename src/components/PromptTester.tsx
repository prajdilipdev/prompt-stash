import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Pencil, RotateCcw, Variable } from 'lucide-react'
import type { Prompt } from '@/types'
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Field'
import { extractVariables, resolveVariables, variableLabel } from '@/lib/variables'
import { copyToClipboard } from '@/lib/clipboard'
import { useToast } from '@/components/Toast'

interface PromptTesterProps {
  prompt: Prompt | null
  onClose: () => void
}

/**
 * Prompt Tester — right-side slide-over drawer to fill in variable values
 * and preview the resolved prompt. Pure string substitution only.
 */
export function PromptTester({ prompt, onClose }: PromptTesterProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [values, setValues] = useState<Record<string, string>>({})

  const variables = useMemo(() => (prompt ? extractVariables(prompt.content) : []), [prompt])

  useEffect(() => {
    setValues({})
  }, [prompt?.id])

  if (!prompt) return null

  const resolved = resolveVariables(prompt.content, values)
  const allFilled = variables.every((v) => (values[v] ?? '').trim() !== '')

  const handleCopy = async () => {
    const ok = await copyToClipboard(resolved)
    toast(
      ok ? 'Resolved prompt copied to clipboard.' : 'Could not copy — clipboard unavailable.',
      ok ? 'success' : 'error',
    )
  }

  return (
    <Drawer open onClose={onClose} labelledBy="tester-title" size="2xl">
      <DrawerHeader
        id="tester-title"
        title={`Test: ${prompt.title}`}
        description="Fill in the variables to preview how this prompt will read. Substitution is local — nothing is sent to an AI service."
      />

      <DrawerBody className="space-y-6">
        {/* Variables */}
        <section aria-label="Variables">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-label uppercase tracking-wider text-muted-foreground">
              <Variable className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Variables ({variables.length})
            </h3>
            {variables.length > 0 && Object.keys(values).length > 0 && (
              <button
                type="button"
                onClick={() => setValues({})}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          {variables.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-3.5 py-4 text-[13px] text-muted-foreground">
              No {'{{variables}}'} detected in this prompt. Add some in the editor, e.g.{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">
                {'{{topic}}'}
              </code>
              .
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
              {variables.map((name) => (
                <div key={name} className="space-y-1.5">
                  <Label htmlFor={`var-${name}`}>
                    <code className="font-mono text-xs font-semibold text-primary">
                      {'{{'}
                      {name}
                      {'}}'}
                    </code>{' '}
                    <span className="text-muted-foreground">· {variableLabel(name)}</span>
                  </Label>
                  <Input
                    id={`var-${name}`}
                    value={values[name] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [name]: e.target.value }))}
                    placeholder={`Example value for ${variableLabel(name).toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Resolved preview */}
        <section aria-label="Resolved prompt" className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-label uppercase tracking-wider text-muted-foreground">
              Resolved prompt
            </h3>
            <span className="text-xs text-muted-foreground">
              {allFilled || variables.length === 0 ? (
                <span className="font-medium text-success">Ready</span>
              ) : (
                <span>Unfilled placeholders visible</span>
              )}
            </span>
          </div>
          <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-input p-4 font-mono text-[12.5px] leading-relaxed text-foreground selection:bg-primary/20">
            {resolved}
          </pre>
          {!allFilled && variables.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Unfilled variables keep their {'{{placeholder}}'} so you can spot gaps.
            </p>
          )}
        </section>
      </DrawerBody>

      <DrawerFooter>
        <Button variant="ghost" onClick={() => setValues({})} disabled={variables.length === 0}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            onClose()
            navigate(`/app/prompts/${prompt.id}/edit`)
          }}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit
        </Button>
        <Button variant="secondary" onClick={handleCopy}>
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy Result
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DrawerFooter>
    </Drawer>
  )
}
