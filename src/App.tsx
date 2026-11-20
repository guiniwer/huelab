import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { ToastProvider } from './components/Toast'
import Degrade from './pages/Degrade'
import Gerar from './pages/Gerar'
import Home from './pages/Home'
import Montar from './pages/Montar'
import { parseDegradeParams } from './lib/share'
import type { SavedGradient } from './lib/storage'

/** Remonta o Montar quando a URL muda (ex.: abrir outra paleta em /montar?cores=...). */
function MontarRoute() {
  const { search } = useLocation()
  return <Montar key={search} />
}

/** Abre um degradê vindo do painel Salvos (state) ou de um link compartilhado (?cores=...). */
function DegradeRoute() {
  const location = useLocation()
  const initial =
    (location.state as { gradient?: SavedGradient } | null)?.gradient ?? parseDegradeParams(location.search) ?? undefined
  return <Degrade key={initial ? location.key : 'degrade'} initial={initial} />
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gerar" element={<Gerar />} />
          <Route path="/montar" element={<MontarRoute />} />
          <Route path="/degrade" element={<DegradeRoute />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
