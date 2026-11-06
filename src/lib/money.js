/* Montants (FCFA), paiements, échéanciers et liens d'envoi aux parents */
export const fcfa = n => `${Math.round(n || 0).toLocaleString('fr-FR')} FCFA`
export const int = v => Math.round(Number(String(v ?? '').replace(/[\s  ]/g, '').replace(',', '.')) || 0)
export const dateFr = d => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '')
export const pct = (a, b) => (b ? Math.round(a / b * 100) : 0)

export const METHODS = [
  { value: 'especes', label: 'Espèces' }, { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'virement', label: 'Virement' }, { value: 'cheque', label: 'Chèque' },
]
export const methodLabel = m => METHODS.find(x => x.value === m)?.label || m

export const MODALITES = [
  { value: 'annuel', label: 'Paiement unique', sub: 'Toute la scolarité en une fois' },
  { value: 'trimestriel', label: 'Par trimestre', sub: '3 échéances' },
  { value: 'mensuel', label: 'Mensuel', sub: '9 mensualités, d’octobre à juin' },
  { value: 'personnalise', label: 'Personnalisé', sub: 'Vous fixez vous-même les échéances' },
]

export const STATE = {
  solde: { label: 'Soldé', cls: 'ok' }, en_retard: { label: 'En retard', cls: 'ko' }, en_cours: { label: 'En cours', cls: 'gold' },
  aucun: { label: 'Frais non définis', cls: 'neutral' }, retire: { label: 'Retiré', cls: 'neutral' },
}
export const TRANCHE_STATE = {
  paye: { label: 'Payée', cls: 'ok' }, partiel: { label: 'Partielle', cls: 'gold' }, en_retard: { label: 'En retard', cls: 'ko' }, a_venir: { label: 'À venir', cls: 'neutral' },
}
export const ENROLL = {
  enrolled: { label: 'Inscrit(e)', cls: 'ok' }, pending: { label: 'Dossier en attente', cls: 'gold' }, withdrawn: { label: 'Retiré(e)', cls: 'neutral' },
}

// Même règle que le serveur : échéancier proposé selon la modalité (aperçu avant enregistrement)
export function buildTranches(modalite, scolarite, annee) {
  const year = parseInt(annee, 10) || new Date().getFullYear()
  const spec = {
    annuel: [['Paiement unique', 10, 15]],
    trimestriel: [['1er trimestre', 10, 15], ['2e trimestre', 1, 15], ['3e trimestre', 4, 15]],
    mensuel: [10, 11, 12, 1, 2, 3, 4, 5, 6].map((m, i) => [`Mensualité ${i + 1}`, m, 10]),
  }[modalite] || []
  let used = 0
  return spec.map(([label, month, d], i) => {
    const amount = i === spec.length - 1 ? scolarite - used : Math.floor(scolarite / spec.length)
    used += amount
    return { label, amount, due: `${month >= 8 ? year : year + 1}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}` }
  })
}

/* ---------- envoi aux parents : on ouvre l'application SMS / WhatsApp / e-mail de l'appareil ---------- */
// Numéro au format international sans « + » (un numéro burkinabè à 8 chiffres reçoit l'indicatif 226)
export function phoneIntl(raw) {
  let d = String(raw || '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  return d.length === 8 ? '226' + d : d
}
export const smsLink = (phone, text) => `sms:${phone}?body=${encodeURIComponent(text)}`
export const waLink = (intl, text) => `https://wa.me/${intl}?text=${encodeURIComponent(text)}`
export const mailLink = (email, subject, text) => `mailto:${email}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(text)}`
export const callLink = phone => `tel:${phone}`
