import { Link } from 'react-router-dom'
import { prefersDarkText } from '../lib/color'
import { Icon } from './Icon'
import { useCopy } from './toast-context'

type Props = {
  name: string
  colors: string[]
  accent: string
  favorite?: boolean
  onToggleFavorite?: () => void
}

/**
 * Card de paleta: faixas verticais que expandem no hover (clique copia o hex)
 * e rodapé com nome, olho (abre no Montar) e favorito.
 */
export function PaletteCard({ name, colors, accent, favorite, onToggleFavorite }: Props) {
  const copy = useCopy()
  const montarHref = `/montar?cores=${colors.map((c) => c.replace('#', '')).join('-')}`

  return (
    <article className="w-full max-w-[260px]">
      <div className="flex h-[130px] overflow-hidden rounded-[10px]">
        {colors.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => copy(c)}
            aria-label={`Copiar ${c}`}
            title={`Copiar ${c}`}
            className={`group/cor relative flex min-w-0 flex-1 flex-col items-center justify-end gap-1 pb-3 transition-[flex-grow] duration-300 ease-out hover:flex-[2.6] focus-visible:flex-[2.6] focus-visible:outline-none ${
              prefersDarkText(c) ? 'text-black' : 'text-white'
            }`}
            style={{ background: c }}
          >
            <span className="flex flex-col items-center gap-1 opacity-0 transition-opacity duration-200 group-hover/cor:opacity-100 group-hover/cor:delay-100 group-focus-visible/cor:opacity-100">
              <Icon name="copy" />
              <span className="font-body text-[11px] font-medium tracking-[0.05em] whitespace-nowrap">{c}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex h-[44px] items-center gap-1 pr-1 pl-1">
        <span className="min-w-0 flex-1 truncate font-mono text-[16px] font-medium" style={{ color: accent }}>
          {name}
        </span>
        <Link
          to={montarHref}
          aria-label={`Abrir ${name} no Montar`}
          title="Abrir no Montar"
          className="grid size-8 shrink-0 place-items-center rounded-full text-icon/60 transition hover:bg-black/5 hover:text-icon"
        >
          <Icon name="view" />
        </Link>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={favorite}
            aria-label={favorite ? `Remover ${name} dos favoritos` : `Favoritar ${name}`}
            className={`grid size-8 shrink-0 place-items-center rounded-full transition hover:bg-black/5 ${
              favorite ? 'text-[#A62222]' : 'text-[#A62222]/45 hover:text-[#A62222]/80'
            }`}
          >
            <Icon name={favorite ? 'heartFill' : 'heart'} />
          </button>
        )}
      </div>
    </article>
  )
}
