import { fromLinear, hexToRgb, rgbToHex, toLinear } from './color'

export type Vision = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'acromatopsia'

export const VISIONS: { id: Vision; label: string; hint: string }[] = [
  { id: 'normal', label: 'Normal', hint: 'Visão típica' },
  { id: 'protanopia', label: 'Protanopia', hint: 'Sem cones vermelhos (~1% dos homens)' },
  { id: 'deuteranopia', label: 'Deuteranopia', hint: 'Sem cones verdes (o tipo mais comum)' },
  { id: 'tritanopia', label: 'Tritanopia', hint: 'Sem cones azuis (raro)' },
  { id: 'acromatopsia', label: 'Acromatopsia', hint: 'Só tons de cinza' },
]

/** Matrizes 3×3 em RGB linear (Machado, Oliveira & Fernandes 2009, severidade 1.0). */
export const VISION_MATRIX: Record<Vision, number[]> = {
  normal: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  protanopia: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritanopia: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
  acromatopsia: [0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722],
}

/** Como uma cor é vista com cada tipo de daltonismo. */
export function simulate(hex: string, vision: Vision): string {
  if (vision === 'normal') return hex
  const { r, g, b } = hexToRgb(hex)
  const v = [toLinear(r), toLinear(g), toLinear(b)]
  const m = VISION_MATRIX[vision]
  const out = [0, 1, 2].map((row) => m[row * 3] * v[0] + m[row * 3 + 1] * v[1] + m[row * 3 + 2] * v[2])
  return rgbToHex({ r: fromLinear(out[0]), g: fromLinear(out[1]), b: fromLinear(out[2]) })
}

/** Valores para <feColorMatrix type="matrix"> (4×5), aplicado em linearRGB. */
export const feMatrix = (vision: Vision) => {
  const m = VISION_MATRIX[vision]
  return `${m[0]} ${m[1]} ${m[2]} 0 0  ${m[3]} ${m[4]} ${m[5]} 0 0  ${m[6]} ${m[7]} ${m[8]} 0 0  0 0 0 1 0`
}

/** Valor de `filter` CSS para simular a visão (usa os filtros de <VisionFilters />). */
export const visionFilter = (v: Vision) => (v === 'normal' ? undefined : `url(#hl-vision-${v})`)
