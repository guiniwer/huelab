import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ContrastMap } from '../components/ContrastMap'
import { ImageExtract } from '../components/ImageExtract'
import { VisionFilters, VisionSelect } from '../components/Vision'
import { Icon } from '../components/Icon'
import { Menu } from '../components/Menu'
import { NameDialog } from '../components/NameDialog'
import { useCopy, useToast } from '../components/toast-context'
import {
  colorName,
  contrastRatio,
  hexToHsl,
  hslToHex,
  normalizeHex,
  prefersDarkText,
  shades,
  wcagLevel,
} from '../lib/color'
import { visionFilter, type Vision } from '../lib/colorblind'
import {
  degradePath,
  downloadBlob,
  exportPalette,
  montarLink,
  PALETTE_FORMATS,
  paletteToGradient,
  renderPalettePng,
} from '../lib/share'
import { useSavedPalettes } from '../lib/storage'

const DEFAULT = ['#141A34', '#57C1BE', '#70FFE2', '#E8C468', '#F6F2EE']
const MIN = 2
const MAX = 8

function parseColors(param: string | null): string[] {
  const list = (param ?? '').split('-').map(normalizeHex).filter((c): c is string => !!c)
  return list.length >= MIN ? list.slice(0, MAX) : DEFAULT
}

function Slider({
  label,
  value,
  max,
  track,
  onChange,
  suffix = '%',
}: {
  label: string
  value: number
  max: number
  track: string
  onChange: (v: number) => void
  suffix?: string
}) {
  return (
    <label className="block">
      <span className="flex items-end justify-between">
        <span className="text-base opacity-60">{label}</span>
        <span className="text-xs opacity-60">
          {Math.round(value)}
          {suffix}
        </span>
      </span>
      <span
        aria-hidden
        className="mt-2 block h-2 rounded-[20px] shadow-[inset_0_4px_4px_rgba(0,0,0,0.25),0_2px_4px_rgba(0,0,0,0.25)]"
        style={{ background: track }}
      />
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="hl-range mt-2"
        style={{ '--fill': `${(value / max) * 100}%` } as CSSProperties}
      />
    </label>
  )
}

