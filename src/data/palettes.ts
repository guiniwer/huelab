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
  {
    id: 'cerrado', name: 'Cerrado',
    colors: ['#7F5539', '#9C6644', '#B08968', '#DDB892', '#E6CCB2'], accent: '#9C6644',
  },
  {
    id: 'acai', name: 'Açaí',
    colors: ['#2B0A3D', '#4A1A6B', '#7B2CBF', '#C77DFF', '#E0AAFF'], accent: '#7B2CBF',
  },
  {
    id: 'praia', name: 'Praia',
    colors: ['#F7EDE2', '#F5CAC3', '#84A59D', '#F28482', '#F6BD60'], accent: '#F28482',
  },
  {
    id: 'menta', name: 'Menta',
    colors: ['#DAFFEF', '#B8F2E6', '#7DDFC3', '#3DCCC7', '#1A7F72'], accent: '#1A7F72',
  },
  {
    id: 'vinho', name: 'Vinho',
    colors: ['#2D0A12', '#5C1A24', '#8E2C3B', '#C25B6A', '#F2C4CE'], accent: '#8E2C3B',
  },
  {
    id: 'aurora-boreal', name: 'Aurora Boreal',
    colors: ['#0B132B', '#1C2541', '#3A506B', '#5BC0BE', '#6FFFE9'], accent: '#3A506B',
  },
  {
    id: 'girassol', name: 'Girassol',
    colors: ['#3D2B1F', '#7A5C1E', '#E9B10B', '#F7D560', '#FFF3C4'], accent: '#7A5C1E',
  },
  {
    id: 'algodao-doce', name: 'Algodão Doce',
    colors: ['#FEC5E5', '#F9D5E5', '#E0BBE4', '#C9E4DE', '#C6DEF1'], accent: '#D291BC',
  },
  {
    id: 'floresta-noturna', name: 'Floresta Noturna',
    colors: ['#081C15', '#1B4332', '#2D6A4F', '#40916C', '#74C69D'], accent: '#2D6A4F',
  },
  {
    id: 'retro-80', name: 'Retrô 80',
    colors: ['#F72585', '#B5179E', '#560BAD', '#3F37C9', '#4CC9F0'], accent: '#B5179E',
  },
  {
    id: 'argila', name: 'Argila',
    colors: ['#582F0E', '#7F4F24', '#936639', '#A68A64', '#C2C5AA'], accent: '#7F4F24',
  },
  {
    id: 'nordico', name: 'Nórdico',
    colors: ['#2E3440', '#4C566A', '#88C0D0', '#D8DEE9', '#ECEFF4'], accent: '#4C566A',
  },
  {
    id: 'frutas-vermelhas', name: 'Frutas Vermelhas',
    colors: ['#590D22', '#A4133C', '#FF4D6D', '#FF8FA3', '#FFCCD5'], accent: '#A4133C',
  },
  {
    id: 'lagoa', name: 'Lagoa',
    colors: ['#E9F5DB', '#B5C99A', '#87986A', '#4F6D7A', '#2A3D45'], accent: '#4F6D7A',
  },
  {
    id: 'carnaval', name: 'Carnaval',
    colors: ['#FFD000', '#FF6B00', '#E5007E', '#00A6ED', '#7FB800'], accent: '#E5007E',
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
  {
    name: 'Ipê',
    angle: 160,
    stops: [
      { color: '#F9C74F', position: 0 },
      { color: '#F9844A', position: 50 },
      { color: '#F94144', position: 100 },
    ],
  },
  {
    name: 'Noite Estrelada',
    angle: 180,
    stops: [
      { color: '#0F0C29', position: 0 },
      { color: '#302B63', position: 55 },
      { color: '#24243E', position: 100 },
    ],
  },
  {
    name: 'Limonada',
    angle: 120,
    stops: [
      { color: '#D4FC79', position: 0 },
      { color: '#96E6A1', position: 100 },
    ],
  },
  {
    name: 'Algodão Doce',
    angle: 135,
    stops: [
      { color: '#FBC2EB', position: 0 },
      { color: '#A6C1EE', position: 100 },
    ],
  },
  {
    name: 'Neon',
    angle: 90,
    stops: [
      { color: '#F72585', position: 0 },
      { color: '#7209B7', position: 50 },
      { color: '#4CC9F0', position: 100 },
    ],
  },
  {
    name: 'Floresta',
    angle: 145,
    stops: [
      { color: '#134E5E', position: 0 },
      { color: '#71B280', position: 100 },
    ],
  },
  {
    name: 'Brasa',
    angle: 45,
    stops: [
      { color: '#370617', position: 0 },
      { color: '#9D0208', position: 40 },
      { color: '#F48C06', position: 100 },
    ],
  },
  {
    name: 'Céu de Inverno',
    angle: 180,
    stops: [
      { color: '#E0EAFC', position: 0 },
      { color: '#CFDEF3', position: 100 },
    ],
  },
  {
    name: 'Holográfico',
    angle: 120,
    stops: [
      { color: '#A1C4FD', position: 0 },
      { color: '#C2E9FB', position: 30 },
      { color: '#FBC2EB', position: 65 },
      { color: '#FDDB92', position: 100 },
    ],
  },
  {
    name: 'Café',
    angle: 135,
    stops: [
      { color: '#3E2723', position: 0 },
      { color: '#8D6E63', position: 60 },
      { color: '#D7CCC8', position: 100 },
    ],
  },
]
