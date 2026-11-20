import { useEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  open: boolean
  title: string
  defaultName: string
  preview?: ReactNode
  onSave: (name: string) => void
  onClose: () => void
}

/** Diálogo para dar nome ao salvar uma paleta ou degradê. */
export function NameDialog({ open, title, defaultName, preview, onSave, onClose }: Props) {
  if (!open) return null
  // remonta a cada abertura, já com o nome sugerido
  return <DialogBody title={title} defaultName={defaultName} preview={preview} onSave={onSave} onClose={onClose} />
}

function DialogBody({ title, defaultName, preview, onSave, onClose }: Omit<Props, 'open'>) {
  const [name, setName] = useState(defaultName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = () => {
    onSave(name.trim() || defaultName)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-on-light/40" onClick={onClose} />
      <form
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="relative w-full max-w-[400px] rounded-[20px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
      >
        <h2 className="font-heading text-[20px] font-bold tracking-[0.06em]">{title}</h2>
        {preview && <div className="mt-4">{preview}</div>}
        <label className="mt-4 block">
          <span className="text-sm opacity-60">Nome</span>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            className="mt-1 h-[46px] w-full rounded-[10px] border border-black/20 px-[15px] outline-none focus:border-black/50"
          />
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-[43px] rounded-[10px] px-5 text-[15px] transition hover:bg-black/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="h-[43px] rounded-[10px] border border-brick bg-brick-strong px-6 text-[15px] font-medium shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:brightness-105"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  )
}
