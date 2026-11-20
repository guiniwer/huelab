import { Component, type ReactNode } from 'react'

/** Se algo quebrar numa tela, mostra um aviso em vez da página toda em branco. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="mx-auto max-w-[560px] px-4 py-24 text-center">
        <h1 className="font-heading text-[26px] font-bold tracking-[0.06em]">Algo deu errado nesta tela</h1>
        <p className="mt-3 text-black/60">Seus salvos estão seguros. Tente recarregar a página.</p>
        <pre className="mt-4 overflow-x-auto rounded-[10px] bg-black/5 p-3 text-left text-xs text-black/60">
          {this.state.error.message}
        </pre>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 h-[43px] rounded-[10px] border border-brick bg-brick-strong px-6 font-medium"
        >
          Recarregar
        </button>
      </main>
    )
  }
}
