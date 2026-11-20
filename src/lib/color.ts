export type RGB = { r: number; g: number; b: number }
export type HSL = { h: number; s: number; l: number }

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export function normalizeHex(input: string): string | null {
  let hex = input.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.split('').map((c) => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null
  return `#${hex.toUpperCase()}`
}

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace('#', ''), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbToHex({ r, g, b }: RGB): string {
  const h = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase()
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
  }
  return { h, s: s * 100, l: l * 100 }
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const hn = (((h % 360) + 360) % 360) / 360
  const sn = clamp(s, 0, 100) / 100
  const ln = clamp(l, 0, 100) / 100
  if (sn === 0) return { r: ln * 255, g: ln * 255, b: ln * 255 }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn
  const p = 2 * ln - q
  const channel = (t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return { r: channel(hn + 1 / 3) * 255, g: channel(hn) * 255, b: channel(hn - 1 / 3) * 255 }
}

export const hexToHsl = (hex: string) => rgbToHsl(hexToRgb(hex))
export const hslToHex = (hsl: HSL) => rgbToHex(hslToRgb(hsl))

/** Luminância relativa (WCAG 2.x). */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

export type WcagLevel = 'AAA' | 'AA' | 'AA Grande' | 'Reprovado'

export function wcagLevel(ratio: number): WcagLevel {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA Grande'
  return 'Reprovado'
}

/** true se texto escuro tiver melhor contraste sobre esta cor. */
export const prefersDarkText = (hex: string) =>
  contrastRatio(hex, '#000000') >= contrastRatio(hex, '#FFFFFF')

const HUE_NAMES: [number, string][] = [
  [15, 'vermelho'],
  [40, 'laranja'],
  [65, 'amarelo'],
  [90, 'lima'],
  [160, 'verde'],
  [200, 'ciano'],
  [255, 'azul'],
  [285, 'roxo'],
  [320, 'magenta'],
  [345, 'rosa'],
  [360, 'vermelho'],
]

/** Nome aproximado da cor em português, ex.: "ciano escuro". */
export function colorName(hex: string): string {
  const { h, s, l } = hexToHsl(hex)
  if (l < 8) return 'preto'
  if (l > 95) return 'branco'
  if (s < 10) return l < 35 ? 'cinza escuro' : l > 70 ? 'cinza claro' : 'cinza'
  if (h >= 15 && h < 45 && l < 40) return 'marrom'
  if (h >= 30 && h < 55 && s < 45 && l > 70) return 'bege'
  const base = HUE_NAMES.find(([limit]) => h < limit)?.[1] ?? 'vermelho'
  if (l < 35) return `${base} escuro`
  if (l > 72) return `${base} claro`
  return base
}

export type ColorFamily =
  | 'vermelho'
  | 'laranja'
  | 'amarelo'
  | 'verde'
  | 'azul'
  | 'roxo'
  | 'rosa'
  | 'neutro'
  | 'pastel'
  | 'escuro'

/** Família de matiz de uma cor (ou "neutro" se quase sem saturação). */
export function hueFamily(hex: string): ColorFamily {
  const { h, s, l } = hexToHsl(hex)
  if (s < 15 || l < 7 || l > 96) return 'neutro'
  if (h < 12 || h >= 345) return 'vermelho'
  if (h < 42) return l < 40 ? 'vermelho' : 'laranja' // laranja escuro lê como marrom/vermelho
  if (h < 68) return 'amarelo'
  if (h < 170) return 'verde'
  if (h < 255) return 'azul'
  if (h < 290) return 'roxo'
  return 'rosa'
}

/** Famílias que descrevem uma paleta (para o filtro de Explorar). */
export function paletteFamilies(colors: string[]): Set<ColorFamily> {
  const out = new Set<ColorFamily>(colors.map(hueFamily))
  const hsl = colors.map(hexToHsl)
  if (hsl.filter((c) => c.l > 78 && c.s > 25).length >= 3) out.add('pastel')
  if (hsl.filter((c) => c.l < 30).length >= 3) out.add('escuro')
  if (hsl.filter((c) => c.s < 15).length < 2) out.delete('neutro') // um cinza só não faz a paleta neutra
  return out
}

/** Mistura linear (sRGB) entre duas cores; t de 0 a 1. */
export function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
  })
}

// --- OKLab / OKLCH (Björn Ottosson), usados para reproduzir "in oklab/oklch" no PNG ---
export type Lab = { L: number; a: number; b: number }
export const toLinear = (v: number) => {
  const c = v / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
export const fromLinear = (v: number) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)

