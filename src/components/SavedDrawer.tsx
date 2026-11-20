import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { POPULAR_PALETTES } from '../data/palettes'
import { buildGradient } from '../lib/gradient'
import { useFavorites, useSavedGradients, useSavedPalettes, type SavedGradient } from '../lib/storage'
import { Icon } from './Icon'

type Tab = 'favoritos' | 'paletas' | 'degrades'

const montarHref = (colors: string[]) => `/montar?cores=${colors.map((c) => c.replace('#', '')).join('-')}`

function Strip({ colors }: { colors: string[] }) {
  return (
    <span className="flex h-12 w-full overflow-hidden rounded-[8px]">
      {colors.map((c, i) => (
        <span key={i} className="flex-1" style={{ background: c }} />
      ))}
    </span>
  )
}

function Row({
  name,
  preview,
  onOpen,
  onRemove,
  removeLabel,
}: {
  name: string
  preview: ReactNode
  onOpen: () => void
  onRemove: () => void
  removeLabel: string
}) {
  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onOpen}
        className="w-full rounded-[12px] p-2 text-left transition hover:bg-black/5"
      >
        {preview}
        <span className="mt-1.5 block truncate pr-8 font-mono text-[15px] font-medium">{name}</span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        title={removeLabel}
        className="absolute right-2 bottom-2 grid size-7 place-items-center rounded-full text-icon opacity-50 transition group-hover:opacity-100 hover:bg-black/10"
      >
        <Icon name="close" />
      </button>
    </li>
  )
}

/** Painel lateral com favoritos, paletas e degradês salvos. */
export function SavedDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('favoritos')
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)
  const { favorites, toggle } = useFavorites()
  const { palettes, remove: removePalette } = useSavedPalettes()
  const { gradients, remove: removeGradient } = useSavedGradients()
  const favPalettes = POPULAR_PALETTES.filter((p) => favorites.includes(p.id))

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const go = (to: string, state?: unknown) => {
    navigate(to, { state })
    onClose()
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'favoritos', label: 'Favoritos', count: favPalettes.length },
    { id: 'paletas', label: 'Paletas', count: palettes.length },
    { id: 'degrades', label: 'Degradês', count: gradients.length },
  ]

  const empty = (text: string) => <p className="px-2 py-10 text-center text-sm text-black/50">{text}</p>

  return (
    <div className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`} inert={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/25 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Salvos"
        tabIndex={-1}
        className={`absolute top-0 right-0 flex h-full w-full max-w-[380px] flex-col bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.15)] outline-none transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-7 pb-4">
          <h2 className="flex items-center gap-2 font-heading text-[24px] font-bold tracking-[0.08em]">
            <Icon name="heart" className="text-[#A62222]" /> Salvos
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-9 place-items-center rounded-full text-icon transition hover:bg-black/5"
          >
            <Icon name="close" />
          </button>
        </div>

        <div role="tablist" className="mx-6 flex rounded-[10px] bg-segment p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-[8px] py-1.5 text-sm transition ${
                tab === t.id ? 'bg-white shadow-[0_2px_3px_rgba(0,0,0,0.2)]' : 'opacity-70 hover:opacity-100'
              }`}
            >
              {t.label} <span className="text-black/45">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex-1 overflow-y-auto px-4 pb-8">
          {tab === 'favoritos' &&
            (favPalettes.length ? (
              <ul className="space-y-1">
                {favPalettes.map((p) => (
                  <Row
                    key={p.id}
                    name={p.name}
                    preview={<Strip colors={p.colors} />}
                    onOpen={() => go(montarHref(p.colors))}
                    onRemove={() => toggle(p.id)}
                    removeLabel={`Desfavoritar ${p.name}`}
                  />
                ))}
              </ul>
            ) : (
              empty('Toque no ♡ das paletas em Explorar para guardar aqui.')
            ))}

          {tab === 'paletas' &&
            (palettes.length ? (
              <ul className="space-y-1">
                {palettes.map((p) => (
                  <Row
                    key={p.id}
                    name={p.name}
                    preview={<Strip colors={p.colors} />}
                    onOpen={() => go(montarHref(p.colors))}
                    onRemove={() => removePalette(p.id)}
                    removeLabel={`Excluir ${p.name}`}
                  />
                ))}
              </ul>
            ) : (
              empty('Use "Salvar paleta" no Montar para guardar suas paletas.')
            ))}

          {tab === 'degrades' &&
            (gradients.length ? (
              <ul className="space-y-1">
                {gradients.map((g: SavedGradient) => (
                  <Row
                    key={g.id}
                    name={g.name}
                    preview={
                      <span
                        className="block h-12 w-full rounded-[8px]"
                        style={{ background: buildGradient({ ...g, stops: g.stops.map((s, i) => ({ ...s, id: String(i) })) }) }}
                      />
                    }
                    onOpen={() => go('/degrade', { gradient: g })}
                    onRemove={() => removeGradient(g.id)}
                    removeLabel={`Excluir ${g.name}`}
                  />
                ))}
              </ul>
            ) : (
              empty('Use "Salvar degradê" no Degradê para guardar aqui.')
            ))}
        </div>
      </div>
    </div>
  )
}
