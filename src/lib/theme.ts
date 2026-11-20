import { useEffect } from 'react'
import { useLocalStorage } from './storage'

export type Theme = 'claro' | 'escuro'

const systemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'

/** Tema claro/escuro salvo no navegador (começa pelo tema do sistema). */
export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('huelab:tema', systemTheme())
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'escuro')
  }, [theme])
  return { theme, toggle: () => setTheme(theme === 'escuro' ? 'claro' : 'escuro') }
}
