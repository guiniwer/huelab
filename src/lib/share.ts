import { colorName, normalizeHex, prefersDarkText, type ColorSpace } from './color'
import type { GradientConfig, GradientStop, GradientType, RadialShape } from './gradient'

// ---------- Exportar paleta ----------

export type PaletteFormat = 'css' | 'scss' | 'tailwind' | 'json'

export const PALETTE_FORMATS: { id: PaletteFormat; label: string }[] = [
  { id: 'css', label: 'Variáveis CSS' },
  { id: 'scss', label: 'SCSS' },
  { id: 'tailwind', label: 'Tailwind (v4)' },
  { id: 'json', label: 'JSON' },
]

export function exportPalette(colors: string[], format: PaletteFormat): string {
  switch (format) {
    case 'scss':
      return colors.map((c, i) => `$cor-${i + 1}: ${c};`).join('\n')
    case 'tailwind':
      return `@theme {\n${colors.map((c, i) => `  --color-paleta-${i + 1}: ${c};`).join('\n')}\n}`
    case 'json':
      return JSON.stringify(
        colors.map((hex) => ({ hex, nome: colorName(hex) })),
        null,
        2,
      )
    default:
      return `:root {\n${colors.map((c, i) => `  --cor-${i + 1}: ${c};`).join('\n')}\n}`
  }
}

/** Imagem da paleta: faixas verticais com o hex de cada cor embaixo. */
export function renderPalettePng(colors: string[], width = 1600, height = 900): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const w = width / colors.length
  colors.forEach((c, i) => {
    ctx.fillStyle = c
    ctx.fillRect(Math.floor(i * w), 0, Math.ceil(w) + 1, height)
    ctx.fillStyle = prefersDarkText(c) ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)'
    ctx.font = '600 34px "42dot Sans", Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(c, i * w + w / 2, height - 90)
    ctx.font = '400 22px "42dot Sans", Inter, sans-serif'
    ctx.fillText(colorName(c), i * w + w / 2, height - 52)
  })
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao gerar PNG'))), 'image/png'),
  )
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ---------- Links de compartilhamento ----------

const absolute = (path: string) => `${window.location.origin}${path}`

export const montarPath = (colors: string[]) => `/montar?cores=${colors.map((c) => c.replace('#', '')).join('-')}`
export const montarLink = (colors: string[]) => absolute(montarPath(colors))

/** /degrade?tipo=radial&ang=135&tr=oklab&forma=ellipse&origem=0,0&cores=FF006E.0-8338EC.50 */
export function degradeLink({ type, angle, interp, shape, origin, stops }: GradientConfig): string {
  const params = new URLSearchParams({
    tipo: type,
    ang: String(angle),
    tr: interp,
    forma: shape,
    origem: `${origin.x},${origin.y}`,
    cores: stops.map((s) => `${s.color.replace('#', '')}.${s.position}`).join('-'),
  })
  return absolute(`/degrade?${params}`)
}

const TYPES: GradientType[] = ['linear', 'radial', 'conico']
const SPACES: ColorSpace[] = ['srgb', 'oklab', 'oklch']
const SHAPES: RadialShape[] = ['circle', 'ellipse']
const pct = (v: string | undefined) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : null
}

/** Lê um degradê da URL; devolve null se o link estiver incompleto ou inválido. */
export function parseDegradeParams(search: string): (Omit<GradientConfig, 'stops'> & { stops: Omit<GradientStop, 'id'>[] }) | null {
  const q = new URLSearchParams(search)
  const stops = (q.get('cores') ?? '')
    .split('-')
    .map((part) => {
      const [hex, pos] = part.split('.')
      const color = normalizeHex(hex ?? '')
      const position = pct(pos)
      return color && position !== null ? { color, position } : null
    })
    .filter((s): s is { color: string; position: number } => !!s)
    .slice(0, 8)
  if (stops.length < 2) return null

  const [ox, oy] = (q.get('origem') ?? '50,50').split(',')
  const angle = Number(q.get('ang'))
  return {
    type: TYPES.includes(q.get('tipo') as GradientType) ? (q.get('tipo') as GradientType) : 'linear',
    angle: Number.isFinite(angle) ? ((Math.round(angle) % 360) + 360) % 360 : 135,
    interp: SPACES.includes(q.get('tr') as ColorSpace) ? (q.get('tr') as ColorSpace) : 'oklab',
    shape: SHAPES.includes(q.get('forma') as RadialShape) ? (q.get('forma') as RadialShape) : 'circle',
    origin: { x: pct(ox) ?? 50, y: pct(oy) ?? 50 },
    stops,
  }
}
