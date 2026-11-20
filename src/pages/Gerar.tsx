import { useCallback, useEffect, useState, type DragEvent, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { NameDialog } from '../components/NameDialog'
import { useCopy, useToast } from '../components/toast-context'
import { colorName, generatePalette, prefersDarkText, type HarmonyMode } from '../lib/color'
import { montarPath } from '../lib/share'
import { useSavedPalettes } from '../lib/storage'

const MODES: { id: HarmonyMode; label: string }[] = [
  { id: 'harmonia', label: 'Harmonia' },
  { id: 'aleatoria', label: 'Aleatória' },
  { id: 'analoga', label: 'Análoga' },
  { id: 'complementar', label: 'Complementar' },
  { id: 'monocromatica', label: 'Monocromática' },
  { id: 'triade', label: 'Tríade' },
]

const INITIAL = ['#274754', '#2A9D90', '#E8C468', '#F4A462', '#E76E50']
const MAX_HISTORY = 50

/** Um passo do histórico: as cores e quais estão travadas (as travas acompanham a reordenação). */
type Entry = { colors: string[]; locked: boolean[] }

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || !!el.closest('input, textarea, select, [role=dialog]'))

/** Tira o foco do botão após clique com mouse, para o Espaço seguinte gerar em vez de "clicar" de novo. */
const blurOnClick = (e: MouseEvent<HTMLElement>) => {
  if (e.detail > 0) e.currentTarget.blur()
}

