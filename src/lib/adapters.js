// Transforme la réponse de l'API (/classes/:id/full) vers la forme attendue par lib/calc.js
// Pénalités de points : par trimestre, par matière (index) et sur la moyenne générale
function penalties(incidents, matieres) {
  const pen = {}
  for (const i of incidents || []) {
    if (i.type !== 'penalite') continue
    const p = (pen[i.tr] ||= { m: matieres.map(() => 0), g: 0 })
    const j = i.matiereId ? matieres.findIndex(m => m.id === i.matiereId) : -1
    if (j >= 0) p.m[j] += i.points; else p.g += i.points
  }
  return pen
}

export function toClasse(full) {
  const matieres = full.matieres.map(m => ({ id: m.id, n: m.name, c: m.coef, teacherId: m.teacherId, teacherName: m.teacherName }))
  const eleves = full.eleves.map(e => ({
    id: e.id, n: e.name, matricule: e.matricule, obs: e.obs || {}, inc: e.incidents || [], pen: penalties(e.incidents, matieres),
    notes: Object.fromEntries(Object.entries(e.notes).map(([tr, byM]) => [tr, matieres.map(m => byM[m.id] || ['', '', ''])])),
  }))
  return { id: full.classe.id, name: full.classe.name, access: full.classe.access, principalId: full.classe.principalId, principalName: full.classe.principalName, matieres, eleves }
}

// Identifiant de connexion proposé à partir d'un nom : « Awa Ouédraogo » -> « awa.ouedraogo »
export function suggestLogin(name) {
  return String(name).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '').slice(0, 24)
}
// Mot de passe provisoire lisible (sans caractères ambigus)
export function tempPassword(len = 10) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const a = new Uint32Array(len); crypto.getRandomValues(a)
  return Array.from(a, x => chars[x % chars.length]).join('')
}