export function hexToOklab(hex: string): Lab {
  const { r, g, b } = hexToRgb(hex)
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)]
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  }
}

export function oklabToHex({ L, a, b }: Lab): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return rgbToHex({
    r: fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  })
}

export type ColorSpace = 'srgb' | 'oklab' | 'oklch'

/** Mistura duas cores no espaço indicado (como o `in <espaço>` do CSS). */
export function mixIn(space: ColorSpace, a: string, b: string, t: number): string {
  if (space === 'srgb') return mixHex(a, b, t)
  const A = hexToOklab(a)
  const B = hexToOklab(b)
  const L = A.L + (B.L - A.L) * t
  if (space === 'oklab') return oklabToHex({ L, a: A.a + (B.a - A.a) * t, b: A.b + (B.b - A.b) * t })
  const cA = Math.hypot(A.a, A.b)
  const cB = Math.hypot(B.a, B.b)
  let hA = Math.atan2(A.b, A.a)
  let hB = Math.atan2(B.b, B.a)
  if (cA < 1e-4) hA = hB // cor neutra não tem matiz: herda a da outra
  if (cB < 1e-4) hB = hA
  let dh = hB - hA
  if (dh > Math.PI) dh -= 2 * Math.PI // caminho mais curto no círculo
  if (dh < -Math.PI) dh += 2 * Math.PI
  const c = cA + (cB - cA) * t
  const h = hA + dh * t
  return oklabToHex({ L, a: c * Math.cos(h), b: c * Math.sin(h) })
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)

export function randomHex(): string {
  return hslToHex({ h: rand(0, 360), s: rand(35, 90), l: rand(25, 80) })
}

export type HarmonyMode = 'harmonia' | 'aleatoria' | 'analoga' | 'complementar' | 'monocromatica' | 'triade'

/** Deslocamentos de matiz das combinações clássicas usadas pelo modo "Harmonia". */
const HARMONY_SCHEMES = [
  [0, 30, 60, 90, 120].map((d) => d - 60), // análoga ampla
  [0, 150, 210, 0, 180], // complementar dividida
  [0, 120, 240, 0, 120], // tríade
  [0, 90, 180, 270, 0], // tétrade (quadrado)
]

/** Gera `count` cores para o modo pedido, mantendo as posições travadas. */
export function generatePalette(
  mode: HarmonyMode,
  current: string[],
  locked: boolean[],
  count = 5,
): string[] {
  const anchorIndex = locked.findIndex(Boolean)
  const base: HSL =
    anchorIndex >= 0
      ? hexToHsl(current[anchorIndex])
      : { h: rand(0, 360), s: rand(45, 85), l: rand(35, 65) }

  const scheme = HARMONY_SCHEMES[Math.floor(Math.random() * HARMONY_SCHEMES.length)]
  const harmonySat = rand(45, 75)
  const harmonyLights = [22, 38, 55, 70, 86].sort(() => Math.random() - 0.5)

  const fresh: string[] = Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : i / (count - 1)
    switch (mode) {
      case 'harmonia': {
        const offsets = scheme[i % scheme.length]
        // saturação coesa e luminosidade em degraus, embaralhada para não ficar em gradiente
        return hslToHex({ h: base.h + offsets, s: harmonySat + rand(-6, 6), l: harmonyLights[i % harmonyLights.length] })
      }
      case 'analoga':
        return hslToHex({ h: base.h - 40 + 80 * t, s: base.s + rand(-10, 10), l: 25 + 50 * t })
      case 'complementar': {
        const h = i % 2 === 0 ? base.h : base.h + 180
        return hslToHex({ h: h + rand(-8, 8), s: base.s + rand(-15, 10), l: 22 + 56 * t })
      }
      case 'monocromatica':
        return hslToHex({ h: base.h, s: base.s + rand(-10, 10), l: 15 + 70 * t })
      case 'triade':
        return hslToHex({ h: base.h + 120 * (i % 3), s: base.s + rand(-10, 10), l: 30 + 45 * t })
      default:
        return randomHex()
    }
  })

  return fresh.map((hex, i) => (locked[i] ? current[i] : hex))
}

/** Escala de tons (escuro → claro) da cor, como no painel "Tons". */
export function shades(hex: string, steps = 9): string[] {
  const { h, s } = hexToHsl(hex)
  return Array.from({ length: steps }, (_, i) => hslToHex({ h, s, l: 12 + (78 * i) / (steps - 1) }))
}