export default function Gerar() {
  const [mode, setMode] = useState<HarmonyMode>('analoga')
  const [history, setHistory] = useState<{ entries: Entry[]; index: number }>({
    entries: [{ colors: INITIAL, locked: INITIAL.map(() => false) }],
    index: 0,
  })
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const copy = useCopy()
  const toast = useToast()
  const { save, nextName } = useSavedPalettes()

  const { colors, locked } = history.entries[history.index]
  const canUndo = history.index > 0
  const canRedo = history.index < history.entries.length - 1

  /** Adiciona um passo novo (descarta o "refazer" que existia à frente). */
  const push = useCallback(
    (make: (current: Entry) => Entry) =>
      setHistory(({ entries, index }) => {
        const next = make(entries[index])
        const kept = entries.slice(Math.max(0, index + 1 - MAX_HISTORY + 1), index + 1)
        return { entries: [...kept, next], index: kept.length }
      }),
    [],
  )

  const regenerate = useCallback(
    (nextMode: HarmonyMode = mode) =>
      push((cur) => ({ colors: generatePalette(nextMode, cur.colors, cur.locked), locked: cur.locked })),
    [mode, push],
  )

  const undo = useCallback(() => setHistory((h) => ({ ...h, index: Math.max(0, h.index - 1) })), [])
  const redo = useCallback(
    () => setHistory((h) => ({ ...h, index: Math.min(h.entries.length - 1, h.index + 1) })),
    [],
  )

  /** Travar não cria passo no histórico: só altera o passo atual. */
  const toggleLock = (i: number) =>
    setHistory(({ entries, index }) => ({
      index,
      entries: entries.map((e, k) => (k === index ? { ...e, locked: e.locked.map((v, j) => (j === i ? !v : v)) } : e)),
    }))

  const move = (from: number, to: number) => {
    if (from === to) return
    push(({ colors: c, locked: l }) => {
      const order = c.map((_, i) => i)
      order.splice(to, 0, order.splice(from, 1)[0])
      return { colors: order.map((i) => c[i]), locked: order.map((i) => l[i]) }
    })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || saving) return
      const mod = e.ctrlKey || e.metaKey
      const onButton = (e.target as HTMLElement).closest('button, a')
      if (e.code === 'Space' && !onButton) {
        e.preventDefault()
        regenerate()
      } else if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      } else if (!mod && !e.altKey && e.key === 'ArrowLeft') {
        undo()
      } else if (!mod && !e.altKey && e.key === 'ArrowRight') {
        redo()
      } else if (!mod && !e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        setSaving(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [regenerate, undo, redo, saving])

  const chooseMode = (m: HarmonyMode) => {
    setMode(m)
    regenerate(m)
  }

  // --- arrastar colunas ---
  const onDragStart = (e: DragEvent, i: number) => {
    setDragFrom(i)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', colors[i])
  }
  const onDragEnd = () => {
    setDragFrom(null)
    setDragOver(null)
  }

  const toolBtn =
    'grid h-[47px] w-[47px] place-items-center rounded-[14px] border border-brick bg-white text-[20px] shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:bg-brick-soft/50 disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none'

  return (
    <main className="flex min-h-[calc(100vh-97px)] flex-col">
      <div className="flex flex-wrap items-center gap-[14px] px-4 py-[46px] sm:px-[53px]">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={(e) => {
              chooseMode(m.id)
              blurOnClick(e)
            }}
            aria-pressed={mode === m.id}
            className={`h-[47px] w-[128px] rounded-[20px] border border-brick text-base shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:bg-brick-soft/50 ${
              mode === m.id ? 'bg-brick-soft' : 'bg-white'
            }`}
          >
            {m.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-[10px]">
          <button
            type="button"
            onClick={(e) => {
              undo()
              blurOnClick(e)
            }}
            disabled={!canUndo}
            aria-label="Desfazer"
            title="Desfazer (Ctrl+Z ou ←)"
            className={toolBtn}
          >
            ↶
          </button>
          <button
            type="button"
            onClick={(e) => {
              redo()
              blurOnClick(e)
            }}
            disabled={!canRedo}
            aria-label="Refazer"
            title="Refazer (Ctrl+Shift+Z ou →)"
            className={toolBtn}
          >
            ↷
          </button>
          <button
            type="button"
            onClick={(e) => {
              setSaving(true)
              blurOnClick(e)
            }}
            title="Salvar paleta (S)"
            className="flex h-[47px] items-center gap-2 rounded-[14px] border border-brick bg-brick-strong px-5 text-base shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:brightness-105"
          >
            <Icon name="heart" /> Salvar
          </button>
          <Link
            to={montarPath(colors)}
            className="flex h-[47px] items-center rounded-[14px] border border-brick bg-white px-5 text-base shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:bg-brick-soft/50"
          >
            Editar no Montar →
          </Link>
        </div>
      </div>

      <div className="relative flex min-h-[560px] flex-1 flex-col sm:flex-row">
        <button
          type="button"
          onClick={(e) => {
            regenerate()
            blurOnClick(e)
          }}
          className="absolute top-[19px] left-1/2 z-10 flex h-[56px] -translate-x-1/2 items-center gap-2 rounded-[20px] border border-brick bg-[rgba(252,252,252,0.5)] px-[28px] text-base whitespace-nowrap shadow-[0_4px_4px_rgba(0,0,0,0.25)] backdrop-blur-sm"
        >
          Aperte
          <kbd className="rounded-[20px] border border-brick px-[30px] py-[2px] font-ui shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
            Espaço
          </kbd>
          para gerar
        </button>

        {colors.map((hex, i) => {
          const dark = prefersDarkText(hex)
          const fg = dark ? 'text-black' : 'text-white'
          const sub = dark ? 'text-[#2b2b2b]' : 'text-[#cfcfcf]'
          const btn = `grid h-[38px] w-[42px] place-items-center rounded-[10px] border transition ${
            dark ? 'border-black/20 hover:bg-black/10' : 'border-white/20 hover:bg-white/10'
          }`
          const isTarget = dragOver === i && dragFrom !== null && dragFrom !== i
          return (
            <section
              key={i}
              draggable
              onDragStart={(e) => onDragStart(e, i)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(i)
              }}
              onDrop={(e) => {
                e.preventDefault()
                if (dragFrom !== null) move(dragFrom, i)
                onDragEnd()
              }}
              aria-label={`Cor ${i + 1}: ${hex}`}
              className={`group/col relative flex flex-1 cursor-grab flex-col items-center justify-end gap-3 pt-24 pb-11 transition-[background-color,opacity] duration-300 active:cursor-grabbing ${fg} ${
                dragFrom === i ? 'opacity-40' : ''
              }`}
              style={{ background: hex }}
            >
              {isTarget && (
                <span
                  aria-hidden
                  className={`pointer-events-none absolute inset-y-0 w-1 ${dragFrom! < i ? 'right-0' : 'left-0'} ${
                    dark ? 'bg-black/60' : 'bg-white/80'
                  }`}
                />
              )}
              <span
                aria-hidden
                className="absolute top-[96px] text-[22px] leading-none tracking-[-0.1em] opacity-0 transition-opacity group-hover/col:opacity-50"
                title="Arraste para reordenar"
              >
                ⋮⋮
              </span>
              <div className="flex gap-[13px]">
                <button
                  type="button"
                  className={`${btn} ${locked[i] ? (dark ? 'bg-black/15' : 'bg-white/20') : ''}`}
                  onClick={(e) => {
                    toggleLock(i)
                    blurOnClick(e)
                  }}
                  aria-pressed={locked[i]}
                  aria-label={locked[i] ? `Destravar ${hex}` : `Travar ${hex}`}
                  title={locked[i] ? 'Travada' : 'Travar cor'}
                >
                  <Icon name="lock" className={locked[i] ? 'opacity-100' : 'opacity-60'} />
                </button>
                <button
                  type="button"
                  className={btn}
                  onClick={(e) => {
                    copy(hex)
                    blurOnClick(e)
                  }}
                  aria-label={`Copiar ${hex}`}
                >
                  <Icon name="copy" />
                </button>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  copy(hex)
                  blurOnClick(e)
                }}
                className="mt-2 font-body text-[28px] font-semibold tracking-[0.1em] lg:text-[36px]"
              >
                {hex}
              </button>
              <span className={`font-body text-base tracking-[0.1em] ${sub}`}>{colorName(hex)}</span>
            </section>
          )
        })}
      </div>

      <p className="px-4 py-3 text-center text-xs text-black/45 sm:px-[53px]">
        Espaço gera · ← → navegam no histórico · S salva · arraste as colunas para reordenar
      </p>

      <NameDialog
        open={saving}
        title="Salvar paleta"
        defaultName={nextName}
        preview={
          <span className="flex h-12 overflow-hidden rounded-[10px]">
            {colors.map((c, i) => (
              <span key={i} className="flex-1" style={{ background: c }} />
            ))}
          </span>
        }
        onSave={(name) => {
          save(colors, name)
          toast(`"${name}" salva`)
        }}
        onClose={() => setSaving(false)}
      />
    </main>
  )
}
