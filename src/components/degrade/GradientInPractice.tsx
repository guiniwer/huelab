import { prefersDarkText } from '../../lib/color'
import { sortStops, type GradientStop } from '../../lib/gradient'

/** Mostra o degradê aplicado em um botão, num título e na borda de um card. */
export function GradientInPractice({ gradient, stops }: { gradient: string; stops: GradientStop[] }) {
  const sorted = sortStops(stops)
  const middle = sorted[Math.floor(sorted.length / 2)].color
  const buttonText = prefersDarkText(middle) ? '#000' : '#fff'

  return (
    <section className="mt-[42px] rounded-[20px] border border-black/30 px-[25px] pt-[23px] pb-[28px] sm:px-[40px]">
      <h2 className="font-heading text-[20px] font-bold tracking-[0.1em]">Na prática</h2>
      <div className="mt-5 grid items-center gap-8 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-start gap-4">
          <span
            className="rounded-[12px] px-[23px] py-[11px] font-heading text-[13px] font-bold tracking-[0.1em] shadow-[0_4px_4px_rgba(0,0,0,0.2)]"
            style={{ background: gradient, color: buttonText }}
          >
            Começar Agora
          </span>
          <span className="rounded-[20px] p-[2px]" style={{ background: gradient }}>
            <span className="block rounded-[18px] bg-white px-5 py-[7px] font-heading text-[13px] font-semibold tracking-[0.1em]">
              Saiba mais
            </span>
          </span>
        </div>

        <div className="rounded-[16px] p-[3px]" style={{ background: gradient }}>
          <div className="rounded-[13px] bg-white px-6 py-5">
            <p
              className="bg-clip-text font-card text-[24px] leading-tight tracking-[0.05em] text-transparent"
              style={{ backgroundImage: gradient }}
            >
              Seu próximo projeto começa pela cor
            </p>
            <p className="mt-3 font-heading text-[13px] font-semibold tracking-[0.1em] text-black/60">
              Um exemplo de título, botão e borda usando o seu degradê
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
