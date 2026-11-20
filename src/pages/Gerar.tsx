import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useCopy } from '../components/toast-context'
import { colorName, generatePalette, prefersDarkText, type HarmonyMode } from '../lib/color'

const MODES: { id: HarmonyMode; label: string }[] = [
  { id: 'harmonia', label: 'Harmonia' },
  { id: 'aleatoria', label: 'Aleatória' },
  { id: 'analoga', label: 'Análoga' },
  { id: 'complementar', label: 'Complementar' },
  { id: 'monocromatica', label: 'Monocromática' },
  { id: 'triade', label: 'Tríade' },
]

const INITIAL = ['#274754', '#2A9D90', '#E8C468', '#F4A462', '#E76E50']

export default function Gerar() {
  const [mode, setMode] = useState<HarmonyMode>('analoga')
  const [colors, setColors] = useState(INITIAL)
  const [locked, setLocked] = useState<boolean[]>(() => INITIAL.map(() => false))
  const copy = useCopy()

  const regenerate = useCallback(
    (nextMode = mode) => setColors((current) => generatePalette(nextMode, current, locked)),
    [mode, locked],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.code !== 'Space' || target.closest('input, textarea, button, a, [role=dialog]')) return
      e.preventDefault()
      regenerate()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [regenerate])

  const chooseMode = (m: HarmonyMode) => {
    setMode(m)
    regenerate(m)
  }

  const montarHref = `/montar?cores=${colors.map((c) => c.slice(1)).join('-')}`

  return (
    <main className="flex min-h-[calc(100vh-97px)] flex-col">
      <div className="flex flex-wrap items-center gap-[14px] px-4 py-[46px] sm:px-[53px]">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => chooseMode(m.id)}
            aria-pressed={mode === m.id}
            className={`h-[47px] w-[140px] rounded-[20px] border border-brick text-base shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:bg-brick-soft/50 ${
              mode === m.id ? 'bg-brick-soft' : 'bg-white'
            }`}
          >
            {m.label}
          </button>
        ))}
        <Link to={montarHref} className="ml-auto text-sm text-brick underline-offset-4 hover:underline">
          Editar no Montar →
        </Link>
      </div>

      <div className="relative flex min-h-[560px] flex-1 flex-col sm:flex-row">
        <button
          type="button"
          onClick={() => regenerate()}
          className="absolute top-[19px] left-1/2 z-10 flex h-[56px] -translate-x-1/2 items-center gap-2 rounded-[20px] border border-brick bg-[rgba(252,252,252,0.5)] px-[28px] text-base whitespace-nowrap shadow-[0_4px_4px_rgba(0,0,0,0.25)] backdrop-blur-sm"
        >
          Aperte
          <kbd className="rounded-[20px] border border-brick px-[30px] py-[2px] font-ui shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
            Espaço
          </kbd>
          para gerar
        </button>

        {colors.map((hex, i) => {
          const dark = prefersDarkText(hex)
          const fg = dark ? 'text-black' : 'text-white'
          const sub = dark ? 'text-[#2b2b2b]' : 'text-[#cfcfcf]'
          const btn = `grid h-[38px] w-[42px] place-items-center rounded-[10px] border transition ${
            dark ? 'border-black/20 hover:bg-black/10' : 'border-white/20 hover:bg-white/10'
          }`
          return (
            <section
              key={i}
              className={`flex flex-1 flex-col items-center justify-end gap-3 pt-24 pb-11 transition-colors duration-300 ${fg}`}
              style={{ background: hex }}
            >
              <div className="flex gap-[13px]">
                <button
                  type="button"
                  className={`${btn} ${locked[i] ? (dark ? 'bg-black/15' : 'bg-white/20') : ''}`}
                  onClick={() => setLocked((l) => l.map((v, j) => (j === i ? !v : v)))}
                  aria-pressed={locked[i]}
                  aria-label={locked[i] ? `Destravar ${hex}` : `Travar ${hex}`}
                  title={locked[i] ? 'Travada' : 'Travar cor'}
                >
                  <Icon name="lock" className={locked[i] ? 'opacity-100' : 'opacity-60'} />
                </button>
                <button type="button" className={btn} onClick={() => copy(hex)} aria-label={`Copiar ${hex}`}>
                  <Icon name="copy" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => copy(hex)}
                className="mt-2 font-body text-[28px] font-semibold tracking-[0.1em] lg:text-[36px]"
              >
                {hex}
              </button>
              <span className={`font-body text-base tracking-[0.1em] ${sub}`}>{colorName(hex)}</span>
            </section>
          )
        })}
      </div>
    </main>
  )
}
