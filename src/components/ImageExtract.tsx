import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { prefersDarkText } from '../lib/color'
import { extractColors, imagePixels } from '../lib/extract'
import { useToast } from './toast-context'

type Props = { open: boolean; onClose: () => void; onUse: (colors: string[]) => void }

/** Diálogo: envie (ou cole/arraste) uma imagem e use as cores principais como paleta. */
export function ImageExtract({ open, onClose, onUse }: Props) {
  if (!open) return null
  return <Body onClose={onClose} onUse={onUse} />
}

function Body({ onClose, onUse }: Omit<Props, 'open'>) {
  const [image, setImage] = useState<{ url: string; pixels: Uint8ClampedArray } | null>(null)
  const [count, setCount] = useState(5)
  const [picked, setPicked] = useState<string[] | null>(null)
  const [over, setOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const toast = useToast()

  const auto = image ? extractColors(image.pixels, count) : []
  const colors = picked ?? auto

  const load = async (file: File | undefined | null) => {
    if (!file || !file.type.startsWith('image/')) {
      if (file) toast('Escolha um arquivo de imagem')
      return
    }
    try {
      const next = await imagePixels(file)
      setImage(next) // a URL anterior é liberada pelo efeito abaixo
      setPicked(null)
    } catch {
      toast('Não foi possível ler essa imagem')
    }
  }

  // Esc fecha; Ctrl+V cola uma imagem
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'))
      if (file) load(file)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('paste', onPaste)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('paste', onPaste)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose])

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url)
    },
    [image],
  )

  /** Clique na imagem: conta-gotas, troca a cor mais parecida pela clicada. */
  const pickAt = (e: MouseEvent<HTMLImageElement>) => {
    const img = imgRef.current
    if (!img || !image || colors.length === 0) return
    const rect = img.getBoundingClientRect()
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * img.naturalWidth)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * img.naturalHeight)
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data
    const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
    const dist = (c: string) => {
      const n = parseInt(c.slice(1), 16)
      return ((n >> 16) - r) ** 2 + (((n >> 8) & 255) - g) ** 2 + ((n & 255) - b) ** 2
    }
    const closest = colors.reduce((best, c, i) => (dist(c) < dist(colors[best]) ? i : best), 0)
    setPicked(colors.map((c, i) => (i === closest ? hex : c)))
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-on-light/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Extrair cores de uma imagem"
        className="relative flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-y-auto rounded-[20px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-[20px] font-bold tracking-[0.06em]">Extrair da imagem</h2>
            <p className="mt-1 text-sm text-black/55">
              Envie uma foto e o HueLab encontra as cores principais. Clique na imagem para trocar uma cor.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-9 shrink-0 place-items-center rounded-full text-xl transition hover:bg-black/5"
          >
            ×
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => load(e.target.files?.[0])}
        />

        {image ? (
          <img
            ref={imgRef}
            src={image.url}
            alt="Imagem enviada"
            onClick={pickAt}
            className="mt-5 max-h-[300px] w-full cursor-crosshair rounded-[12px] object-contain"
            style={{ background: 'repeating-conic-gradient(#0001 0 25%, transparent 0 50%) 0 0/16px 16px' }}
          />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(true)
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setOver(false)
              load(e.dataTransfer.files[0])
            }}
            className={`mt-5 flex h-[220px] w-full flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed transition ${
              over ? 'border-brick bg-brick-soft/30' : 'border-black/20 hover:border-black/40 hover:bg-black/[0.02]'
            }`}
          >
            <svg aria-hidden width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-icon">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="1.8" />
              <path d="m21 16-5-5-9 9" />
            </svg>
            <span className="font-medium">Arraste uma imagem ou clique para escolher</span>
            <span className="text-sm text-black/50">Também dá para colar com Ctrl+V</span>
          </button>
        )}

        {image && (
          <>
            <div className="mt-5 flex items-center justify-between gap-4">
              <span className="text-sm text-black/60">Quantidade de cores</span>
              <div className="flex gap-1">
                {[3, 4, 5, 6, 7, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={count === n}
                    onClick={() => {
                      setCount(n)
                      setPicked(null)
                    }}
                    className={`size-8 rounded-[8px] text-sm transition ${
                      count === n ? 'bg-black text-white' : 'hover:bg-black/5'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex h-[72px] overflow-hidden rounded-[12px]">
              {colors.map((c, i) => (
                <span
                  key={i}
                  className={`flex flex-1 items-end justify-center pb-2 font-body text-[11px] font-medium tracking-[0.05em] ${
                    prefersDarkText(c) ? 'text-on-light' : 'text-on-dark'
                  }`}
                  style={{ background: c }}
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="h-[43px] rounded-[10px] px-5 text-[15px] transition hover:bg-black/5"
              >
                Outra imagem
              </button>
              <button
                type="button"
                disabled={colors.length < 2}
                onClick={() => {
                  onUse(colors)
                  onClose()
                }}
                className="h-[43px] rounded-[10px] border border-brick bg-brick-strong px-6 text-[15px] font-medium shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:brightness-105 disabled:opacity-40"
              >
                Usar estas cores
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
