import { mixIn, type ColorSpace } from './color'

export type GradientType = 'linear' | 'radial' | 'conico'
export type RadialShape = 'circle' | 'ellipse'
export type GradientStop = { id: string; color: string; position: number }
/** Ponto de origem do radial/cônico, em % da largura/altura. */
export type Origin = { x: number; y: number }

export type GradientConfig = {
  type: GradientType
  angle: number
  interp: ColorSpace
  shape: RadialShape
  origin: Origin
  stops: GradientStop[]
}

export const sortStops = (stops: GradientStop[]) => [...stops].sort((a, b) => a.position - b.position)

const KEYWORD_X: Record<number, string> = { 0: 'left', 50: 'center', 100: 'right' }
const KEYWORD_Y: Record<number, string> = { 0: 'top', 50: 'center', 100: 'bottom' }

/** "top left", "center", "bottom"… (ou "30% 70%" se não for um dos 9 pontos). */
export function originToCss({ x, y }: Origin): string {
  const kx = KEYWORD_X[x]
  const ky = KEYWORD_Y[y]
  if (!kx || !ky) return `${x}% ${y}%`
  if (kx === 'center' && ky === 'center') return 'center'
  if (kx === 'center') return ky
  if (ky === 'center') return kx
  return `${ky} ${kx}`
}

export function buildGradient({ type, angle, interp, shape, origin, stops }: GradientConfig): string {
  const list = sortStops(stops)
    .map((s) => `${s.color} ${s.position}%`)
    .join(', ')
  const space = interp === 'srgb' ? '' : ` in ${interp}`
  const at = originToCss(origin) === 'center' ? '' : ` at ${originToCss(origin)}`
  if (type === 'radial') return `radial-gradient(${shape}${at}${space}, ${list})`
  if (type === 'conico') return `conic-gradient(from ${angle}deg${at}${space}, ${list})`
  return `linear-gradient(${angle}deg${space}, ${list})`
}

/** Classe arbitrária do Tailwind equivalente (espaços viram "_"). */
export const toTailwind = (gradient: string) => `bg-[${gradient.replace(/,\s*/g, ',').replace(/\s+/g, '_')}]`

/**
 * Paradas extras para o canvas: ele só interpola em sRGB, então subdividimos cada
 * trecho no espaço escolhido (OKLab/OKLCH) para o PNG ficar igual ao CSS.
 */
function expandStops(stops: GradientStop[], interp: ColorSpace): { pos: number; color: string }[] {
  const sorted = sortStops(stops)
  if (interp === 'srgb') return sorted.map((s) => ({ pos: s.position / 100, color: s.color }))
  const out: { pos: number; color: string }[] = []
  sorted.forEach((s, i) => {
    out.push({ pos: s.position / 100, color: s.color })
    const next = sorted[i + 1]
    if (!next || next.position === s.position) return
    const steps = 24
    for (let k = 1; k < steps; k++) {
      const t = k / steps
      out.push({
        pos: (s.position + (next.position - s.position) * t) / 100,
        color: mixIn(interp, s.color, next.color, t),
      })
    }
  })
  return out
}

/** Desenha o degradê num canvas seguindo a geometria do CSS e devolve um PNG. */
export function renderPng(config: GradientConfig, width = 1920, height = 1080): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const cx = (config.origin.x / 100) * width
  const cy = (config.origin.y / 100) * height
  let grad: CanvasGradient

  if (config.type === 'linear') {
    // mesma "linha do gradiente" do CSS: passa pelo centro e alcança os cantos
    const rad = (config.angle * Math.PI) / 180
    const half = (Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad))) / 2
    const dx = Math.sin(rad) * half
    const dy = -Math.cos(rad) * half
    grad = ctx.createLinearGradient(width / 2 - dx, height / 2 - dy, width / 2 + dx, height / 2 + dy)
  } else if (config.type === 'conico') {
    grad = ctx.createConicGradient(((config.angle - 90) * Math.PI) / 180, cx, cy)
  } else {
    // tamanho padrão do CSS: farthest-corner
    const fx = Math.max(cx, width - cx)
    const fy = Math.max(cy, height - cy)
    if (config.shape === 'circle') {
      grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(fx, fy))
    } else {
      // elipse: mesma proporção do farthest-side, escalada para tocar o canto (×√2)
      const rx = fx * Math.SQRT2
      const ry = fy * Math.SQRT2
      ctx.translate(cx, cy)
      ctx.scale(1, ry / rx)
      ctx.translate(-cx, -cy)
      grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx)
    }
  }

  expandStops(config.stops, config.interp).forEach((s) => grad.addColorStop(s.pos, s.color))
  ctx.fillStyle = grad
  // com a escala da elipse, cobre uma área maior para não sobrar canto vazio
  ctx.fillRect(-width, -height * 4, width * 3, height * 9)

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao gerar PNG'))), 'image/png'),
  )
}
