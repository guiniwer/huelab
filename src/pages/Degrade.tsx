import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { GradientInPractice } from '../components/degrade/GradientInPractice'
import { OriginPicker } from '../components/degrade/OriginPicker'
import { PalettePicker } from '../components/degrade/PalettePicker'
import { Icon } from '../components/Icon'
import { useCopy, useToast } from '../components/toast-context'
import { GRADIENT_PRESETS, type GradientPreset } from '../data/palettes'
import { generatePalette, mixHex, normalizeHex, type ColorSpace } from '../lib/color'
import {
  buildGradient,
  renderPng,
  sortStops,
  toTailwind,
  type GradientConfig,
  type GradientStop,
  type GradientType,
  type Origin,
  type RadialShape,
} from '../lib/gradient'
import { useSavedGradients, type SavedGradient } from '../lib/storage'

const TYPES: { id: GradientType; label: string }[] = [
  { id: 'linear', label: 'Linear' },
  { id: 'radial', label: 'Radial' },
  { id: 'conico', label: 'Cônico' },
]

const SHAPES: { id: RadialShape; label: string }[] = [
  { id: 'circle', label: 'Círculo' },
  { id: 'ellipse', label: 'Elipse' },
]

/**
 * Espaço de cor da transição:
 * Clássico = sRGB (padrão do CSS, meio acinzentado) · Suave = OKLab (sem cinza, sem artefatos)
 * Vibrante = OKLCH (mais saturado; em pares extremos pode criar uma faixa mais dura)
 */
const INTERPS: { id: ColorSpace; label: string; hint: string }[] = [
  { id: 'srgb', label: 'Clássico', hint: 'mistura padrão do CSS' },
  { id: 'oklab', label: 'Suave', hint: 'sem o cinza no meio' },
  { id: 'oklch', label: 'Vibrante', hint: 'cores mais vivas no meio' },
]

type ExportFormat = 'css' | 'tailwind'
const CENTER: Origin = { x: 50, y: 50 }
const MAX_STOPS = 8

let nextId = 0
const withIds = (stops: Omit<GradientStop, 'id'>[]): GradientStop[] =>
  stops.map((s) => ({ ...s, id: `s${nextId++}` }))
const clampPct = (n: number) => Math.round(Math.min(100, Math.max(0, n)))
const evenly = (colors: string[]) =>
  withIds(colors.map((color, i) => ({ color, position: Math.round((i / (colors.length - 1)) * 100) })))

/** Cor do degradê numa posição (0–100), para a nova parada nascer com a cor do ponto clicado. */
function colorAt(stops: GradientStop[], pos: number): string {
  const sorted = sortStops(stops)
  if (pos <= sorted[0].position) return sorted[0].color
  const last = sorted[sorted.length - 1]
  if (pos >= last.position) return last.color
  const i = sorted.findIndex((s) => s.position >= pos)
  const a = sorted[i - 1]
  const b = sorted[i]
  return mixHex(a.color, b.color, (pos - a.position) / (b.position - a.position || 1))
}

