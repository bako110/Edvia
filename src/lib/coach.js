/*
 * Assistant pédagogique : repère les élèves en difficulté et propose des pistes d'accompagnement.
 * Analyse à base de règles transparentes (moyennes, évolution entre trimestres, matières faibles, assiduité,
 * comportement) : aucune donnée ne quitte l'appareil, et chaque alerte indique la raison qui la déclenche.
 */
import { ANNUAL, TR, hasNote, moyGen, moyMat, vieStats, calc, f } from './calc'

const avg = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null)

// Dernier trimestre pour lequel au moins une note existe dans la classe
export function currentPeriod(classe) {
  for (const t of [2, 1, 0]) if (classe.eleves.some(e => classe.matieres.some((_, j) => hasNote(e, t, j)))) return t
  return null
}

export const LEVELS = {
  haut: { label: 'Priorité', cls: 'ko' }, moyen: { label: 'À suivre', cls: 'gold' },
  faible: { label: 'Stable', cls: 'ok' }, excellent: { label: 'Excellent', cls: 'ok' },
}

export function analyseEleve(e, classe, tr, ranking) {
  const mats = classe.matieres
  const moys = [0, 1, 2].map(t => moyGen(e, t, mats))
  const moy = moys[tr]
  const before = tr > 0 ? moys.slice(0, tr).filter(x => x !== null).pop() ?? null : null
  const trend = moy !== null && before !== null ? moy - before : null

  const subjects = mats.map((m, j) => ({ n: m.n, coef: m.c, moy: moyMat(e, tr, j) })).filter(s => s.moy !== null)
  const weak = subjects.filter(s => s.moy < 10).sort((a, b) => a.moy - b.moy)
  const strong = subjects.filter(s => s.moy >= 14).sort((a, b) => b.moy - a.moy)
  const missing = mats.filter((_, j) => !hasNote(e, tr, j)).map(m => m.n)

  const v = vieStats(e, ANNUAL)
  const unjustified = Math.max(0, v.absenceHours - v.absenceJustified)
  const rang = ranking?.list.find(o => o.e === e)?.rang ?? null

  // score de risque : chaque règle ajoute des points, et on garde la raison
  let score = 0
  const flags = []
  const add = (pts, text) => { score += pts; flags.push(text) }
  if (moy !== null) {
    if (moy < 8) add(3, `Moyenne très faible : ${f(moy)}/20`)
    else if (moy < 10) add(2, `Moyenne sous 10 : ${f(moy)}/20`)
    else if (moy < 12) add(1, `Moyenne juste passable : ${f(moy)}/20`)
  }
  if (trend !== null) {
    if (trend <= -1.5) add(2, `Forte baisse : ${f(trend)} point depuis le trimestre précédent`)
    else if (trend <= -0.5) add(1, `En baisse : ${f(trend)} point depuis le trimestre précédent`)
  }
  if (weak.length >= 3) add(2, `${weak.length} matières sous 10`)
  else if (weak.length >= 1) add(1, `${weak.length} matière${weak.length > 1 ? 's' : ''} sous 10`)
  if (unjustified >= 10) add(2, `${unjustified} h d’absence non justifiées`)
  else if (unjustified >= 4) add(1, `${unjustified} h d’absence non justifiées`)
  if (v.retards >= 5) add(1, `${v.retards} retards`)
  if (v.comportements >= 3) add(1, `${v.comportements} incidents de comportement`)
  if (v.sanctions.length) add(1, `${v.sanctions.length} sanction${v.sanctions.length > 1 ? 's' : ''}`)

  const level = moy === null ? null : score >= 5 ? 'haut' : score >= 3 ? 'moyen' : moy >= 14 && score === 0 ? 'excellent' : 'faible'

  // pistes d'accompagnement, ciblées sur les constats
  const advice = []
  if (weak.length) advice.push(`Soutien ciblé en ${weak.slice(0, 3).map(s => s.n).join(', ')} : séances de remise à niveau et exercices corrigés chaque semaine.`)
  if (trend !== null && trend <= -0.5) advice.push('Entretien avec l’élève pour comprendre la baisse (difficultés personnelles, rythme de travail, motivation).')
  if (unjustified >= 4 || v.retards >= 5) advice.push('Rencontrer la famille au sujet de l’assiduité et de la ponctualité ; demander les justificatifs d’absence.')
  if (v.comportements >= 3 || v.sanctions.length) advice.push('Suivi de comportement avec le professeur principal : objectifs précis et point hebdomadaire.')
  if (moy !== null && moy < 10 && !weak.length) advice.push('Aucune matière très faible mais une moyenne d’ensemble basse : travailler la méthode et la régularité.')
  if (strong.length && (level === 'haut' || level === 'moyen')) advice.push(`S’appuyer sur ses points forts (${strong.slice(0, 2).map(s => s.n).join(', ')}) pour redonner confiance.`)
  if (level === 'excellent') advice.push('Proposer des exercices d’approfondissement ou le tutorat d’un camarade.')
  if (missing.length) advice.push(`Notes manquantes en ${missing.join(', ')} : l’analyse sera plus fiable une fois saisies.`)
  if (!advice.length && moy !== null) advice.push('Aucune alerte : poursuivre l’encouragement et le suivi habituel.')

  return { moy, moys, rang, trend, weak, strong, missing, absences: unjustified, retards: v.retards, score, level, flags, advice }
}

// Modèle de message au parent (les variables {parent} {eleve} sont remplies à l'envoi)
export function parentDraft(a, tr) {
  const lignes = [`Bonjour {parent}, nous faisons le point sur {eleve} (${TR[tr]}).`]
  if (a.moy !== null) lignes.push(`Sa moyenne générale est de ${f(a.moy)}/20${a.trend !== null && a.trend <= -0.5 ? `, en baisse de ${f(Math.abs(a.trend))} point` : ''}.`)
  if (a.weak.length) lignes.push(`Il/elle rencontre des difficultés en ${a.weak.slice(0, 3).map(s => s.n).join(', ')}.`)
  if (a.absences >= 4) lignes.push(`${a.absences} h d’absence ne sont pas justifiées.`)
  lignes.push('Nous vous invitons à passer à l’établissement pour échanger sur l’accompagnement à mettre en place. Merci.')
  return lignes.join(' ')
}

// Synthèse de la classe : matières les plus difficiles et élèves à accompagner en priorité
export function analyseClasse(classe, tr) {
  const ranking = calc(classe, tr)
  const eleves = classe.eleves.map(e => ({ e, a: analyseEleve(e, classe, tr, ranking) })).filter(x => x.a.level)
  const subjects = classe.matieres.map((m, j) => {
    const vals = classe.eleves.map(e => moyMat(e, tr, j)).filter(x => x !== null)
    return { n: m.n, teacher: m.teacherName, moy: avg(vals), below: vals.filter(x => x < 10).length, total: vals.length }
  }).filter(s => s.total > 0).sort((a, b) => a.moy - b.moy)
  return {
    ranking, subjects, eleves: eleves.sort((a, b) => b.a.score - a.a.score || (a.a.moy ?? 99) - (b.a.moy ?? 99)),
    counts: { haut: eleves.filter(x => x.a.level === 'haut').length, moyen: eleves.filter(x => x.a.level === 'moyen').length, total: eleves.length },
  }
}
