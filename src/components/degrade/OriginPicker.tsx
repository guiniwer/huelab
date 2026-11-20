import type { Origin } from '../../lib/gradient'

const POINTS = [0, 50, 100]
const NAMES_Y: Record<number, string> = { 0: 'topo', 50: 'meio', 100: 'base' }
const NAMES_X: Record<number, string> = { 0: 'esquerda', 50: 'centro', 100: 'direita' }

/** Grade 3×3 para escolher de onde o radial/cônico nasce. */
export function OriginPicker({ value, onChange }: { value: Origin; onChange: (o: Origin) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="Origem"
      className="grid size-[84px] grid-cols-3 grid-rows-3 rounded-[10px] bg-segment p-1.5 shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
    >
      {POINTS.map((y) =>
        POINTS.map((x) => {
          const active = value.x === x && value.y === y
          return (
            <button
              key={`${x}-${y}`}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${NAMES_Y[y]} ${NAMES_X[x]}`}
              title={`${NAMES_Y[y]} · ${NAMES_X[x]}`}
              onClick={() => onChange({ x, y })}
              className="group grid place-items-center"
            >
              <span
                className={`rounded-full transition-all ${
                  active ? 'size-3.5 bg-black' : 'size-2 bg-black/30 group-hover:size-2.5 group-hover:bg-black/60'
                }`}
              />
            </button>
          )
        }),
      )}
    </div>
  )
}
