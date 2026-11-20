import { feMatrix, VISIONS, type Vision } from '../lib/colorblind'

/** Filtros SVG (escondidos) usados via `filter: url(#hl-vision-...)`. */
export function VisionFilters() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      {VISIONS.filter((v) => v.id !== 'normal').map((v) => (
        <filter key={v.id} id={`hl-vision-${v.id}`} colorInterpolationFilters="linearRGB">
          <feColorMatrix type="matrix" values={feMatrix(v.id)} />
        </filter>
      ))}
    </svg>
  )
}

/** Seletor "Ver como": simula como a paleta aparece para pessoas daltônicas. */
export function VisionSelect({ value, onChange }: { value: Vision; onChange: (v: Vision) => void }) {
  return (
    <div role="radiogroup" aria-label="Simular daltonismo" className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-sm text-black/55">Ver como:</span>
      {VISIONS.map((v) => (
        <button
          key={v.id}
          type="button"
          role="radio"
          aria-checked={value === v.id}
          title={v.hint}
          onClick={() => onChange(v.id)}
          className={`h-8 rounded-full border px-3 text-[13px] transition ${
            value === v.id ? 'border-black bg-black text-white' : 'border-black/15 hover:border-black/40'
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}
