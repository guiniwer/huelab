import { useCallback, useSyncExternalStore } from 'react'
import type { GradientConfig, GradientStop } from './gradient'

/*
 * Store compartilhado em cima do localStorage: todos os componentes que usam a mesma
 * chave veem a mesma lista e atualizam juntos (e outras abas do navegador também).
 */
const cache = new Map<string, unknown>()
const listeners = new Map<string, Set<() => void>>()

function read<T>(key: string, initial: T): T {
  if (!cache.has(key)) {
    try {
      const raw = localStorage.getItem(key)
      cache.set(key, raw ? (JSON.parse(raw) as T) : initial)
    } catch {
      cache.set(key, initial) // storage bloqueado: fica só em memória
    }
  }
  return cache.get(key) as T
}

function write<T>(key: string, value: T) {
  cache.set(key, value)
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage indisponível: mantém só em memória */
  }
  listeners.get(key)?.forEach((fn) => fn())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key || !listeners.has(e.key)) return
    cache.delete(e.key)
    listeners.get(e.key)?.forEach((fn) => fn())
  })
}

/** useState que persiste no localStorage e fica sincronizado entre componentes. */
export function useLocalStorage<T>(key: string, initial: T) {
  const subscribe = useCallback(
    (fn: () => void) => {
      if (!listeners.has(key)) listeners.set(key, new Set())
      listeners.get(key)!.add(fn)
      return () => listeners.get(key)!.delete(fn)
    },
    [key],
  )
  const value = useSyncExternalStore(subscribe, () => read(key, initial))
  const setValue = useCallback(
    (next: T | ((prev: T) => T)) =>
      write(key, typeof next === 'function' ? (next as (prev: T) => T)(read(key, initial)) : next),
    // `initial` só é usado na primeira leitura
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )
  return [value, setValue] as const
}

export type SavedPalette = { id: string; name: string; colors: string[]; createdAt: number }

export function useSavedPalettes() {
  const [palettes, setPalettes] = useLocalStorage<SavedPalette[]>('huelab:paletas', [])

  const save = useCallback(
    (colors: string[], name?: string) =>
      setPalettes((list) => [
        { id: crypto.randomUUID(), name: name ?? `Minha paleta ${list.length + 1}`, colors, createdAt: Date.now() },
        ...list,
      ]),
    [setPalettes],
  )

  const remove = useCallback(
    (id: string) => setPalettes((list) => list.filter((p) => p.id !== id)),
    [setPalettes],
  )

  return { palettes, save, remove }
}

export type SavedGradient = Omit<GradientConfig, 'stops'> & {
  id: string
  name: string
  stops: Omit<GradientStop, 'id'>[]
}

export function useSavedGradients() {
  const [gradients, setGradients] = useLocalStorage<SavedGradient[]>('huelab:degrades', [])

  const save = useCallback(
    ({ stops, ...config }: GradientConfig) =>
      setGradients((list) => [
        ...list,
        {
          ...config,
          id: crypto.randomUUID(),
          name: `Meu degradê ${list.length + 1}`,
          stops: stops.map(({ color, position }) => ({ color, position })),
        },
      ]),
    [setGradients],
  )

  const remove = useCallback(
    (id: string) => setGradients((list) => list.filter((g) => g.id !== id)),
    [setGradients],
  )

  return { gradients, save, remove }
}

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<string[]>('huelab:favoritos', [])
  const toggle = useCallback(
    (id: string) =>
      setFavorites((list) => (list.includes(id) ? list.filter((f) => f !== id) : [...list, id])),
    [setFavorites],
  )
  return { favorites, toggle, isFavorite: (id: string) => favorites.includes(id) }
}

/** Total de itens salvos (favoritos + paletas + degradês), para o contador do menu. */
export function useSavedCount() {
  const { favorites } = useFavorites()
  const { palettes } = useSavedPalettes()
  const { gradients } = useSavedGradients()
  return favorites.length + palettes.length + gradients.length
}
