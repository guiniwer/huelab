import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import iconeUrl from '../assets/huelab-icone.png'
import { useSavedCount } from '../lib/storage'
import { Icon, type IconName } from './Icon'
import { SavedDrawer } from './SavedDrawer'

/**
 * Cada seção mantém o degradê do Figma. O texto usa um tom escuro da mesma família,
 * calculado para passar de 4,5:1 (WCAG AA) sobre o degradê e sobre o branco.
 */
const TABS: {
  to: string
  label: string
  icon: IconName
  gradient: string
  border: string
  text: string
  hover: string
}[] = [
  {
    to: '/',
    label: 'EXPLORAR',
    icon: 'explorar',
    gradient: 'linear-gradient(90deg, rgba(240,128,128,0.7), rgba(181,54,54,0.7))',
    border: 'rgba(172,74,74,0.35)',
    text: '#480F0F',
    hover: 'rgba(240,128,128,0.14)',
  },
  {
    to: '/gerar',
    label: 'GERAR',
    icon: 'gerar',
    gradient: 'linear-gradient(90deg, rgba(128,186,240,0.7), rgba(54,94,181,0.7))',
    border: 'rgba(74,134,172,0.35)',
    text: '#112550',
    hover: 'rgba(128,186,240,0.16)',
  },
  {
    to: '/montar',
    label: 'MONTAR',
    icon: 'montar',
    gradient: 'linear-gradient(90deg, rgba(147,240,128,0.7), rgba(54,181,156,0.7))',
    border: 'rgba(79,172,74,0.35)',
    text: '#125447',
    hover: 'rgba(147,240,128,0.18)',
  },
  {
    to: '/degrade',
    label: 'DEGRADÊ',
    icon: 'degrade',
    gradient: 'linear-gradient(90deg, rgba(240,214,128,0.7), rgba(181,133,54,0.7))',
    border: 'rgba(172,140,74,0.35)',
    text: '#543C12',
    hover: 'rgba(240,214,128,0.2)',
  },
]

const activeIndex = (pathname: string) => {
  const i = TABS.findIndex((t) => (t.to === '/' ? pathname === '/' : pathname.startsWith(t.to)))
  return i === -1 ? 0 : i
}

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || !!el.closest('input, textarea, select'))

/** Esconde o menu ao rolar para baixo e mostra de volta ao rolar para cima. */
function useScrollState() {
  const [state, setState] = useState({ scrolled: false, hidden: false })
  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY
      if (Math.abs(delta) < 6) return // ignora tremidinhas
      setState({ scrolled: y > 8, hidden: delta > 0 && y > 140 })
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return state
}

export function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const current = activeIndex(pathname)
  const savedCount = useSavedCount()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const { scrolled, hidden } = useScrollState()

  // Pílula colorida que desliza até a aba ativa
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)
  const [animate, setAnimate] = useState(false)

  useLayoutEffect(() => {
    const el = tabRefs.current[current]
    if (!el) return
    const measure = () => setPill({ left: el.offsetLeft, width: el.offsetWidth })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [current])

  // só anima depois da primeira medição, para a pílula não "voar" ao carregar a página
  useLayoutEffect(() => {
    if (pill && !animate) requestAnimationFrame(() => setAnimate(true))
  }, [pill, animate])

  // Atalhos 1–4 para trocar de tela
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target) || drawerOpen) return
      const i = Number(e.key) - 1
      if (i >= 0 && i < TABS.length) {
        e.preventDefault()
        navigate(TABS[i].to)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, drawerOpen])

  const isHidden = hidden && !drawerOpen

  return (
    <>
      {/* espaçador com a altura do menu no topo (36px + barra de 61px): o menu é fixo, então compactá-lo não mexe no layout */}
      <div aria-hidden className="h-[97px]" />
      <header
        className={`fixed inset-x-0 top-0 z-30 flex items-center gap-3 px-4 transition-[padding,transform,background-color,box-shadow] duration-300 sm:gap-6 sm:px-[53px] ${
          scrolled
            ? 'bg-white/75 py-3 shadow-[0_1px_0_rgba(0,0,0,0.06)] backdrop-blur-md'
            : 'bg-transparent pt-9 pb-0'
        } ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <Link to="/" aria-label="HueLab — início" className="shrink-0">
          <img src={iconeUrl} alt="HueLab" className="size-[52px] object-cover" />
        </Link>

        <nav
          aria-label="Principal"
          className="relative mx-auto flex w-full max-w-[857px] items-center justify-between gap-1 rounded-[15px] border-[1.5px] border-black/18 bg-white px-2 py-[9px] shadow-[0_4px_4px_rgba(0,0,0,0.25)] sm:gap-5 sm:px-3"
        >
          {pill && (
            <span
              aria-hidden
              className={`pointer-events-none absolute top-[9px] h-10 overflow-hidden rounded-[15px] border shadow-[0_4px_4px_rgba(0,0,0,0.21)] ${
                animate ? 'transition-[left,width,border-color] duration-[400ms] ease-[cubic-bezier(0.34,1.3,0.64,1)]' : ''
              }`}
              style={{ left: pill.left, width: pill.width, borderColor: TABS[current].border }}
            >
              {/* um degradê por seção, empilhados; troca com fade enquanto a pílula desliza */}
              {TABS.map((t, i) => (
                <span
                  key={t.to}
                  className="absolute inset-0 transition-opacity duration-[400ms]"
                  style={{ backgroundImage: t.gradient, opacity: i === current ? 1 : 0 }}
                />
              ))}
            </span>
          )}

          {TABS.map((tab, i) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              title={`${tab.label[0]}${tab.label.slice(1).toLowerCase()} · atalho ${i + 1}`}
              aria-keyshortcuts={String(i + 1)}
              className="group relative flex h-10 min-w-0 flex-1 items-center justify-center rounded-[15px] px-2 font-ui text-base font-semibold tracking-[0.02em] transition-colors sm:px-3 lg:text-[20px]"
              style={{ color: tab.text }}
            >
              {/* fundo leve só no hover das abas inativas */}
              {i !== current && (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-[15px] opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ background: tab.hover }}
                />
              )}
              <span
                className={`relative flex items-center gap-2 transition-opacity ${
                  i === current ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
                }`}
              >
                <Icon name={tab.icon} />
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label={`Salvos (${savedCount})`}
          title="Salvos"
          className="relative flex h-[52px] shrink-0 items-center gap-2 rounded-[15px] border-[1.5px] border-black/18 bg-white px-3 font-ui font-semibold text-[#5A1A1A] shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:bg-[#fdf1f1] lg:px-4"
        >
          <Icon name={savedCount ? 'heartFill' : 'heart'} className="text-[#A62222]" />
          <span className="hidden lg:inline">Salvos</span>
          {savedCount > 0 && (
            <span className="absolute -top-2 -right-2 grid h-5 min-w-5 place-items-center rounded-full bg-[#A62222] px-1 text-[11px] font-bold text-white lg:static lg:h-auto lg:min-w-0 lg:bg-transparent lg:px-0 lg:text-[15px] lg:font-semibold lg:text-[#5A1A1A]/60">
              {savedCount}
            </span>
          )}
        </button>
      </header>

      <SavedDrawer open={drawerOpen} onClose={closeDrawer} />
    </>
  )
}
