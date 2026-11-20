import type { GradientStop } from '../lib/gradient'

export type Palette = { id: string; name: string; colors: string[]; accent: string }

/** Paletas "Populares" da tela inicial (cores tiradas do Figma). */
export const POPULAR_PALETTES: Palette[] = [
  {
    id: 'cotton-sky',
    name: 'Cotton Sky',
    colors: ['#CDB4DB', '#FFC8DD', '#FFAFCC', '#BDE0FE', '#A2D2FF'],
    accent: '#CDB4DB',
  },
  {
    id: 'choco-bloom',
    name: 'Choco Bloom',
    colors: ['#593833', '#D88180', '#F7B1B0', '#CAD182', '#FFFBCC'],
    accent: '#D88180',
  },
  {
    id: 'strawberry-milk',
    name: 'Strawberry Milk',
    colors: ['#FFE5EC', '#FFC2D1', '#FFB3C6', '#FF8FAB', '#FB6F92'],
    accent: '#FB6F92',
  },
  {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    colors: ['#E5D9F2', '#F5EFFF', '#CDC1FF', '#A594F9', '#7371FC'],
    accent: '#A594F9',
  },
  {
    id: 'mata-atlantica',
    name: 'Mata Atlântica',
    colors: ['#1B3A2F', '#2F5D50', '#6B8F71', '#A3B18A', '#DAD7CD'],
    accent: '#6B8F71',
  },
  {
    id: 'terracota',
    name: 'Terracota',
    colors: ['#6C382C', '#7D4C3B', '#B57551', '#DE8F64', '#E8B091'],
    accent: '#B57551',
  },
  {
    id: 'oceano',
    name: 'Oceano',
    colors: ['#03045E', '#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8'],
    accent: '#0077B6',
  },
  {
    id: 'por-do-sol',
    name: 'Pôr do Sol',
    colors: ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'],
    accent: '#E76F51',
  },
  {
    id: 'tropical',
    name: 'Tropical',
    colors: ['#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93'],
    accent: '#1982C4',
  },
  {
    id: 'cafe-com-leite',
    name: 'Café com Leite',
    colors: ['#3E2723', '#6D4C41', '#A1887F', '#D7CCC8', '#EFEBE9'],
    accent: '#6D4C41',
  },
  {
    id: 'neon-noturno',
    name: 'Neon Noturno',
    colors: ['#0B0C10', '#3A0CA3', '#7209B7', '#F72585', '#4CC9F0'],
    accent: '#7209B7',
  },
  {
    id: 'pistache',
    name: 'Pistache',
    colors: ['#F1F7ED', '#D3E4CD', '#ADC2A9', '#99A799', '#596E5C'],
    accent: '#596E5C',
  },
  {
    id: 'pessego',
    name: 'Pêssego',
    colors: ['#FFF1E6', '#FDE2E4', '#FAD2E1', '#FFB4A2', '#E5989B'],
    accent: '#E5989B',
  },
  {
    id: 'grafite',
    name: 'Grafite',
    colors: ['#212529', '#495057', '#ADB5BD', '#DEE2E6', '#F8F9FA'],
    accent: '#495057',
  },
  {
    id: 'citrico',
    name: 'Cítrico',
    colors: ['#FFBE0B', '#FB5607', '#FF006E', '#8338EC', '#3A86FF'],
    accent: '#FB5607',
  },
]

/** As duas paletas decorativas do hero. */
export const HERO_PALETTES = {
  forest: ['#1B3A2F', '#2F5D50', '#6B8F71', '#A3B18A', '#DAD7CD'],
  terracotta: ['#6C382C', '#7D4C3B', '#B57551', '#DE8F64', '#E8B091'],
}

export type GradientPreset = { name: string; angle: number; stops: Omit<GradientStop, 'id'>[] }

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    name: 'Frevo',
    angle: 135,
    stops: [
      { color: '#FF006E', position: 0 },
      { color: '#8338EC', position: 50 },
      { color: '#3A86FF', position: 100 },
    ],
  },
  {
    name: 'Pôr do Sol',
    angle: 135,
    stops: [
      { color: '#FB9B2C', position: 0 },
      { color: '#F46235', position: 50 },
      { color: '#BF3C30', position: 100 },
    ],
  },
  {
    name: 'Maré',
    angle: 135,
    stops: [
      { color: '#84DBED', position: 0 },
      { color: '#01B5D9', position: 50 },
      { color: '#014D90', position: 100 },
    ],
  },
  {
    name: 'Aurora',
    angle: 135,
    stops: [
      { color: '#204051', position: 0 },
      { color: '#38757E', position: 50 },
      { color: '#68EBDB', position: 100 },
    ],
  },
  {
    name: 'Pêssego',
    angle: 90,
    stops: [
      { color: '#E0B2D5', position: 0 },
      { color: '#FEEFDD', position: 44 },
      { color: '#FEEFDD', position: 58 },
      { color: '#EFB3D1', position: 100 },
    ],
  },
]
