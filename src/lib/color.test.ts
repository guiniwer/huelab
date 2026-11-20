import { describe, expect, it } from 'vitest'
import {
  colorName,
  contrastRatio,
  generatePalette,
  hexToHsl,
  hexToRgb,
  hslToHex,
  hueFamily,
  mixHex,
  mixIn,
  normalizeHex,
  paletteFamilies,
  prefersDarkText,
  rgbToHex,
  shades,
  wcagLevel,
} from './color'

describe('normalizeHex', () => {
  it('aceita com/sem #, 3 ou 6 dígitos, e devolve maiúsculo', () => {
    expect(normalizeHex('fff')).toBe('#FFFFFF')
    expect(normalizeHex('#1a2B3c')).toBe('#1A2B3C')
    expect(normalizeHex('  #abc ')).toBe('#AABBCC')
  })
  it('rejeita entradas inválidas', () => {
    for (const bad of ['', '#12', '#12345', 'xyzxyz', '#1234567']) expect(normalizeHex(bad)).toBeNull()
  })
})

describe('conversões', () => {
  it('hex ↔ rgb ida e volta', () => {
    expect(hexToRgb('#FF8000')).toEqual({ r: 255, g: 128, b: 0 })
    expect(rgbToHex({ r: 255, g: 128, b: 0 })).toBe('#FF8000')
  })
  it('hex ↔ hsl ida e volta preserva a cor', () => {
    for (const hex of ['#274754', '#E8C468', '#000000', '#FFFFFF', '#808080', '#FF006E']) {
      expect(hslToHex(hexToHsl(hex))).toBe(hex)
    }
  })
  it('valores conhecidos de hsl', () => {
    expect(hexToHsl('#FF0000')).toMatchObject({ h: 0, s: 100, l: 50 })
    expect(hexToHsl('#0000FF').h).toBeCloseTo(240)
  })
})

describe('contraste (WCAG)', () => {
  it('preto × branco = 21:1 e cor × ela mesma = 1:1', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
    expect(contrastRatio('#3A86FF', '#3A86FF')).toBeCloseTo(1, 5)
  })
  it('é simétrico', () => {
    expect(contrastRatio('#141A34', '#F6F2EE')).toBeCloseTo(contrastRatio('#F6F2EE', '#141A34'), 10)
  })
  it('bate com os valores do Figma (#141A34)', () => {
    expect(contrastRatio('#141A34', '#FFFFFF')).toBeCloseTo(17.11, 1)
    expect(contrastRatio('#141A34', '#000000')).toBeCloseTo(1.23, 1)
  })
  it('#767676 é o cinza mais claro que passa AA no branco', () => {
    expect(contrastRatio('#767676', '#FFFFFF')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio('#777777', '#FFFFFF')).toBeLessThan(4.5)
  })
  it('níveis', () => {
    expect(wcagLevel(7)).toBe('AAA')
    expect(wcagLevel(4.5)).toBe('AA')
    expect(wcagLevel(3)).toBe('AA Grande')
    expect(wcagLevel(2.99)).toBe('Reprovado')
  })
  it('prefersDarkText escolhe o texto mais legível', () => {
    expect(prefersDarkText('#FFFF00')).toBe(true)
    expect(prefersDarkText('#141A34')).toBe(false)
  })
})

describe('nomes e famílias', () => {
  it('nomes do design', () => {
    expect(colorName('#274754')).toBe('ciano escuro')
    expect(colorName('#141A34')).toBe('azul escuro')
    expect(colorName('#000000')).toBe('preto')
  })
  it('famílias de matiz', () => {
    expect(hueFamily('#E5383B')).toBe('vermelho')
    expect(hueFamily('#3A86FF')).toBe('azul')
    expect(hueFamily('#808080')).toBe('neutro')
  })
  it('paleta pastel e escura', () => {
    expect(paletteFamilies(['#FEC5E5', '#F9D5E5', '#E0BBE4', '#C9E4DE', '#C6DEF1']).has('pastel')).toBe(true)
    expect(paletteFamilies(['#081C15', '#1B4332', '#2D6A4F', '#40916C', '#74C69D']).has('escuro')).toBe(true)
  })
})

describe('misturas', () => {
  it('mixHex e mixIn respeitam os extremos', () => {
    for (const space of ['srgb', 'oklab', 'oklch'] as const) {
      expect(mixIn(space, '#FF006E', '#3A86FF', 0)).toBe('#FF006E')
      expect(mixIn(space, '#FF006E', '#3A86FF', 1)).toBe('#3A86FF')
    }
    expect(mixHex('#000000', '#FFFFFF', 0.5)).toBe('#808080')
  })
  it('OKLab não passa pelo cinza entre azul e amarelo como o sRGB', () => {
    const sat = (hex: string) => hexToHsl(hex).s
    expect(sat(mixIn('oklch', '#0000FF', '#FFFF00', 0.5))).toBeGreaterThan(sat(mixIn('srgb', '#0000FF', '#FFFF00', 0.5)))
  })
})

describe('gerador', () => {
  it('mantém as cores travadas em todos os modos', () => {
    const current = ['#111111', '#222222', '#333333', '#444444', '#555555']
    const locked = [true, false, true, false, false]
    for (const mode of ['harmonia', 'aleatoria', 'analoga', 'complementar', 'monocromatica', 'triade'] as const) {
      const out = generatePalette(mode, current, locked)
      expect(out).toHaveLength(5)
      expect(out[0]).toBe('#111111')
      expect(out[2]).toBe('#333333')
      out.forEach((c) => expect(normalizeHex(c)).toBe(c))
    }
  })
  it('shades vai do escuro ao claro', () => {
    const t = shades('#3A86FF')
    expect(t).toHaveLength(9)
    expect(hexToHsl(t[0]).l).toBeLessThan(hexToHsl(t[8]).l)
  })
})
