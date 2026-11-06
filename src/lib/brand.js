// Personnalisation visuelle d’un établissement
export const DEFAULT_BRAND = '#0b2a5e'   // bleu marine EDVIA
export const PALETTES = [
  { n: 'Bleu EDVIA', c: '#0b2a5e' },
  { n: 'Bleu royal', c: '#1d4ed8' },
  { n: 'Vert', c: '#0f7a4f' },
  { n: 'Turquoise', c: '#0f766e' },
  { n: 'Bordeaux', c: '#9f1239' },
  { n: 'Violet', c: '#6d28d9' },
  { n: 'Indigo', c: '#4338ca' },
  { n: 'Ardoise', c: '#334155' },
]

const toRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const toHex = a => '#' + a.map(x => Math.round(x).toString(16).padStart(2, '0')).join('')
function lum(rgb) {
  const [r, g, b] = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
// Garantit un texte blanc lisible : assombrit les couleurs trop claires
export function safeBrand(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return DEFAULT_BRAND
  let rgb = toRGB(hex)
  for (let i = 0; i < 30 && lum(rgb) > 0.2; i++) rgb = rgb.map(v => v * 0.92)
  return toHex(rgb)
}

// Applique la couleur de l'établissement PARTOUT : variables CSS (interface, bulletins, PDF), barre du navigateur
// (theme-color) et barre d'état Android. Renvoie la couleur réellement utilisée (assombrie si elle est trop claire).
export function applyBrand(hex) {
  const b = safeBrand(hex)
  document.documentElement.style.setProperty('--brand', b)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', b)
  import('../native').then(n => n.setNativeBrand(b)).catch(() => {})
  return b
}
export const isPalette = hex => PALETTES.some(p => p.c === String(hex || '').toLowerCase())
