import { describe, expect, it } from 'vitest'
import { hexToRgb, contrastRatio } from './color'
import { mergeBackup, makeBackup, parseBackup } from './backup'
import { simulate, VISION_MATRIX } from './colorblind'
import { extractColors } from './extract'
import { paletteToGradient, parseDegradeParams, degradePath } from './share'

/** Monta pixels RGBA com `n` repetições de cada cor. */
function pixels(spec: [string, number][]) {
  const out: number[] = []
  for (const [hex, n] of spec) {
    const { r, g, b } = hexToRgb(hex)
    for (let i = 0; i < n; i++) out.push(r, g, b, 255)
  }
  return new Uint8ClampedArray(out)
}

describe('extractColors', () => {
  it('acha as cores de uma imagem com blocos sólidos, do escuro ao claro', () => {
    const img = pixels([
      ['#FFFFFF', 400],
      ['#E63946', 300],
      ['#1D3557', 300],
      ['#2A9D8F', 200],
      ['#F4A261', 200],
    ])
    const out = extractColors(img, 5)
    expect([...out].sort()).toEqual(['#1D3557', '#2A9D8F', '#E63946', '#F4A261', '#FFFFFF'])
    expect(out[0]).toBe('#1D3557') // mais escura primeiro
    expect(out[4]).toBe('#FFFFFF') // mais clara por último
  })
  it('separa cores próximas mas distintas (amarelo × laranja)', () => {
    const img = pixels([
      ['#264653', 300],
      ['#2A9D8F', 300],
      ['#E9C46A', 300],
      ['#F4A261', 300],
      ['#E76F51', 350],
      ['#8FA7A0', 3], // pixels de borda/antialias não viram cor
    ])
    const out = extractColors(img, 5)
    expect(out).toHaveLength(5)
    const near = (a: string, b: string) => {
      const [x, y] = [hexToRgb(a), hexToRgb(b)]
      return Math.max(Math.abs(x.r - y.r), Math.abs(x.g - y.g), Math.abs(x.b - y.b)) <= 6
    }
    for (const want of ['#264653', '#2A9D8F', '#E76F51', '#E9C46A', '#F4A261']) {
      expect(out.some((c) => near(c, want)), want).toBe(true)
    }
  })
  it('agrupa variações próximas e ignora pixels transparentes', () => {
    const img = pixels([
      ['#FF0000', 100],
      ['#FE0101', 100],
      ['#0000FF', 200],
    ])
    const transparent = new Uint8ClampedArray([0, 255, 0, 0, 0, 255, 0, 0])
    const all = new Uint8ClampedArray([...img, ...transparent])
    const out = extractColors(all, 2)
    expect(out).toHaveLength(2)
    expect(out.some((c) => c.startsWith('#FF') || c.startsWith('#FE'))).toBe(true)
    expect(out).not.toContain('#00FF00')
  })
  it('não inventa cores quando a imagem tem menos que o pedido', () => {
    expect(extractColors(pixels([['#123456', 50]]), 5)).toEqual(['#123456'])
    expect(extractColors(new Uint8ClampedArray(), 5)).toEqual([])
  })
})

describe('simulação de daltonismo', () => {
  it('preserva branco, preto e cinzas', () => {
    for (const v of Object.keys(VISION_MATRIX) as (keyof typeof VISION_MATRIX)[]) {
      expect(simulate('#FFFFFF', v)).toBe('#FFFFFF')
      expect(simulate('#000000', v)).toBe('#000000')
    }
  })
  it('vermelho e verde ficam quase iguais na deuteranopia', () => {
    const normal = contrastRatio('#D62828', '#2A9D3F')
    const deut = contrastRatio(simulate('#D62828', 'deuteranopia'), simulate('#2A9D3F', 'deuteranopia'))
    expect(deut).toBeLessThan(normal)
  })
  it('acromatopsia gera cinza', () => {
    const { r, g, b } = hexToRgb(simulate('#3A86FF', 'acromatopsia'))
    expect(r).toBe(g)
    expect(g).toBe(b)
  })
})

describe('backup', () => {
  const pal = { id: 'p1', name: 'Uma', colors: ['#000000', '#FFFFFF'], createdAt: 1 }
  it('ida e volta', () => {
    const text = JSON.stringify(makeBackup({ paletas: [pal], degrades: [], favoritos: ['oceano'] }))
    expect(parseBackup(text)).toEqual({ paletas: [pal], degrades: [], favoritos: ['oceano'] })
  })
  it('recusa arquivos que não são do HueLab', () => {
    expect(() => parseBackup('oi')).toThrow('JSON')
    expect(() => parseBackup('{"paletas":[]}')).toThrow('HueLab')
  })
  it('descarta itens inválidos', () => {
    const text = JSON.stringify({ app: 'huelab', paletas: [pal, { id: 'x', name: 'ruim', colors: ['#zz'] }], favoritos: [1, 'a'] })
    const data = parseBackup(text)
    expect(data.paletas).toHaveLength(1)
    expect(data.favoritos).toEqual(['a'])
  })
  it('junta sem duplicar', () => {
    const cur = { paletas: [pal], degrades: [], favoritos: ['a'] }
    const inc = { paletas: [pal, { ...pal, id: 'p2', createdAt: 2 }], degrades: [], favoritos: ['a', 'b'] }
    const { data, added } = mergeBackup(cur, inc)
    expect(added).toBe(2)
    expect(data.paletas.map((p) => p.id)).toEqual(['p2', 'p1'])
    expect(data.favoritos).toEqual(['a', 'b'])
  })
})

describe('paleta → degradê', () => {
  it('distribui as cores por igual e o link abre igual', () => {
    const g = paletteToGradient(['#111111', '#222222', '#333333'])
    expect(g.stops.map((s) => s.position)).toEqual([0, 50, 100])
    expect(parseDegradeParams(degradePath(g).split('?')[1])).toEqual(g)
  })
})
