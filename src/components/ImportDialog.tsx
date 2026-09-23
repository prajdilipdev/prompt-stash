import { useRef, useState } from 'react'
import { AlertTriangle, FileJson, Upload } from 'lucide-react'
import { Dialog, DialogFooter, DialogHeader } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { parseImportFile, type ImportedPrompt } from '@/lib/importExport'
import { importPrompts } from '@/services/importService'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/Toast'

type Stage = 'select' | 'preview' | 'importing' | 'done'

interface Preview {
  prompts: ImportedPrompt[]
  errors: string[]
}

/**
 * Import flow: Select file → Validate → Preview → Confirm → Import → Report.
 * Imported ids/timestamps are never trusted; every row is validated with Zod
 * and inserted fresh for the signed-in user.
 */
export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>('select')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [result, setResult] = useState<{ imported: number; failed: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const client = useQueryClient()
  const { toast } = useToast()

  const reset = () => {
    setStage('select')
    setPreview(null)
    setFileName('')
    setFileError(null)
    setResult(null)
  }

  const close = () => {
    reset()
    onClose()
  }

  const handleFile = async (file: File) => {
    setFileError(null)
    if (!file.name.toLowerCase().endsWith('.json')) {
      setFileError('Please choose a .json file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File is too large (max 10 MB).')
      return
    }
    const text = await file.text()
    const parsed = parseImportFile(text)
    setFileName(file.name)
    setPreview(parsed)
    setStage('preview')
  }

  const runImport = async () => {
    if (!preview) return
    setStage('importing')
    try {
      const report = await importPrompts(preview.prompts)
      setResult({ imported: report.imported, failed: report.failed })
      setStage('done')
      client.invalidateQueries({ queryKey: ['prompts'] })
      client.invalidateQueries({ queryKey: ['tags'] })
      toast(
        report.failed === 0
          ? `${report.imported} prompt${report.imported === 1 ? '' : 's'} imported.`
          : `Imported ${report.imported}, ${report.failed} failed.`,
        report.failed === 0 ? 'success' : 'info',
      )
    } catch {
      setStage('preview')
      toast('Import failed. Nothing was changed.', 'error')
    }
  }

  return (
    <Dialog open={open} onClose={close} labelledBy="import-title" size="lg">
      <DialogHeader
        id="import-title"
        title="Import prompts"
        description="Import from a Prompt Stash JSON export. Imported data is validated; ids and timestamps from the file are ignored."
      />

      <div className="px-6 py-5">
        {stage === 'select' && (
          <div>
            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              aria-label="Choose JSON file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleFile(file)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-12 transition-colors hover:border-primary/50 hover:bg-surface-hover"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <FileJson className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium">Choose a JSON file to import</span>
              <span className="text-xs text-muted-foreground">
                Prompt Stash exports, arrays of prompts, or a single prompt object
              </span>
            </button>
            {fileError && (
              <p role="alert" className="mt-3 flex items-center gap-1.5 text-[13px] text-danger">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                {fileError}
              </p>
            )}
          </div>
        )}

        {stage === 'preview' && preview && (
          <div>
            <div className="mb-4 flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
              <span className="truncate text-[13px] font-medium">{fileName}</span>
              <button
                type="button"
                onClick={reset}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                Choose another file
              </button>
            </div>

            {preview.prompts.length === 0 ? (
              <p className="rounded-md border border-danger/25 bg-danger/5 px-3 py-3 text-[13px] text-danger">
                No valid prompts found in this file.
              </p>
            ) : (
              <p className="text-sm text-foreground">
                <strong>{preview.prompts.length}</strong> prompt
                {preview.prompts.length === 1 ? '' : 's'} ready to import.
              </p>
            )}

            {preview.errors.length > 0 && (
              <div className="mt-3 rounded-md border border-warning/25 bg-warning/5 px-3 py-2.5">
                <p className="text-[13px] font-medium text-warning">
                  {preview.errors.length} item{preview.errors.length === 1 ? '' : 's'} will be skipped:
                </p>
                <ul className="mt-1.5 max-h-28 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {preview.errors.slice(0, 12).map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                  {preview.errors.length > 12 && <li>…and {preview.errors.length - 12} more</li>}
                </ul>
              </div>
            )}

            {preview.prompts.length > 0 && (
              <ul className="mt-4 max-h-52 divide-y divide-border overflow-y-auto rounded-md border border-border">
                {preview.prompts.slice(0, 50).map((p, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                    <span className="truncate font-medium">{p.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {p.tags.length > 0 ? p.tags.slice(0, 3).join(', ') : 'no tags'}
                    </span>
                  </li>
                ))}
                {preview.prompts.length > 50 && (
                  <li className="px-3 py-2 text-xs text-muted-foreground">
                    …and {preview.prompts.length - 50} more
                  </li>
                )}
              </ul>
            )}
          </div>
        )}

        {stage === 'importing' && (
          <div className="flex flex-col items-center py-10 text-muted-foreground">
            <Upload className="mb-3 h-6 w-6 animate-pulse" aria-hidden="true" />
            <p className="text-sm">Importing prompts…</p>
          </div>
        )}

        {stage === 'done' && result && (
          <div className="rounded-md border border-border bg-surface px-4 py-5 text-center">
            <p className="text-h3">Import complete</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {result.imported} prompt{result.imported === 1 ? '' : 's'} imported
              {result.failed > 0 && `, ${result.failed} failed`}
              .
            </p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="secondary" onClick={close}>
          {stage === 'done' ? 'Close' : 'Cancel'}
        </Button>
        {stage === 'preview' && preview && preview.prompts.length > 0 && (
          <Button onClick={runImport}>
            Import {preview.prompts.length} prompt{preview.prompts.length === 1 ? '' : 's'}
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  )
}
