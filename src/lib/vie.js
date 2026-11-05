// Libellés et descriptions de la vie scolaire (partagés par la saisie et le bulletin)
export const INCIDENT_LABEL = { retard: 'Retard', absence: 'Absence', comportement: 'Comportement', penalite: 'Pénalité', sanction: 'Sanction' }
export const INCIDENT_ICON = { retard: 'clock', absence: 'user', comportement: 'alert', penalite: 'minus', sanction: 'shield' }
export const BEHAVIOR_LABELS = ['Bavardage', 'Insolence', 'Tricherie', 'Violence', 'Téléphone en classe', 'Dégradation', 'Autre']
export const SANCTION_LABELS = ['Avertissement', 'Blâme', 'Exclusion temporaire', 'Autre']

const hours = h => String(Math.round(h * 100) / 100).replace('.', ',')
export const fmtHours = hours
export const shortDate = d => `${d.slice(8, 10)}/${d.slice(5, 7)}`

// « Pénalité −1,5 pt en Mathématiques — Fraude lors du devoir »
export function describe(i, classe) {
  const m = i.matiereId ? classe.matieres.find(x => x.id === i.matiereId) : null
  switch (i.type) {
    case 'retard': return `Retard${i.minutes ? ` de ${i.minutes} min` : ''}${i.motif ? ` — ${i.motif}` : ''}`
    case 'absence': return `Absence de ${hours(i.hours)} h (${i.justified ? 'justifiée' : 'non justifiée'})${i.motif ? ` — ${i.motif}` : ''}`
    case 'comportement': return `${i.label || 'Comportement'} — ${i.motif}`
    case 'penalite': return `Pénalité −${hours(i.points)} pt ${m ? `en ${m.n}` : 'sur la moyenne générale'} — ${i.motif}`
    case 'sanction': return `${i.label} — ${i.motif}`
    default: return i.motif
  }
}
