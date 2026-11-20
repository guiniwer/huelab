import { useState } from 'react'
import { contrastRatio, wcagLevel, type WcagLevel } from '../lib/color'

const BADGE: Record<WcagLevel, string> = {
  AAA: 'bg-[#1F7A35] text-on-dark',
  AA: 'bg-[#50B736] text-on-light',
  'AA Grande': 'bg-[#E8C468] text-on-light',
  Reprovado: 'bg-black/10 text-black/50',
}

/**
 * Grade texto × fundo: mostra quais pares da paleta dão para usar como texto legível.
 * Linhas = cor de fundo; colunas = cor do texto.
 */
export function ContrastMap({ colors }: { colors: string[] }) {
  const [onlyPassing, setOnlyPassing] = useState(false)
  const passing = colors.flatMap((bg, r) => colors.filter((fg, c) => r !== c && contrastRatio(bg, fg) >= 4.5)).length

  return (
    <section className="mt-[42px] rounded-[20px] border border-black/30 px-[25px] pt-[23px] pb-[28px] sm:px-[40px]">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-heading text-[20px] font-bold tracking-[0.1em]">Mapa de contraste</h2>
          <p className="mt-1 font-body text-[13px] tracking-[0.05em] text-black/60">
            Quais cores servem de texto sobre quais fundos · {passing} combinações passam no AA
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyPassing}
            onChange={(e) => setOnlyPassing(e.target.checked)}
            className="size-4 accent-black"
          />
          Destacar só as que passam
        </label>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="border-separate border-spacing-1.5 text-center">
          <thead>
            <tr>
              <th className="px-2 text-left text-[11px] font-normal text-black/50">
                fundo ↓ · texto →
              </th>
              {colors.map((c, i) => (
                <th key={i} className="pb-1">
                  <span className="mx-auto block h-3 w-12 rounded-full border border-black/10" style={{ background: c }} />
                  <span className="mt-1 block font-body text-[10px] font-medium tracking-[0.05em] text-black/60">{c}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {colors.map((bg, r) => (
              <tr key={r}>
                <th className="pr-2 text-left">
                  <span className="flex items-center gap-2 font-body text-[10px] font-medium tracking-[0.05em] text-black/60">
                    <span className="size-3 shrink-0 rounded-full border border-black/10" style={{ background: bg }} />
                    {bg}
                  </span>
                </th>
                {colors.map((fg, c) => {
                  if (r === c) {
                    return (
                      <td key={c} className="h-[66px] w-[78px] rounded-[10px] bg-black/[0.03] text-black/20">
                        —
                      </td>
                    )
                  }
                  const ratio = contrastRatio(bg, fg)
                  const level = wcagLevel(ratio)
                  const dim = onlyPassing && ratio < 4.5
                  return (
                    <td
                      key={c}
                      title={`Texto ${fg} sobre ${bg}: ${ratio.toFixed(2)}:1 (${level})`}
                      className={`h-[66px] w-[78px] rounded-[10px] border border-black/5 transition-opacity ${dim ? 'opacity-15' : ''}`}
                      style={{ background: bg }}
                    >
                      <span className="block font-heading text-[20px] leading-none font-bold" style={{ color: fg }}>
                        Aa
                      </span>
                      <span className={`mt-1.5 inline-block rounded-full px-1.5 py-px text-[9px] font-semibold ${BADGE[level]}`}>
                        {level === 'Reprovado' ? ratio.toFixed(1) : level}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-black/50">
        AAA ≥ 7:1 · AA ≥ 4,5:1 (texto normal) · AA Grande ≥ 3:1 (só títulos grandes)
      </p>
    </section>
  )
}
