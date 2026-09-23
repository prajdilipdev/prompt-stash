import { useState } from 'react'
import { Dialog, DialogFooter, DialogHeader } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Field'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  /** When set, the user must type this exact phrase to enable the confirm button. */
  requirePhrase?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmation dialog for destructive or irreversible actions.
 * Supports an optional type-to-confirm phrase for the strongest cases.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  requirePhrase,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [phrase, setPhrase] = useState('')
  const phraseOk = !requirePhrase || phrase === requirePhrase

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      labelledBy="confirm-dialog-title"
      size="sm"
      className="overflow-visible"
    >
      <DialogHeader id="confirm-dialog-title" title={title} description={description} />
      <div className="px-6 py-4">
        {requirePhrase && (
          <div>
            <Label htmlFor="confirm-phrase" required>
              Type <span className="font-mono font-semibold">{requirePhrase}</span> to confirm
            </Label>
            <Input
              id="confirm-phrase"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder={requirePhrase}
            />
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? 'danger' : 'primary'}
          onClick={onConfirm}
          disabled={!phraseOk}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
