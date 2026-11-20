import { describe, expect, it } from 'vitest'
import { buildGradient, originToCss, toTailwind, type GradientConfig } from './gradient'
import { exportPalette, parseDegradeParams } from './share'

const base: GradientConfig = {
  type: 'linear',
  angle: 135,
  interp: 'srgb',
  shape: 'circle',
  origin: { x: 50, y: 50 },
  stops: [
    { id: 'b', color: '#3A86FF', position: 100 },
    { id: 'a', color: '#FF006E', position: 0 },
  ],
}

describe('buildGradient', () => {
  it('linear ordena as paradas e omite o espaço sRGB', () => {
    expect(buildGradient(base)).toBe('linear-gradient(135deg, #FF006E 0%, #3A86FF 100%)')
  })
  it('inclui o espaço de cor', () => {
    expect(buildGradient({ ...base, interp: 'oklab' })).toBe('linear-gradient(135deg in oklab, #FF006E 0%, #3A86FF 100%)')
  })
  it('radial com formato e origem', () => {
    expect(buildGradient({ ...base, type: 'radial', shape: 'ellipse', origin: { x: 0, y: 0 } })).toBe(
      'radial-gradient(ellipse at top left, #FF006E 0%, #3A86FF 100%)',
    )
  })
  it('cônico com ângulo inicial', () => {
    expect(buildGradient({ ...base, type: 'conico', interp: 'oklch' })).toBe(
      'conic-gradient(from 135deg in oklch, #FF006E 0%, #3A86FF 100%)',
    )
  })
})

describe('originToCss', () => {
  it('usa palavras-chave para os 9 pontos', () => {
    expect(originToCss({ x: 50, y: 50 })).toBe('center')
    expect(originToCss({ x: 100, y: 0 })).toBe('top right')
    expect(originToCss({ x: 50, y: 100 })).toBe('bottom')
    expect(originToCss({ x: 30, y: 70 })).toBe('30% 70%')
  })
})

describe('toTailwind', () => {
  it('troca espaços por _ e tira espaços após vírgula', () => {
    expect(toTailwind('linear-gradient(135deg in oklab, #FF006E 0%, #3A86FF 100%)')).toBe(
      'bg-[linear-gradient(135deg_in_oklab,#FF006E_0%,#3A86FF_100%)]',
    )
  })
})

describe('links de degradê', () => {
  it('lê um link completo', () => {
    const g = parseDegradeParams('?tipo=radial&ang=90&tr=oklch&forma=ellipse&origem=0,100&cores=FF006E.0-3A86FF.100')
    expect(g).toEqual({
      type: 'radial',
      angle: 90,
      interp: 'oklch',
      shape: 'ellipse',
      origin: { x: 0, y: 100 },
      stops: [
        { color: '#FF006E', position: 0 },
        { color: '#3A86FF', position: 100 },
      ],
    })
  })
  it('usa padrões seguros para valores inválidos', () => {
    const g = parseDegradeParams('?tipo=xpto&ang=abc&tr=hsl&cores=FF006E.0-zzz.50-3A86FF.250')!
    expect(g.type).toBe('linear')
    expect(g.angle).toBe(135)
    expect(g.interp).toBe('oklab')
    expect(g.stops).toEqual([
      { color: '#FF006E', position: 0 },
      { color: '#3A86FF', position: 100 },
    ])
  })
  it('recusa links com menos de 2 cores', () => {
    expect(parseDegradeParams('?cores=FF006E.0')).toBeNull()
    expect(parseDegradeParams('')).toBeNull()
  })
})

describe('exportPalette', () => {
  const colors = ['#141A34', '#E8C468']
  it('CSS, SCSS e Tailwind', () => {
    expect(exportPalette(colors, 'css')).toBe(':root {\n  --cor-1: #141A34;\n  --cor-2: #E8C468;\n}')
    expect(exportPalette(colors, 'scss')).toBe('$cor-1: #141A34;\n$cor-2: #E8C468;')
    expect(exportPalette(colors, 'tailwind')).toContain('--color-paleta-2: #E8C468;')
  })
  it('JSON válido com nomes', () => {
    expect(JSON.parse(exportPalette(colors, 'json'))[0]).toEqual({ hex: '#141A34', nome: 'azul escuro' })
  })
})
