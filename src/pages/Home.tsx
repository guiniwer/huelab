import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PaletteCard } from '../components/PaletteCard'
import { HERO_PALETTES, POPULAR_PALETTES } from '../data/palettes'
import { paletteFamilies, type ColorFamily } from '../lib/color'
import { useFavorites } from '../lib/storage'

const FILTERS: { id: ColorFamily; label: string; swatch: string }[] = [
  { id: 'vermelho', label: 'Vermelho', swatch: '#E5383B' },
  { id: 'laranja', label: 'Laranja', swatch: '#F4A261' },
  { id: 'amarelo', label: 'Amarelo', swatch: '#F7D560' },
  { id: 'verde', label: 'Verde', swatch: '#52B788' },
  { id: 'azul', label: 'Azul', swatch: '#3A86FF' },
  { id: 'roxo', label: 'Roxo', swatch: '#8338EC' },
  { id: 'rosa', label: 'Rosa', swatch: '#FF8FAB' },
  { id: 'pastel', label: 'Pastel', swatch: 'linear-gradient(135deg, #FFC8DD, #BDE0FE)' },
  { id: 'escuro', label: 'Escuro', swatch: '#1B1B2F' },
  { id: 'neutro', label: 'Neutro', swatch: '#ADB5BD' },
]

/** Normaliza para busca sem acento ("acai" acha "Açaí"). */
const plain = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const FAMILIES = new Map(POPULAR_PALETTES.map((p) => [p.id, paletteFamilies(p.colors)]))

function HeroPalette({ colors }: { colors: string[] }) {
  return (
    <div className="flex h-[259px] w-[240px] overflow-hidden rounded-[10px]">
      {colors.map((c) => (
        <span key={c} className="flex-1" style={{ background: c }} />
      ))}
    </div>
  )
}

export default function Home() {
  const { isFavorite, toggle } = useFavorites()
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState<ColorFamily | null>(null)

  const visible = useMemo(
    () =>
      POPULAR_PALETTES.filter(
        (p) => plain(p.name).includes(plain(query.trim())) && (!family || FAMILIES.get(p.id)!.has(family)),
      ),
    [query, family],
  )

  return (
    <main className="mx-auto max-w-[1440px] overflow-x-clip px-4 pb-20 sm:px-[100px]">
      <section className="relative flex flex-col gap-3 pt-14 xl:flex-row xl:items-start">
        <div className="min-w-0 max-w-[871px] flex-1">
          <h1 className="font-display text-[40px] leading-tight tracking-[0.1em] uppercase sm:text-[60px] sm:leading-[80px] 2xl:text-[70px] 2xl:leading-[94px]">
            Toda grande ideia começa com uma cor.
          </h1>
          <p className="mt-6 max-w-[865px] font-body text-lg tracking-[0.1em] sm:text-[24px]">
            Explore combinações, descubra novas harmonias e transforme sua criatividade em paletas únicas.
          </p>
          <div className="mt-8 flex flex-wrap gap-6">
            <Link
              to="/montar"
              className="rounded-[15px] border border-black px-6 py-[18px] font-heading text-lg font-semibold tracking-[0.1em] shadow-[0_7px_4px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 sm:text-[24px]"
              style={{ backgroundImage: 'linear-gradient(131.7deg, rgb(229,189,66) 9%, rgb(245,106,227) 138.8%)' }}
            >
              Criar minha paleta
            </Link>
            <a
              href="#populares"
              className="rounded-[15px] border border-black px-9 py-[18px] font-heading text-lg font-semibold tracking-[0.1em] shadow-[0_7px_4px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 sm:text-[24px]"
              style={{ backgroundImage: 'linear-gradient(116.9deg, rgb(75,181,185) 9%, rgb(106,146,245) 138.8%)' }}
            >
              Explore
            </a>
          </div>
        </div>

        {/* Paletas decorativas com brilho colorido atrás */}
        <div aria-hidden className="relative hidden h-[460px] w-[360px] shrink-0 xl:block">
          <div className="absolute top-[-27px] left-[93px] h-[314px] w-[294px] bg-[rgba(61,109,54,0.48)] blur-[50px]" />
          <div className="absolute top-[143px] left-[-27px] h-[314px] w-[294px] bg-[rgba(134,51,10,0.48)] blur-[50px]" />
          <div className="absolute top-0 left-[120px]">
            <HeroPalette colors={HERO_PALETTES.forest} />
          </div>
          <div className="absolute top-[170px] left-0">
            <HeroPalette colors={HERO_PALETTES.terracotta} />
          </div>
        </div>
      </section>

      <section id="populares" className="mt-24 scroll-mt-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-heading text-[32px] font-semibold tracking-[0.1em]">Populares</h2>
          <label className="relative">
            <span className="sr-only">Buscar paleta</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome…"
              className="h-10 w-[260px] rounded-[10px] border border-black/20 px-4 text-[15px] outline-none transition focus:border-black/50"
            />
          </label>
        </div>

        <div role="group" aria-label="Filtrar por cor" className="mt-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = family === f.id
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFamily(active ? null : f.id)}
                className={`flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition ${
                  active ? 'border-black bg-black text-white' : 'border-black/15 hover:border-black/40'
                }`}
              >
                <span className="size-3.5 rounded-full border border-black/10" style={{ background: f.swatch }} />
                {f.label}
              </button>
            )
          })}
        </div>

        {visible.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 justify-items-center gap-x-6 gap-y-10 md:grid-cols-3 xl:grid-cols-5">
            {visible.map((p) => (
              <PaletteCard
                key={p.id}
                name={p.name}
                colors={p.colors}
                accent={p.accent}
                favorite={isFavorite(p.id)}
                onToggleFavorite={() => toggle(p.id)}
              />
            ))}
          </div>
        ) : (
          <p className="mt-14 text-center text-black/50">
            Nenhuma paleta encontrada.{' '}
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setFamily(null)
              }}
              className="underline underline-offset-4 hover:text-black"
            >
              Limpar filtros
            </button>
          </p>
        )}
      </section>
    </main>
  )
}
