// Année scolaire réelle : elle commence en août (même règle que le serveur)
export function currentSchoolYear(date = new Date()) {
  const y = date.getFullYear(), start = date.getMonth() >= 7 ? y : y - 1
  return `${start}-${start + 1}`
}

// 'archive' : année terminée · 'courante' : année réelle · 'preparation' : année à venir, ouverte à l'avance
export function yearKind(annee, now = new Date()) {
  const cur = currentSchoolYear(now)
  return annee < cur ? 'archive' : annee > cur ? 'preparation' : 'courante'
}
export const KIND_LABEL = { archive: 'archive', courante: 'année en cours', preparation: 'en préparation' }
