import { useEffect, useRef, useState, type ReactNode } from 'react'

export type MenuItem = { label: string; hint?: string; onSelect: () => void } | 'separator'

/** Botão com menu suspenso (fecha com clique fora ou Esc). */
export function Menu({
  label,
  items,
  className = '',
  align = 'left',
}: {
  label: ReactNode
  items: MenuItem[]
  className?: string
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={className}
      >
        {label}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-30 mt-2 min-w-[210px] rounded-[12px] border border-black/15 bg-white py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.18)] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item, i) =>
            item === 'separator' ? (
              <div key={i} className="my-1.5 h-px bg-black/10" />
            ) : (
              <button
                key={i}
                type="button"
                role="menuitem"
                onClick={() => {
                  item.onSelect()
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between gap-4 px-4 py-2 text-left text-[15px] transition hover:bg-black/5"
              >
                {item.label}
                {item.hint && <span className="text-xs text-black/40">{item.hint}</span>}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
