/*
 * Recherche intelligente d'élèves
 *  - insensible aux accents et aux majuscules (« kabore » trouve « KABORÉ »)
 *  - plusieurs mots, dans n'importe quel ordre (« awa ouedraogo » = « OUEDRAOGO Awa »)
 *  - cherche aussi dans le matricule
 *  - classe les meilleurs résultats d'abord (mot exact > début de mot > fragment)
 *  - tolère les fautes de frappe quand rien ne correspond (« ouedrago » → « OUEDRAOGO »)
 */
import { norm } from './calc.js'

const wordsOf = s => norm(s).split(/[^a-z0-9]+/).filter(Boolean)
export const tokensOf = q => wordsOf(q)

// distance de Levenshtein, abandonnée dès qu'elle dépasse `max`
function lev(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let min = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (cur[j] < min) min = cur[j]
    }
    if (min > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

function tokenScore(token, words, fuzzy) {
  let best = 0
  for (const w of words) {
    if (w === token) best = Math.max(best, 4)
    else if (w.startsWith(token)) best = Math.max(best, 3)
    else if (token.length >= 3 && w.includes(token)) best = Math.max(best, 2)
    else if (fuzzy && token.length >= 4) {
      const max = token.length >= 7 ? 2 : 1
      if (lev(token, w, max) <= max || lev(token, w.slice(0, token.length), max) <= max) best = Math.max(best, 1)
    }
  }
  return best
}

// Renvoie { items, fuzzy, active } : `fuzzy` = résultats approchants (fautes de frappe)
export function smartFilter(items, query, getText) {
  const tokens = tokensOf(query)
  if (!tokens.length) return { items, fuzzy: false, active: false }
  const run = fuzzy => items
    .map((it, i) => {
      const words = wordsOf(getText(it)); let s = 0
      for (const t of tokens) { const v = tokenScore(t, words, fuzzy); if (!v) return { it, i, s: 0 }; s += v }
      return { it, i, s }
    })
    .filter(x => x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i).map(x => x.it)
  const exact = run(false)
  if (exact.length) return { items: exact, fuzzy: false, active: true }
  const approx = run(true)
  return { items: approx, fuzzy: approx.length > 0, active: true }
}

// Découpe un texte en morceaux « trouvé / non trouvé » pour le surlignage (accents ignorés)
export function highlightParts(text, query) {
  const tokens = tokensOf(query)
  if (!tokens.length) return [{ t: text, hit: false }]
  const chars = Array.from(text)
  let flat = ''; const map = []
  chars.forEach((ch, idx) => { for (const c of norm(ch).replace(/[^a-z0-9 ]/g, ' ')) { flat += c; map.push(idx) } })
  const mark = new Array(chars.length).fill(false)
  for (const tok of tokens) {
    for (let k = flat.indexOf(tok); k !== -1; k = flat.indexOf(tok, k + 1)) for (let n = 0; n < tok.length; n++) mark[map[k + n]] = true
  }
  const parts = []
  chars.forEach((ch, i) => {
    const last = parts[parts.length - 1]
    if (last && last.hit === mark[i]) last.t += ch; else parts.push({ t: ch, hit: mark[i] })
  })
  return parts
}
