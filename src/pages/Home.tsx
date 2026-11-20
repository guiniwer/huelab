import { Link } from 'react-router-dom'
import { PaletteCard } from '../components/PaletteCard'
import { HERO_PALETTES, POPULAR_PALETTES } from '../data/palettes'
import { useFavorites, useSavedPalettes } from '../lib/storage'

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
  const { palettes: saved, remove } = useSavedPalettes()

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

      <section id="populares" className="mt-24 scroll-mt-8">
        <h2 className="font-heading text-[32px] font-semibold tracking-[0.1em]">Populares</h2>
        <div className="mt-10 grid grid-cols-2 justify-items-center gap-x-6 gap-y-10 md:grid-cols-3 xl:grid-cols-5">
          {POPULAR_PALETTES.map((p) => (
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
      </section>

      {saved.length > 0 && (
        <section className="mt-20">
          <h2 className="font-heading text-[32px] font-semibold tracking-[0.1em]">Minhas paletas</h2>
          <div className="mt-10 grid grid-cols-2 justify-items-center gap-x-6 gap-y-10 md:grid-cols-3 xl:grid-cols-5">
            {saved.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-2">
                <PaletteCard name={p.name} colors={p.colors} accent={p.colors[Math.floor(p.colors.length / 2)]} />
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="text-sm text-danger hover:underline"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