/** Botões segmentados no estilo do Figma (Tipo, Formato, Transição). */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'lg',
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
  size?: 'lg' | 'sm'
}) {
  return (
    <div
      role="radiogroup"
      className={`mt-3 flex rounded-[10px] bg-segment p-1 shadow-[0_4px_4px_rgba(0,0,0,0.25)] ${
        size === 'lg' ? 'h-[47px]' : 'h-[40px]'
      }`}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-[8px] transition ${size === 'lg' ? 'text-base' : 'text-[15px]'} ${
            value === o.id ? 'bg-white shadow-[0_4px_4px_rgba(0,0,0,0.25)]' : 'hover:bg-white/40'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function Degrade({ initial }: { initial?: SavedGradient }) {
  const [type, setType] = useState<GradientType>(initial?.type ?? 'linear')
  const [angle, setAngle] = useState(initial?.angle ?? GRADIENT_PRESETS[0].angle)
  const [interp, setInterp] = useState<ColorSpace>(initial?.interp ?? 'oklab')
  const [shape, setShape] = useState<RadialShape>(initial?.shape ?? 'circle')
  const [origin, setOrigin] = useState<Origin>(initial?.origin ?? CENTER)
  const [stops, setStops] = useState(() => withIds(initial?.stops ?? GRADIENT_PRESETS[0].stops))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('css')
  const barRef = useRef<HTMLDivElement>(null)
  const copy = useCopy()
  const toast = useToast()
  const { gradients: saved, save, remove } = useSavedGradients()

  const config: GradientConfig = { type, angle, interp, shape, origin, stops }
  const gradient = useMemo(
    () => buildGradient({ type, angle, interp, shape, origin, stops }),
    [type, angle, interp, shape, origin, stops],
  )
  const trackGradient = buildGradient({ ...config, type: 'linear', angle: 90 })
  const code = format === 'css' ? `background: ${gradient};` : toTailwind(gradient)

  const updateStop = (id: string, patch: Partial<GradientStop>) =>
    setStops((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const insertStop = (position: number) => {
    if (stops.length >= MAX_STOPS) return
    const id = `s${nextId++}`
    setStops((list) => [...list, { id, color: colorAt(list, position), position }])
    setActiveId(id)
    // foca o marcador novo para já poder ajustar com as setas ou apagar com Delete
    requestAnimationFrame(() => barRef.current?.querySelector<HTMLElement>(`[data-stop="${id}"]`)?.focus())
  }

  /** "+ Adicionar": coloca a nova cor no meio do maior intervalo entre paradas. */
  const addStop = () => {
    const sorted = sortStops(stops)
    let best = { gap: -1, at: 50 }
    sorted.slice(1).forEach((s, i) => {
      const gap = s.position - sorted[i].position
      if (gap > best.gap) best = { gap, at: Math.round(sorted[i].position + gap / 2) }
    })
    insertStop(best.at)
  }

  const removeStop = (id: string) => setStops((list) => (list.length > 2 ? list.filter((s) => s.id !== id) : list))

  /** Espelha as posições: o que estava no começo vai para o fim. */
  const invert = () => setStops((list) => list.map((s) => ({ ...s, position: 100 - s.position })))

  // --- Arrastar paradas na barra ---
  const positionFromPointer = (clientX: number) => {
    const rect = barRef.current!.getBoundingClientRect()
    return clampPct(((clientX - rect.left) / rect.width) * 100)
  }

  const onHandleDown = (e: PointerEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setActiveId(id)
    setDragging(true)
  }

  const onHandleMove = (e: PointerEvent<HTMLButtonElement>, id: string) => {
    if (!dragging || activeId !== id) return
    updateStop(id, { position: positionFromPointer(e.clientX) })
  }

  const onHandleKey = (e: KeyboardEvent<HTMLButtonElement>, s: GradientStop) => {
    const step = e.shiftKey ? 10 : 1
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') updateStop(s.id, { position: clampPct(s.position - step) })
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') updateStop(s.id, { position: clampPct(s.position + step) })
    else if (e.key === 'Delete' || e.key === 'Backspace') removeStop(s.id)
    else return
    e.preventDefault()
  }

  const applyPreset = (p: GradientPreset) => {
    setType('linear')
    setAngle(p.angle)
    setStops(withIds(p.stops))
  }

  const applySaved = (g: SavedGradient) => {
    setType(g.type)
    setAngle(g.angle)
    setInterp(g.interp)
    setShape(g.shape)
    setOrigin(g.origin)
    setStops(withIds(g.stops))
  }

  /** Usa o gerador do modo Harmonia para sortear cores que combinam. */
  const randomize = () => {
    const count = 2 + Math.floor(Math.random() * 2)
    setAngle(Math.round(Math.random() * 8) * 45)
    setStops(evenly(generatePalette('harmonia', [], [], count)))
  }

  const applyPalette = (colors: string[]) => {
    setStops(evenly(colors.slice(0, MAX_STOPS)))
    toast(`${Math.min(colors.length, MAX_STOPS)} cores aplicadas`)
  }

  const downloadPng = async () => {
    try {
      const blob = await renderPng(config)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'huelab-degrade.png'
      a.click()
      URL.revokeObjectURL(url)
      toast('PNG baixado (1920×1080)')
    } catch {
      toast('Não foi possível gerar o PNG')
    }
  }

  const onSave = () => {
    save(config)
    toast('Degradê salvo em "Prontos para usar"')
  }

  const hasOrigin = type !== 'linear'
  const hasAngle = type !== 'radial'

  return (
    <main className="mx-auto flex max-w-[1440px] flex-col gap-12 px-4 pt-10 pb-20 sm:px-[53px] xl:flex-row xl:gap-[61px]">
      <div className="min-w-0 flex-1 xl:max-w-[802px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-[32px] font-bold tracking-[0.1em]">Degradê</h1>
            <p className="font-body text-[13px] tracking-[0.1em]">Monte o gradiente, veja ao vivo e copie o CSS</p>
          </div>
          <div className="mt-4 flex gap-3">
            <PalettePicker onPick={applyPalette} />
            <button
              type="button"
              onClick={randomize}
              className="h-[49px] w-[199px] rounded-[10px] bg-black text-base text-white shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:bg-black/85"
            >
              Degradê aleatório
            </button>
          </div>
        </div>

        <div className="mt-[25px] h-[363px] rounded-[20px]" style={{ background: gradient }} />

        {/* Barra das paradas: arraste os marcadores; clique num ponto vazio para adicionar uma cor */}
        <div
          ref={barRef}
          onPointerDown={(e) => insertStop(positionFromPointer(e.clientX))}
          className={`relative mx-[9.5px] mt-[18px] h-6 touch-none ${
            stops.length < MAX_STOPS ? 'cursor-copy' : 'cursor-not-allowed'
          }`}
          title={stops.length < MAX_STOPS ? 'Clique para adicionar uma cor' : `Máximo de ${MAX_STOPS} cores`}
        >
          <div className="absolute -inset-x-[9.5px] top-1.5 h-3 rounded-[20px]" style={{ background: trackGradient }} />
          {stops.map((s) => {
            const active = s.id === activeId
            return (
              <button
                key={s.id}
                type="button"
                data-stop={s.id}
                onPointerDown={(e) => onHandleDown(e, s.id)}
                onPointerMove={(e) => onHandleMove(e, s.id)}
                onPointerUp={() => setDragging(false)}
                onPointerCancel={() => setDragging(false)}
                onFocus={() => setActiveId(s.id)}
                onKeyDown={(e) => onHandleKey(e, s)}
                role="slider"
                aria-label={`Posição de ${s.color}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={s.position}
                className={`absolute top-0 h-6 w-[19px] -translate-x-1/2 rounded-[5px] border-[3px] border-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] outline-none transition-transform ${
                  active ? 'z-10 scale-125 ring-2 ring-black' : 'hover:scale-110'
                } ${dragging && active ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ left: `${s.position}%`, background: s.color }}
                title={`${s.color} · ${s.position}% — arraste para mover`}
              />
            )
          })}
        </div>
        <p className="mt-2 text-xs text-black/50">
          Arraste os marcadores para mover · clique na barra para adicionar · setas ajustam, Delete remove
        </p>

        <h2 className="mt-[45px] font-heading text-[15px] font-bold tracking-[0.1em]">Prontos para usar</h2>
        <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
          {GRADIENT_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded-[20px] border border-black/30 p-[3px] pb-0 text-left transition hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.12)]"
            >
              <span
                className="block h-[91px] rounded-t-[15px]"
                style={{
                  background: buildGradient({ ...config, type: 'linear', angle: p.angle, interp: 'srgb', stops: withIds(p.stops) }),
                }}
              />
              <span className="block px-1 py-3 font-heading text-[12px] font-semibold tracking-[0.1em]">{p.name}</span>
            </button>
          ))}
          {saved.map((g) => (
            <div key={g.id} className="group relative">
              <button
                type="button"
                onClick={() => applySaved(g)}
                className="w-full rounded-[20px] border border-black/30 p-[3px] pb-0 text-left transition hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.12)]"
              >
                <span className="block h-[91px] rounded-t-[15px]" style={{ background: buildGradient({ ...g, stops: withIds(g.stops) }) }} />
                <span className="block truncate px-1 py-3 pr-6 font-heading text-[12px] font-semibold tracking-[0.1em]">
                  {g.name}
                </span>
              </button>
              <button
                type="button"
                onClick={() => remove(g.id)}
                aria-label={`Excluir ${g.name}`}
                title="Excluir"
                className="absolute right-2 bottom-2.5 grid size-6 place-items-center rounded-full text-icon opacity-0 transition group-hover:opacity-100 hover:bg-black/10 focus-visible:opacity-100"
              >
                <Icon name="close" />
              </button>
            </div>
          ))}
        </div>

        <GradientInPractice gradient={gradient} stops={stops} />
      </div>

      {/* Painel */}
      <aside className="h-fit w-full shrink-0 rounded-[20px] border border-black/24 px-[27px] py-7 shadow-[0_4px_4px_rgba(0,0,0,0.25)] xl:w-[422px]">
        <p className="text-base opacity-60">Tipo</p>
        <Segmented options={TYPES} value={type} onChange={setType} />

        {type === 'radial' && (
          <div className="mt-6">
            <p className="text-base opacity-60">Formato</p>
            <Segmented options={SHAPES} value={shape} onChange={setShape} size="sm" />
          </div>
        )}

        {hasAngle && (
          <label className="mt-6 block">
            <span className="flex justify-between text-base">
              <span className="opacity-60">{type === 'conico' ? 'Começa em' : 'Ângulo'}</span>
              <span className="text-sm opacity-60">{angle}°</span>
            </span>
            <input
              type="range"
              min={0}
              max={360}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="hl-range mt-3"
              style={{ '--fill': `${(angle / 360) * 100}%` } as CSSProperties}
            />
          </label>
        )}

        {hasOrigin && (
          <div className="mt-6 flex items-center gap-5">
            <OriginPicker value={origin} onChange={setOrigin} />
            <div>
              <p className="text-base opacity-60">Origem</p>
              <p className="mt-1 text-xs text-black/50">De onde o degradê {type === 'radial' ? 'se espalha' : 'gira'}</p>
            </div>
          </div>
        )}

        <div className="mt-6">
          <span className="flex items-baseline justify-between">
            <span className="text-base opacity-60">Transição</span>
            <span className="text-xs opacity-50">{INTERPS.find((t) => t.id === interp)?.hint}</span>
          </span>
          <Segmented options={INTERPS} value={interp} onChange={setInterp} size="sm" />
        </div>

        <div className="mt-7 flex items-center justify-between gap-2">
          <span className="text-base opacity-60">Cores ({stops.length})</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={invert}
              title="Inverter a ordem das cores"
              className="h-10 rounded-[7px] border border-black/20 px-3 font-medium text-black/60 transition hover:bg-black/5"
            >
              ⇄ Inverter
            </button>
            <button
              type="button"
              onClick={addStop}
              disabled={stops.length >= MAX_STOPS}
              className="h-10 rounded-[7px] border border-black/20 px-3 font-medium text-black/60 transition hover:bg-black/5 disabled:opacity-40"
            >
              + Adicionar
            </button>
          </div>
        </div>

        <ul className="mt-5 space-y-2">
          {stops.map((s) => (
            <li
              key={s.id}
              onFocusCapture={() => setActiveId(s.id)}
              onPointerDown={() => setActiveId(s.id)}
              className={`-mx-2 flex items-center gap-2 rounded-[10px] px-2 py-1.5 transition-colors ${
                s.id === activeId ? 'bg-black/5' : ''
              }`}
            >
              <label
                className="relative size-[34px] shrink-0 cursor-pointer rounded-[10px] shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                style={{ background: s.color }}
                aria-label={`Escolher cor ${s.color}`}
              >
                <input
                  type="color"
                  value={s.color.toLowerCase()}
                  onChange={(e) => updateStop(s.id, { color: e.target.value.toUpperCase() })}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <input
                    defaultValue={s.color}
                    key={s.color}
                    onBlur={(e) => {
                      const hex = normalizeHex(e.target.value)
                      if (hex) updateStop(s.id, { color: hex })
                      else e.target.value = s.color
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    spellCheck={false}
                    aria-label="Código hex"
                    className="w-24 bg-transparent font-medium uppercase outline-none focus:underline"
                  />
                  <span className="text-sm opacity-60">{s.position}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={s.position}
                  onChange={(e) => updateStop(s.id, { position: Number(e.target.value) })}
                  aria-label={`Posição de ${s.color}`}
                  className="hl-range mt-1"
                  style={{ '--fill': `${s.position}%` } as CSSProperties}
                />
              </div>
              <button
                type="button"
                onClick={() => removeStop(s.id)}
                disabled={stops.length <= 2}
                aria-label={`Remover ${s.color}`}
                className="ml-6 grid size-8 place-items-center rounded-full text-icon transition hover:bg-black/5 disabled:opacity-30"
              >
                <Icon name="close" />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex items-center justify-between gap-3">
          <div role="tablist" aria-label="Formato do código" className="flex gap-1 rounded-[8px] bg-segment p-1">
            {(['css', 'tailwind'] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={format === f}
                onClick={() => setFormat(f)}
                className={`rounded-[6px] px-3 py-1 text-sm transition ${
                  format === f ? 'bg-white shadow-[0_2px_3px_rgba(0,0,0,0.2)]' : 'opacity-60 hover:opacity-100'
                }`}
              >
                {f === 'css' ? 'CSS' : 'Tailwind'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => copy(code, format === 'css' ? 'CSS copiado!' : 'Classe copiada!')}
            className="flex h-[43px] w-[99px] items-center justify-center gap-1 rounded-[10px] bg-black text-[13px] font-medium text-white transition hover:bg-black/85"
          >
            <Icon name="copy" />
            Copiar
          </button>
        </div>
        <pre className="mt-4 rounded-[10px] bg-black px-4 py-[18px] font-ui text-[15px] font-medium break-all whitespace-pre-wrap text-white">
          {format === 'css' ? (
            <>
              <span className="text-code-key">background</span>: {gradient};
            </>
          ) : (
            <span className="text-code-key">{code}</span>
          )}
        </pre>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={downloadPng}
            className="h-[43px] rounded-[10px] border border-black text-[14px] font-medium transition hover:bg-black/5"
          >
            Baixar PNG
          </button>
          <button
            type="button"
            onClick={onSave}
            className="h-[43px] rounded-[10px] border border-brick bg-brick-strong text-[14px] font-medium shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:brightness-105"
          >
            Salvar degradê
          </button>
        </div>
      </aside>
    </main>
  )
}
