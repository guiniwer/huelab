import { createContext, useCallback, useContext } from 'react'

export const ToastContext = createContext<(message: string) => void>(() => {})

export const useToast = () => useContext(ToastContext)

/** Copia texto para a área de transferência e avisa com um toast. */
export function useCopy() {
  const toast = useToast()
  return useCallback(
    async (text: string, label = 'Copiado!') => {
      try {
        await navigator.clipboard.writeText(text)
        toast(`${label} ${text.length <= 9 ? text : ''}`.trim())
      } catch {
        toast('Não foi possível copiar')
      }
    },
    [toast],
  )
}
