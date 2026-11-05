/* Calculs scolaires (fonctions pures, sans dépendance à l'interface)
 * Une « classe » ici = { id, name, access, matieres:[{id,n,c,teacherId,teacherName}],
 *                        eleves:[{id,n,matricule,obs,notes:{[tr]:[[d1,d2,c] par matière]}}] } */
export const CL = ['6è', '5è', '4è', '3è', '2nd A', '2nd C', '1ère A', '1ère C', '1ère D', 'Tle A', 'Tle C', 'Tle D']
export const TR = ['1er trimestre', '2e trimestre', '3e trimestre']
export const ANNUAL = 3
export const PERIODS = [...TR, 'Année complète']

/* ---------- Nombres ---------- */
export const num = v => { const x = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(x) ? NaN : x }
export const validNote = v => v === '' || (!isNaN(num(v)) && num(v) >= 0 && num(v) <= 20)
export const f = (x, d = 2) => x === null || x === undefined || isNaN(x) ? '—' : x.toFixed(d).replace('.', ',')
export const fn = x => { const v = num(x); return isNaN(v) ? '—' : f(v) }
export const rk = r => r === null || r === undefined ? '—' : r === 1 ? '1er' : r + 'e'
const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null
export const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/* ---------- Notes ---------- */
export const getN = (e, tr, j) => e.notes?.[tr]?.[j] || ['', '', '']
export const hasNote = (e, tr, j) => getN(e, tr, j).some(x => !isNaN(num(x)))
// Pénalités de points (vie scolaire) : retirées à la moyenne de la matière, ou à la moyenne générale
export const getPen = (e, tr, j) => e.pen?.[tr]?.m?.[j] || 0
export const getGenPen = (e, tr) => e.pen?.[tr]?.g || 0
export function moyMatRaw(e, tr, j) {
  return mean(getN(e, tr, j).map(num).filter(x => !isNaN(x)))
}
export function moyMat(e, tr, j) {
  const raw = moyMatRaw(e, tr, j)
  return raw === null ? null : Math.max(0, raw - getPen(e, tr, j))
}
export function moyMatAnnual(e, j) {
  return mean([0, 1, 2].map(t => moyMat(e, t, j)).filter(x => x !== null))
}
export function moyGen(e, tr, matieres) {
  let s = 0, k = 0
  matieres.forEach((m, j) => { const v = moyMat(e, tr, j); if (v !== null) { s += v * m.c; k += m.c } })
  return k ? Math.max(0, s / k - getGenPen(e, tr)) : null
}

/* ---------- Classement ---------- */
function rankList(list) {
  const R = list.filter(o => o.moy !== null).sort((a, b) => b.moy - a.moy)
  list.forEach(o => { o.rang = o.moy === null ? null : 1 + R.filter(r => r.moy > o.moy + 1e-9).length })
  const t = R.length
  return {
    list, tot: t, cm: t ? mean(R.map(r => r.moy)) : null,
    max: t ? R[0].moy : null, min: t ? R[t - 1].moy : null,
    pass: R.filter(r => r.moy >= 10).length,
  }
}
const calcTrim = (classe, tr) => rankList(classe.eleves.map(e => ({ e, moy: moyGen(e, tr, classe.matieres) })))
function calcAnnual(classe) {
  return rankList(classe.eleves.map(e => {
    const t = [0, 1, 2].map(tr => moyGen(e, tr, classe.matieres))
    const p = t.filter(x => x !== null)
    return { e, t, n: p.length, moy: mean(p) }
  }))
}
export const calc = (classe, tr) => tr === ANNUAL ? calcAnnual(classe) : calcTrim(classe, tr)

export function rangMat(classe, tr, j, v) {
  let n = 0, t = 0
  classe.eleves.forEach(e => { const x = moyMat(e, tr, j); if (x !== null) { t++; if (x > v + 1e-9) n++ } })
  return `${rk(n + 1)}/${t}`
}

/* ---------- Notes manquantes ---------- */
const periods = tr => tr === ANNUAL ? [0, 1, 2] : [tr]
// Matières pour lesquelles au moins un élève n'a aucune note (avec l'enseignant concerné)
export function missingMatieres(classe, tr) {
  const total = classe.eleves.length
  if (!total) return []
  return classe.matieres
    .map((m, j) => ({ matiere: m, filled: classe.eleves.filter(e => periods(tr).some(t => hasNote(e, t, j))).length, total }))
    .filter(x => x.filled < x.total)
}
// Matières sans note pour UN élève (=> bulletin provisoire)
export function missingFor(e, classe, tr) {
  return classe.matieres.filter((m, j) => !periods(tr).some(t => hasNote(e, t, j)))
}
// Part des (élève × matière) renseignés
export function completion(classe, tr) {
  const total = classe.eleves.length * classe.matieres.length
  if (!total) return { done: 0, total: 0, pct: 0 }
  let done = 0
  classe.eleves.forEach(e => classe.matieres.forEach((_, j) => { if (periods(tr).some(t => hasNote(e, t, j))) done++ }))
  return { done, total, pct: Math.round(done / total * 100) }
}

/* ---------- Appréciations ---------- */
export const appr = m => m === null || m === undefined || isNaN(m) ? '' : m < 7 ? 'Faible' : m < 10 ? 'Insuffisant' : m < 12 ? 'Passable' : m < 14 ? 'Assez-Bien' : m < 16 ? 'Bien' : m < 18 ? 'Très-Bien' : 'Excellent'
export const mention = m => m === null || m === undefined ? '' : m >= 16 ? 'Félicitations' : m >= 14 ? 'Encouragements' : m >= 12 ? 'Tableau d’honneur' : ''
export const decision = m => m === null || m === undefined ? '' : m >= 10 ? 'Admis(e)' : 'Non admis(e)'
export const tone = m => m === null || m === undefined ? '' : m < 10 ? 'bad' : m < 14 ? 'mid' : 'good'

/* ---------- Statistiques ---------- */
const BINS = [[0, 6], [6, 8], [8, 10], [10, 12], [12, 14], [14, 16], [16, 20.01]]
export function distribution(list) {
  return BINS.map(([a, b]) => ({
    label: a === 16 ? '16+' : `${a}-${b}`, low: b <= 10,
    n: list.filter(o => o.moy !== null && o.moy >= a && o.moy < b).length,
  }))
}

/* ---------- Vie scolaire (retards, absences, comportement, pénalités, sanctions) ---------- */
export function vieStats(e, period) {
  const list = (e.inc || []).filter(i => period === ANNUAL || i.tr === period).sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  const of = t => list.filter(i => i.type === t)
  const sum = (arr, k) => arr.reduce((a, i) => a + (i[k] || 0), 0)
  return {
    list,
    retards: of('retard').length, retardMinutes: sum(of('retard'), 'minutes'),
    absences: of('absence').length, absenceHours: sum(of('absence'), 'hours'),
    absenceJustified: sum(of('absence').filter(i => i.justified), 'hours'),
    comportements: of('comportement').length,
    penaltyPoints: sum(of('penalite'), 'points'),
    sanctions: of('sanction'),
  }
}
