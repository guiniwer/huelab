import { Link, useNavigate, useParams } from 'react-router-dom'
import { ContrastMap } from '../components/ContrastMap'
import { Icon } from '../components/Icon'
import { Menu } from '../components/Menu'
import { useCopy, useToast } from '../components/toast-context'
import { POPULAR_PALETTES } from '../data/palettes'
import { colorName, hexToHsl, hexToRgb, prefersDarkText, shades } from '../lib/color'
import { simulate, VISIONS } from '../lib/colorblind'
import {
  degradePath,
  downloadBlob,
  exportPalette,
  montarLink,
  montarPath,
  PALETTE_FORMATS,
  paletteToGradient,
  renderPalettePng,
} from '../lib/share'
import { useFavorites, useSavedPalettes } from '../lib/storage'

const btn =
  'flex h-[47px] items-center gap-2 rounded-[10px] border border-brick px-5 shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:bg-brick-soft/40'

/** Página de uma paleta (popular ou salva): cores em detalhe, tons, contraste e daltonismo. */
export default function Paleta() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const copy = useCopy()
  const toast = useToast()
  const { isFavorite, toggle } = useFavorites()
  const { palettes, remove } = useSavedPalettes()

  const popular = POPULAR_PALETTES.find((p) => p.id === id)
  const saved = palettes.find((p) => p.id === id)
  const palette = popular ?? saved

  if (!palette) {
    return (
      <main className="mx-auto max-w-[700px] px-4 py-24 text-center">
        <h1 className="font-heading text-[28px] font-bold tracking-[0.08em]">Paleta não encontrada</h1>
        <p className="mt-3 text-black/60">Ela pode ter sido excluída, ou foi salva em outro navegador.</p>
        <Link to="/" className="mt-8 inline-block underline underline-offset-4">
          Voltar para Explorar
        </Link>
      </main>
    )
  }

  const { colors, name } = palette

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
          (blob) => downloadBlob(blob, `${name.toLowerCase().replace(/\s+/g, '-')}.png`),
          () => toast('Não foi possível gerar o PNG'),
        ),
    },
  ]

  // paletas salvas só existem neste navegador: o link compartilha as cores pelo Montar
  const shareLink = popular ? `${window.location.origin}/paleta/${popular.id}` : montarLink(colors)

  return (
    <main className="mx-auto max-w-[1240px] px-4 pt-10 pb-24 sm:px-[53px]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm text-black/50">
            <Link to="/" className="hover:underline">
              Explorar
            </Link>{' '}
            / {popular ? 'Populares' : 'Minhas paletas'}
          </p>
          <h1
            className="mt-1 font-heading text-[36px] font-bold tracking-[0.08em]"
            style={popular ? { color: popular.accent } : undefined}
          >
            {name}
          </h1>
          <p className="text-sm text-black/55">
            {colors.length} cores
            {saved && ` · salva em ${new Date(saved.createdAt).toLocaleDateString('pt-BR')}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to={montarPath(colors)} className={`${btn} bg-brick-strong hover:bg-brick-strong hover:brightness-105`}>
            Editar no Montar
          </Link>
          <Link to={degradePath(paletteToGradient(colors))} className={btn}>
            Criar degradê
          </Link>
          <Menu label="Exportar ▾" items={exportItems} className={btn} align="right" />
          <button type="button" onClick={() => copy(shareLink, 'Link copiado!')} className={btn}>
            Copiar link
          </button>
          {popular ? (
            <button
              type="button"
              onClick={() => toggle(popular.id)}
              aria-pressed={isFavorite(popular.id)}
              aria-label={isFavorite(popular.id) ? 'Remover dos favoritos' : 'Favoritar'}
              className={`${btn} px-4 text-[#A62222]`}
            >
              <Icon name={isFavorite(popular.id) ? 'heartFill' : 'heart'} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                remove(saved!.id)
                toast(`"${name}" excluída`)
                navigate('/')
              }}
              className={`${btn} border-danger/40 text-danger hover:bg-danger/5`}
            >
              <Icon name="trash" /> Excluir
            </button>
          )}
        </div>
      </div>

      {/* Cores em destaque */}
      <div className="mt-10 flex h-[360px] overflow-hidden rounded-[20px]">
        {colors.map((c, i) => {
          const { r, g, b } = hexToRgb(c)
          const { h, s, l } = hexToHsl(c)
          return (
            <button
              key={i}
              type="button"
              onClick={() => copy(c)}
              title={`Copiar ${c}`}
              className={`group flex min-w-0 flex-1 flex-col justify-end gap-1 p-5 text-left transition-[flex-grow] duration-300 hover:flex-[1.4] ${
                prefersDarkText(c) ? 'text-on-light' : 'text-on-dark'
              }`}
              style={{ background: c }}
            >
              <span className="font-body text-[22px] font-semibold tracking-[0.08em]">{c}</span>
              <span className="text-sm opacity-75 first-letter:uppercase">{colorName(c)}</span>
              <span className="mt-2 font-mono text-[12px] opacity-60">
                rgb({r}, {g}, {b})
                <br />
                hsl({Math.round(h)}, {Math.round(s)}%, {Math.round(l)}%)
              </span>
              <span className="mt-2 flex items-center gap-1 text-xs opacity-0 transition group-hover:opacity-70">
                <Icon name="copy" /> copiar
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        {/* Tons */}
        <section className="rounded-[20px] border border-black/30 px-[25px] pt-[23px] pb-[28px] sm:px-[32px]">
          <h2 className="font-heading text-[20px] font-bold tracking-[0.1em]">Tons</h2>
          <p className="mt-1 text-[13px] text-black/60">Do mais escuro ao mais claro · clique para copiar</p>
          <div className="mt-5 space-y-2">
            {colors.map((c, i) => (
              <div key={i} className="flex h-9 overflow-hidden rounded-[8px]">
                {shades(c).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => copy(t)}
                    title={t}
                    aria-label={`Copiar ${t}`}
                    className="flex-1 transition hover:scale-y-110"
                    style={{ background: t }}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Daltonismo */}
        <section className="rounded-[20px] border border-black/30 px-[25px] pt-[23px] pb-[28px] sm:px-[32px]">
          <h2 className="font-heading text-[20px] font-bold tracking-[0.1em]">Como outras pessoas veem</h2>
          <p className="mt-1 text-[13px] text-black/60">
            Simulação de daltonismo · cores que ficam iguais aqui não devem ser a única diferença entre coisas
          </p>
          <div className="mt-5 space-y-3">
            {VISIONS.map((v) => (
              <div key={v.id} className="flex items-center gap-4">
                <span className="w-[104px] shrink-0 text-[13px]" title={v.hint}>
                  {v.label}
                </span>
                <span className="flex h-9 flex-1 overflow-hidden rounded-[8px]">
                  {colors.map((c, i) => (
                    <span key={i} className="flex-1" style={{ background: simulate(c, v.id) }} />
                  ))}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <ContrastMap colors={colors} />
    </main>
  )
}