export default function Montar() {
  const [params] = useSearchParams()
  const [colors, setColors] = useState(() => parseColors(params.get('cores')))
  const [selected, setSelected] = useState(0)
  // Texto digitado no campo hex; só vale enquanto a cor selecionada não muda por outro meio
  const [draft, setDraft] = useState<{ base: string; value: string } | null>(null)
  const copy = useCopy()
  const toast = useToast()
  const navigate = useNavigate()
  const [extracting, setExtracting] = useState(false)
  const [vision, setVision] = useState<Vision>('normal')
  const { save, nextName } = useSavedPalettes()
  const [saving, setSaving] = useState(false)
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const current = colors[selected]
  const hsl = useMemo(() => hexToHsl(current), [current])
  const tones = useMemo(() => shades(current), [current])

  const hexValue = draft?.base === current ? draft.value : current

  const setCurrent = (hex: string) => setColors((list) => list.map((c, i) => (i === selected ? hex : c)))
  const setHsl = (patch: Partial<typeof hsl>) => setCurrent(hslToHex({ ...hsl, ...patch }))

  const addColor = () => {
    if (colors.length >= MAX) return
    const { h, s, l } = hexToHsl(colors[colors.length - 1])
    setColors((list) => [...list, hslToHex({ h: h + 30, s, l: Math.min(85, l + 10) })])
    setSelected(colors.length)
  }

  const removeColor = () => {
    if (colors.length <= MIN) return
    setColors((list) => list.filter((_, i) => i !== selected))
    setSelected((s) => Math.max(0, s - 1))
  }

  /** Move uma cor de posição; a seleção acompanha a cor que estava sendo editada. */
  const move = (from: number, to: number) => {
    if (from === to) return
    const editing = colors[selected]
    const next = [...colors]
    next.splice(to, 0, next.splice(from, 1)[0])
    setColors(next)
    setSelected(next.indexOf(editing))
  }

  const exportItems = [
    ...PALETTE_FORMATS.map((f) => ({
      label: f.label,
      hint: 'copiar',
      onSelect: () => copy(exportPalette(colors, f.id), `${f.label} copiado!`),
    })),
    'separator' as const,
    {
      label: 'Imagem PNG',
      hint: 'baixar',
      onSelect: () =>
        renderPalettePng(colors).then(
          (blob) => {
            downloadBlob(blob, 'huelab-paleta.png')
            toast('PNG baixado')
          },
          () => toast('Não foi possível gerar o PNG'),
        ),
    },
    'separator' as const,
    { label: 'Abrir como degradê', hint: '→', onSelect: () => navigate(degradePath(paletteToGradient(colors))) },
  ]

  const white = contrastRatio(current, '#FFFFFF')
  const black = contrastRatio(current, '#000000')
  const pick = (i: number) => colors[i % colors.length]
  const card = { bg: pick(0), badge: pick(3), text: pick(4), accent: pick(2) }

  return (
    <main className="mx-auto flex max-w-[1440px] flex-col gap-12 px-4 pt-10 pb-20 sm:px-[53px] xl:flex-row xl:gap-[100px]">
      <div className="min-w-0 flex-1 xl:max-w-[900px]">
        <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
          <div>
            <h1 className="font-heading text-[32px] font-bold tracking-[0.1em]">Montar paleta</h1>
            <p className="font-body text-[13px] tracking-[0.1em]">Escolha uma cor e ajuste no painel. De 2 a 8 cores</p>
          </div>
          <div className="flex gap-3 pt-[13px]">
            <button
              type="button"
              onClick={() => setExtracting(true)}
              title="Criar a paleta a partir das cores de uma foto"
              className="h-[47px] w-[124px] rounded-[10px] border border-brick shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:bg-brick-soft/40"
            >
              Da imagem
            </button>
            <Menu
              label="Exportar ▾"
              items={exportItems}
              className="h-[47px] w-[124px] rounded-[10px] border border-brick shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:bg-brick-soft/40"
            />
            <button
              type="button"
              onClick={() => copy(montarLink(colors), 'Link copiado!')}
              title="Copiar um link que abre esta paleta"
              className="h-[47px] w-[124px] rounded-[10px] border border-brick shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:bg-brick-soft/40"
            >
              Copiar link
            </button>
            <button
              type="button"
              onClick={() => setSaving(true)}
              className="h-[47px] w-[124px] rounded-[10px] border border-brick bg-brick-strong shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:brightness-105"
            >
              Salvar paleta
            </button>
          </div>
        </div>

        <div className="mt-8">
          <VisionSelect value={vision} onChange={setVision} />
        </div>

        {/* Faixas da paleta */}
        <div className="mt-4 flex h-[313px] overflow-hidden rounded-[20px]" style={{ filter: visionFilter(vision) }}>
          {colors.map((c, i) => {
            const dark = prefersDarkText(c)
            const active = i === selected
            const isTarget = dragOver === i && dragFrom !== null && dragFrom !== i
            return (
              <button
                key={i}
                type="button"
                draggable
                onDragStart={(e) => {
                  setDragFrom(i)
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', c)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(i)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (dragFrom !== null) move(dragFrom, i)
                  setDragFrom(null)
                  setDragOver(null)
                }}
                onDragEnd={() => {
                  setDragFrom(null)
                  setDragOver(null)
                }}
                onClick={() => setSelected(i)}
                aria-pressed={active}
                aria-label={`Editar ${c}`}
                title="Clique para editar · arraste para reordenar"
                className={`relative flex min-w-0 cursor-grab flex-col items-center justify-between py-[38px] font-body text-[13px] font-medium tracking-[0.1em] transition-[flex,opacity] duration-300 active:cursor-grabbing ${
                  active ? 'flex-[1.37]' : 'flex-1'
                } ${dark ? 'text-on-light' : 'text-on-dark'} ${dragFrom === i ? 'opacity-40' : ''}`}
                style={{ background: c }}
              >
                {isTarget && (
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute inset-y-0 w-1 ${dragFrom! < i ? 'right-0' : 'left-0'} ${
                      dark ? 'bg-on-light/60' : 'bg-on-dark/80'
                    }`}
                  />
                )}
                <span
                  className={`rounded-[20px] border px-5 py-[2px] text-[10px] font-normal ${
                    dark ? 'border-on-light/50 text-on-light/60' : 'border-on-dark/70 text-on-dark/60'
                  } ${active ? 'visible' : 'invisible'}`}
                >
                  EDITANDO
                </span>
                <span>{c}</span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={addColor}
            disabled={colors.length >= MAX}
            aria-label="Adicionar cor"
            className="w-[82px] shrink-0 rounded-r-[20px] bg-panel font-body text-[36px] font-light shadow-[0_0_4px_rgba(0,0,0,0.25)] transition hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>

        {/* Na prática */}
        <section
          className="mt-[42px] rounded-[20px] border border-black/30 px-[25px] pt-[23px] pb-[25px] sm:px-[40px]"
          style={{ filter: visionFilter(vision) }}
        >
          <h2 className="font-heading text-[20px] font-bold tracking-[0.1em]">Na prática</h2>
          <div className="mt-4 flex flex-col gap-8 md:flex-row md:items-center">
            <div className="flex-1 rounded-[15px] px-7 py-[31px]" style={{ background: card.bg }}>
              <span
                className="inline-block rounded-[20px] px-[18px] py-[5px] font-heading text-[15px] font-bold tracking-[0.1em]"
                style={{ background: card.badge, color: prefersDarkText(card.badge) ? '#000' : '#fff' }}
              >
                Novidade
              </span>
              <p className="mt-[11px] font-card text-[20px] tracking-[0.1em]" style={{ color: card.text }}>
                Seu próximo projeto começa pela cor
              </p>
              <span className="mt-3 block h-[3px] w-[77px] rounded" style={{ background: card.accent }} />
              <p className="mt-5 font-heading text-[13px] font-semibold tracking-[0.1em]" style={{ color: card.text }}>
                Um exemplo de card usando as cores da sua paleta
              </p>
              <span
                className="mt-6 inline-block rounded-[12px] px-[23px] py-[11px] font-heading text-[13px] font-bold tracking-[0.1em]"
                style={{ background: card.accent, color: card.bg }}
              >
                Começar Agora
              </span>
            </div>
            <ul className="flex w-full flex-col gap-[14px] md:w-[254px]">
              {colors.map((c, i) => (
                <li
                  key={i}
                  className={`flex h-[38px] items-center rounded-l-[20px] border border-[#d9d9d9] px-[22px] font-body text-[13px] font-medium tracking-[0.1em] ${
                    prefersDarkText(c) ? 'text-on-light' : 'text-on-dark'
                  }`}
                  style={{ background: c }}
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <ContrastMap colors={colors} />
      </div>

      {/* Painel de edição */}
      <aside className="w-full shrink-0 space-y-6 xl:mt-[22px] xl:w-[303px]" aria-label="Editar cor selecionada">
        <div
          className={`relative flex h-[120px] flex-col justify-end rounded-[10px] px-[15px] pb-4 ${
            prefersDarkText(current) ? 'text-on-light' : 'text-on-dark'
          }`}
          style={{ background: current }}
        >
          <span className="text-[24px] font-semibold">{current}</span>
          <span className="text-base opacity-60 first-letter:uppercase">{colorName(current)}</span>
          <button
            type="button"
            onClick={() => copy(current)}
            aria-label={`Copiar ${current}`}
            className={`absolute right-[14px] bottom-[17px] grid h-[38px] w-[42px] place-items-center rounded-[10px] border ${
              prefersDarkText(current) ? 'border-on-light/20' : 'border-on-dark/20'
            }`}
          >
            <Icon name="copy" />
          </button>
        </div>

        <label className="block">
          <span className="text-base opacity-60">Código hex</span>
          <input
            value={hexValue}
            onChange={(e) => {
              const hex = normalizeHex(e.target.value)
              if (hex) setCurrent(hex)
              setDraft({ base: hex ?? current, value: e.target.value })
            }}
            onBlur={() => setDraft(null)}
            spellCheck={false}
            className="mt-2 h-[46px] w-full rounded-[10px] border border-black/20 px-[15px] font-medium uppercase outline-none focus:border-black/50"
          />
        </label>

        <Slider
          label="Matiz"
          value={hsl.h}
          max={360}
          suffix="°"
          onChange={(h) => setHsl({ h })}
          track="linear-gradient(90deg, #f00 0%, #e88513 10.5%, #ffff07 21%, #73ff07 31.5%, #39d262 41.8%, #07acff 52%, #0756ff 63%, #2d07ff 74%, #9407ff 84.5%, #ff07a4 94.7%)"
        />
        <Slider
          label="Saturação"
          value={hsl.s}
          max={100}
          onChange={(s) => setHsl({ s })}
          track={`linear-gradient(90deg, ${hslToHex({ ...hsl, s: 0 })}, ${hslToHex({ ...hsl, s: 100 })})`}
        />
        <Slider
          label="Luminosidade"
          value={hsl.l}
          max={100}
          onChange={(l) => setHsl({ l })}
          track={`linear-gradient(90deg, #000, ${hslToHex({ ...hsl, l: 50 })}, #fff)`}
        />

        <div>
          <span className="text-base opacity-60">Tons</span>
          <div className="mt-2 flex h-[46px] overflow-hidden rounded-[15px]">
            {tones.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCurrent(t)}
                aria-label={`Usar tom ${t}`}
                title={t}
                className="flex-1 transition hover:scale-y-110"
                style={{ background: t }}
              />
            ))}
          </div>
          <span
            aria-hidden
            className="mt-2 block h-2 rounded-[20px] shadow-[0_3px_4px_rgba(0,0,0,0.25)]"
            style={{ background: `linear-gradient(90deg, ${tones.join(', ')})` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Contraste C/ Branco', ratio: white },
            { label: 'Contraste C/ Preto', ratio: black },
          ].map(({ label, ratio }) => {
            const level = wcagLevel(ratio)
            return (
              <div key={label} className="rounded-[10px] border border-black/20 px-[11px] py-[10px]">
                <p className="text-[11px]">{label}</p>
                <p className="mt-1 text-[20px] font-semibold">{ratio.toFixed(2)}:1</p>
                <p className={`text-[11px] font-medium ${level === 'Reprovado' ? 'text-danger' : 'text-success'}`}>
                  {level}
                </p>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={removeColor}
          disabled={colors.length <= MIN}
          className="flex h-10 w-full items-center justify-center gap-1 rounded-[10px] border-2 border-danger/20 text-[15px] text-danger transition hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="trash" />
          Remover esta cor
        </button>
      </aside>

      <VisionFilters />
      <ImageExtract
        open={extracting}
        onClose={() => setExtracting(false)}
        onUse={(list) => {
          setColors(list.slice(0, MAX))
          setSelected(0)
          toast('Cores da imagem aplicadas')
        }}
      />
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
          toast(`"${name}" salva no ♡ Salvos`)
        }}
        onClose={() => setSaving(false)}
      />
    </main>
  )
}
