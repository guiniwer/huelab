import { normalizeHex } from './color'
import type { SavedGradient, SavedPalette } from './storage'

export const KEYS = { paletas: 'huelab:paletas', degrades: 'huelab:degrades', favoritos: 'huelab:favoritos' } as const

export type Backup = {
  app: 'huelab'
  versao: 1
  exportadoEm: string
  paletas: SavedPalette[]
  degrades: SavedGradient[]
  favoritos: string[]
}

export type BackupData = Pick<Backup, 'paletas' | 'degrades' | 'favoritos'>

export function makeBackup(data: BackupData): Backup {
  return { app: 'huelab', versao: 1, exportadoEm: new Date().toISOString(), ...data }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const validColors = (v: unknown) => Array.isArray(v) && v.length >= 2 && v.every((c) => typeof c === 'string' && normalizeHex(c))

/** Valida um arquivo de backup; lança erro com mensagem amigável se não for do HueLab. */
export function parseBackup(text: string): BackupData {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('O arquivo não é um JSON válido')
  }
  if (!isObj(raw) || raw.app !== 'huelab') throw new Error('Esse arquivo não é um backup do HueLab')

  const paletas = (Array.isArray(raw.paletas) ? raw.paletas : [])
    .filter((p): p is SavedPalette => isObj(p) && typeof p.id === 'string' && typeof p.name === 'string' && validColors(p.colors))
    .map((p) => ({ ...p, colors: p.colors.map((c) => normalizeHex(c)!), createdAt: Number(p.createdAt) || Date.now() }))

  const degrades = (Array.isArray(raw.degrades) ? raw.degrades : []).filter(
    (g): g is SavedGradient =>
      isObj(g) &&
      typeof g.id === 'string' &&
      typeof g.name === 'string' &&
      Array.isArray(g.stops) &&
      g.stops.length >= 2 &&
      g.stops.every((s) => isObj(s) && typeof s.color === 'string' && normalizeHex(s.color) && typeof s.position === 'number'),
  )

  const favoritos = (Array.isArray(raw.favoritos) ? raw.favoritos : []).filter((f): f is string => typeof f === 'string')
  return { paletas, degrades, favoritos }
}

/** Junta o backup com o que já existe, sem duplicar (por id). */
export function mergeBackup(current: BackupData, incoming: BackupData) {
  const newPal = incoming.paletas.filter((p) => !current.paletas.some((c) => c.id === p.id))
  const newGrad = incoming.degrades.filter((g) => !current.degrades.some((c) => c.id === g.id))
  const newFav = incoming.favoritos.filter((f) => !current.favoritos.includes(f))
  return {
    data: {
      paletas: [...current.paletas, ...newPal].sort((a, b) => b.createdAt - a.createdAt),
      degrades: [...current.degrades, ...newGrad],
      favoritos: [...current.favoritos, ...newFav],
    },
    added: newPal.length + newGrad.length + newFav.length,
  }
}
