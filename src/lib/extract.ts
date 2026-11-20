import { hexToOklab, oklabToHex, rgbToHex, type Lab } from './color'

/**
 * Extrai as cores dominantes de pixels RGBA com k-means no espaço OKLab
 * (distâncias mais próximas da percepção humana). Determinístico: mesma imagem, mesma paleta.
 */
export function extractColors(pixels: Uint8ClampedArray, count = 5): string[] {
  // 1. histograma: agrupa pixels quase iguais (5 bits por canal) e guarda quantos são
  const bins = new Map<number, { r: number; g: number; b: number; n: number }>()
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue // ignora áreas transparentes
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)
    const bin = bins.get(key)
    if (bin) {
      bin.r += r
      bin.g += g
      bin.b += b
      bin.n++
    } else bins.set(key, { r, g, b, n: 1 })
  }
  if (bins.size === 0) return []

  const points: Lab[] = []
  const weights: number[] = []
  for (const { r, g, b, n } of bins.values()) {
    points.push(hexToOklab(rgbToHex({ r: r / n, g: g / n, b: b / n })))
    weights.push(n)
  }
  const total = weights.reduce((a, b) => a + b, 0)
  const dist = (p: Lab, q: Lab) => (p.L - q.L) ** 2 + (p.a - q.a) ** 2 + (p.b - q.b) ** 2

  // 2. centros iniciais: a cor mais frequente, depois a que maximiza frequência × distância
  //    (escolhe cores dominantes E diferentes entre si, sem cair em pixels de borda)
  let first = 0
  weights.forEach((w, i) => w > weights[first] && (first = i))
  const centers: Lab[] = [points[first]]
  const nearest = points.map((p) => dist(p, centers[0]))
  while (centers.length < count) {
    let best = -1
    let bestScore = 0
    nearest.forEach((d, i) => {
      const score = d * weights[i]
      if (d > 4e-4 && score > bestScore) {
        bestScore = score
        best = i
      }
    })
    if (best < 0) break // imagem com menos cores distintas que o pedido
    centers.push(points[best])
    points.forEach((p, i) => (nearest[i] = Math.min(nearest[i], dist(p, points[best]))))
  }

  // 3. k-means ponderado
  const assign = new Int32Array(points.length).fill(-1)
  let sizes: number[] = centers.map(() => 0)
  for (let iter = 0; iter < 20; iter++) {
    let moved = 0
    points.forEach((p, i) => {
      let best = 0
      for (let c = 1; c < centers.length; c++) if (dist(p, centers[c]) < dist(p, centers[best])) best = c
      if (assign[i] !== best) moved++
      assign[i] = best
    })
    const sum = centers.map(() => ({ L: 0, a: 0, b: 0, n: 0 }))
    points.forEach((p, i) => {
      const s = sum[assign[i]]
      const w = weights[i]
      s.L += p.L * w
      s.a += p.a * w
      s.b += p.b * w
      s.n += w
    })
    sizes = sum.map((s) => s.n)
    sum.forEach((s, c) => s.n && (centers[c] = { L: s.L / s.n, a: s.a / s.n, b: s.b / s.n }))
    if (moved === 0) break
  }

  // 4. descarta grupos minúsculos (ruído) e ordena do escuro ao claro
  return centers
    .map((c, i) => ({ c, n: sizes[i] }))
    .filter(({ n }) => n / total > 0.01)
    .sort((x, y) => x.c.L - y.c.L)
    .map(({ c }) => oklabToHex(c))
    .filter((hex, i, arr) => arr.indexOf(hex) === i)
}

/** Lê um arquivo de imagem e devolve os pixels reduzidos (no máx. 120px de lado). */
export async function imagePixels(file: Blob): Promise<{ pixels: Uint8ClampedArray; url: string }> {
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.src = url
  await img.decode()
  const scale = Math.min(1, 120 / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, w, h)
  return { pixels: ctx.getImageData(0, 0, w, h).data, url }
}
