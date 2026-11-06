// Onglets de la barre de navigation selon le profil
const HOME = { to: '/', label: 'Accueil', icon: 'home', end: true }
const CLASSES = { to: '/classes', label: 'Classes', icon: 'school' }
const ELEVES = { to: '/classes', label: 'Élèves', icon: 'users' }
const NOTES = { to: '/notes', label: 'Notes', icon: 'edit' }
const RESULTS = { to: '/results', label: 'Résultats', icon: 'trophy' }
const BULL = { to: '/bulletins', label: 'Bulletins', icon: 'file' }
const TEAM = { to: '/team', label: 'Équipe', icon: 'user' }
const GESTION = { to: '/gestion', label: 'Gestion', icon: 'wallet' }
const DEVOIRS = { to: '/devoirs', label: 'Devoirs', icon: 'lock' }
const EDT = { to: '/emploi-du-temps', label: 'Horaires', icon: 'calendar' }

// hasFull : l'enseignant est professeur principal d'au moins une classe (consultation complète)
export function tabsFor(role, hasFull) {
  if (role === 'admin' || role === 'staff') return [HOME, CLASSES, GESTION, RESULTS, BULL, TEAM]
  return hasFull ? [HOME, NOTES, ELEVES, DEVOIRS, RESULTS, BULL] : [HOME, NOTES, ELEVES, DEVOIRS, EDT]
}

// Sélecteurs affichés dans l'en-tête selon la page : { classes: 'full' | 'any' | null, annual }
export function selectorsFor(pathname) {
  if (pathname.includes('/eleves/')) return { classes: null, annual: true }   // fiche élève : seule la période se choisit
  if (pathname.startsWith('/results') || pathname.startsWith('/bulletins')) return { classes: 'full', annual: true }
  if (pathname.startsWith('/notes')) return { classes: 'any', annual: false }
  if (pathname === '/') return { classes: null, annual: false }
  return null
}

// Titre et sous-titre de la barre supérieure (interface web)
export function titleFor(pathname) {
  if (pathname.includes('/eleves/')) return { title: 'Fiche élève', sub: 'Bulletin, notes et vie scolaire' }
  if (pathname.startsWith('/classes/')) return { title: 'Classe', sub: 'Matières, enseignants et élèves' }
  const map = {
    '/': { title: 'Tableau de bord', sub: 'Vue d’ensemble de l’établissement' },
    '/classes': { title: 'Classes', sub: 'Classes, matières et élèves' },
    '/notes': { title: 'Saisie des notes', sub: 'Les moyennes se calculent automatiquement' },
    '/results': { title: 'Résultats', sub: 'Moyennes, rangs et décisions' },
    '/bulletins': { title: 'Bulletins', sub: 'Aperçu et impression' },
    '/devoirs': { title: 'Dépôt des devoirs', sub: 'Fichiers chiffrés, ouverts avec le code du professeur' },
    '/audit': { title: 'Journal d’audit', sub: 'Qui a modifié quoi, et quand' },
    '/gestion': { title: 'Gestion', sub: 'Inscriptions, frais, absences, horaires et parents' },
    '/inscriptions': { title: 'Inscriptions', sub: 'Dossiers, parents et effectifs par classe' },
    '/frais': { title: 'Frais de scolarité', sub: 'Montants, modalités de paiement et versements par classe' },
    '/vie-scolaire': { title: 'Absences et retards', sub: 'Suivi et justification par classe' },
    '/emploi-du-temps': { title: 'Emplois du temps', sub: 'Les cours de la semaine' },
    '/parents': { title: 'Communication avec les parents', sub: 'SMS, WhatsApp ou e-mail' },
    '/accompagnement': { title: 'Accompagnement des élèves', sub: 'Assistant pédagogique' },
    '/team': { title: 'Équipe', sub: 'Comptes des enseignants et du personnel' },
    '/account': { title: 'Paramètres', sub: 'Mon compte et identité de l’établissement' },
  }
  return map[pathname] || { title: 'EDVIA', sub: '' }
}
