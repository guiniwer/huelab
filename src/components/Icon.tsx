import closeUrl from '../assets/icons/close.svg'
import copyUrl from '../assets/icons/copy.svg'
import favoriteUrl from '../assets/icons/favorite.svg'
import lockUrl from '../assets/icons/lock.svg'
import degradeUrl from '../assets/icons/degrade.svg'
import explorarUrl from '../assets/icons/explorar.svg'
import gerarUrl from '../assets/icons/gerar.svg'
import heartFillUrl from '../assets/icons/heart-fill.svg'
import heartUrl from '../assets/icons/heart.svg'
import montarUrl from '../assets/icons/montar.svg'
import trashUrl from '../assets/icons/trash.svg'
import viewUrl from '../assets/icons/view.svg'

const ICONS = {
  close: { url: closeUrl, w: 18, h: 18 },
  copy: { url: copyUrl, w: 24, h: 24 },
  favorite: { url: favoriteUrl, w: 24, h: 24 },
  lock: { url: lockUrl, w: 16, h: 18 },
  trash: { url: trashUrl, w: 24, h: 24 },
  view: { url: viewUrl, w: 24, h: 24 },
  heart: { url: heartUrl, w: 24, h: 24 },
  heartFill: { url: heartFillUrl, w: 24, h: 24 },
  explorar: { url: explorarUrl, w: 24, h: 24 },
  gerar: { url: gerarUrl, w: 24, h: 24 },
  montar: { url: montarUrl, w: 24, h: 24 },
  degrade: { url: degradeUrl, w: 24, h: 24 },
} as const

export type IconName = keyof typeof ICONS

/**
 * Ícones do Figma (Line icons) aplicados como máscara CSS:
 * o desenho é o SVG original e a cor vem de `color` / currentColor.
 */
export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const { url, w, h } = ICONS[name]
  return (
    <span
      aria-hidden
      className={`icon ${className}`}
      style={{ width: w, height: h, maskImage: `url("${url}")`, WebkitMaskImage: `url("${url}")` }}
    />
  )
}
