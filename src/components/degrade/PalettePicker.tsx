import { useEffect, useRef, useState } from 'react'
import { POPULAR_PALETTES } from '../../data/palettes'
import { useSavedPalettes } from '../../lib/storage'

type Item = { id: string; name: string; colors: string[] }

function Section({ title, items, onPick }: { title: string; items: Item[]; onPick: (colors: string[]) => void }) {
  return (
    <div>
      <p className="px-3 pt-3 pb-1 text-xs font-medium tracking-[0.05em] text-black/50 uppercase">{title}</p>
      {items.map((p) => (
        <button
          key={p.id}
          type="button"
          role="menuitem"
          onClick={() => onPick(p.colors)}
          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-black/5"
        >
          <span className="flex h-5 w-16 shrink-0 overflow-hidden rounded-[5px]">
            {p.colors.map((c, i) => (
              <span key={i} className="flex-1" style={{ background: c }} />
            ))}
          </span>
          <span className="truncate">{p.name}</span>
        </button>
      ))}
    </div>
  )
}

/** Botão "Usar paleta" com lista das paletas salvas e populares. */
export function PalettePicker({ onPick }: { onPick: (colors: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { palettes: saved } = useSavedPalettes()

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

  const pick = (colors: string[]) => {
    onPick(colors)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-[49px] rounded-[10px] border border-black px-5 text-base shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:bg-black/5"
      >
        Usar paleta ▾
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 max-h-[360px] w-[260px] overflow-y-auto rounded-[12px] border border-black/15 bg-white pb-2 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
        >
          {saved.length > 0 && <Section title="Minhas paletas" items={saved} onPick={pick} />}
          <Section title="Populares" items={POPULAR_PALETTES} onPick={pick} />
        </div>
      )}
    </div>
  )
}
