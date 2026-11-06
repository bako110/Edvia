import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import { Async, Empty } from '../../components/ui/Common'
import { useAsync } from '../../hooks/useAsync'
import { auditApi } from '../../api'
import { useAuth } from '../../context/AuthContext'

const LABELS = {
  note: ['Note modifiée', 'edit'], verrou: ['Trimestre verrouillé', 'lock'], deverrou: ['Trimestre déverrouillé', 'key'],
  penalite: ['Pénalité', 'minus'], sanction: ['Sanction', 'shield'], incident_supprime: ['Signalement supprimé', 'trash'],
  absence_justifiee: ['Absence justifiée', 'check'], observation: ['Observation modifiée', 'edit'],
  eleve_modifie: ['Dossier élève modifié', 'user'], eleve_supprime: ['Élève supprimé', 'trash'],
  paiement: ['Paiement enregistré', 'wallet'], paiement_annule: ['Paiement annulé', 'alert'], annee: ['Année scolaire', 'calendar'],
  compte_cree: ['Compte créé', 'user'], compte_modifie: ['Compte modifié', 'user'], mdp_reinitialise: ['Mot de passe réinitialisé', 'key'],
  identite: ['Identité de l’école', 'school'], connexion_echec: ['Échec de connexion', 'alert'],
}
const FILTERS = [['', 'Tout'], ['note', 'Notes'], ['verrou', 'Verrous'], ['penalite', 'Pénalités'], ['paiement', 'Paiements'], ['compte_modifie', 'Comptes'], ['connexion_echec', 'Connexions échouées']]
const STAFF_FILTERS = FILTERS.filter(([k]) => ['', 'note', 'verrou', 'penalite'].includes(k))   // le personnel : notes et élèves seulement
const TR = ['T1', 'T2', 'T3']
const COL = { d1: 'Devoir 1', d2: 'Devoir 2', c: 'Composition' }
const show = v => (v === '' || v === undefined || v === null ? '∅' : String(v))

// Phrase lisible pour chaque type d'action
function describe(a) {
  const d = a.detail || {}
  switch (a.action) {
    case 'note': return <><b>{d.matiere}</b> · {TR[d.tr]} · {COL[d.colonne]} : <s>{show(d.de)}</s> → <b>{show(d.a)}</b></>
    case 'verrou': case 'deverrou': return <>{d.trimestre}</>
    case 'penalite': return <>{TR[d.tr]} · −{d.points} pt{d.matiere ? ` en ${d.matiere}` : ' sur la moyenne générale'} — {d.motif}</>
    case 'sanction': return <>{d.label} — {d.motif}</>
    case 'incident_supprime': return <>{d.type} ({TR[d.tr]}){d.points ? ` −${d.points} pt` : ''}{d.motif ? ` — ${d.motif}` : ''} · saisi par {d.par || '—'}</>
    case 'absence_justifiee': return <>{d.heures} h · {d.de ? 'justifiée' : 'non justifiée'} → {d.a ? 'justifiée' : 'non justifiée'}</>
    case 'observation': return <>Période {d.periode + 1 > 3 ? 'année' : d.periode + 1} : « {show(d.de)} » → « {show(d.a)} »</>
    case 'eleve_modifie': return <>{Object.entries(d.changes || {}).map(([k, [x, y]]) => `${k} : ${show(x)} → ${show(y)}`).join(' · ')}</>
    case 'eleve_supprime': return <>{d.nom}{d.matricule ? ` (${d.matricule})` : ''}</>
    case 'paiement': return <>{d.type} · {Number(d.montant).toLocaleString('fr-FR')} FCFA · {d.moyen}</>
    case 'paiement_annule': return <>{d.type} · {Number(d.montant).toLocaleString('fr-FR')} FCFA · reçu {d.recu}</>
    case 'annee': return <>{d.de} → {d.a}{d.creation ? ' (création)' : ''}</>
    case 'compte_cree': return <>{d.compte} · {d.role}</>
    case 'compte_modifie': return <>{d.compte} · rôle {d.role?.join(' → ')} · actif {d.actif?.map(String).join(' → ')}</>
    case 'mdp_reinitialise': return <>{d.compte}</>
    case 'identite': return <>{(d.champs || []).join(', ')}</>
    default: return null
  }
}
const dt = d => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

// Journal d'audit : qui a fait quoi, quand, depuis quelle adresse. Lecture seule, impossible à modifier ou effacer.
export default function AuditPage() {
  const { user } = useAuth()
  const [action, setAction] = useState('')
  const { data, loading, error, reload } = useAsync(() => auditApi.list(action ? { action } : {}), [action])
  return <>
    <section className="card">
      <h2><Icon name="shield" /> Journal d’audit</h2>
      <p className="mut">Chaque modification de note, pénalité, verrou, paiement ou compte est enregistrée avec son auteur, la date et l’adresse de connexion. Ce journal ne peut ni être modifié ni être effacé, même par un administrateur.{user.role !== 'admin' && ' Votre vue est limitée aux actions sur les notes et les élèves.'}</p>
      <div className="chips fchips">
        {(user.role === 'admin' ? FILTERS : STAFF_FILTERS).map(([k, l]) => <button key={k} className={'chipbtn' + (action === k ? ' on' : '')} onClick={() => setAction(k)}>{l}</button>)}
      </div>
    </section>
    <Async loading={loading && !data} error={error} onRetry={reload}>
      {data && (data.length === 0
        ? <Empty icon="shield" title="Rien à signaler" text="Aucune action enregistrée pour ce filtre." />
        : <section className="card">
          <h2>{data.length} dernière{data.length > 1 ? 's' : ''} action{data.length > 1 ? 's' : ''}</h2>
          <ul className="vie-list audit">
            {data.map(a => (
              <li key={a.id} className={a.action === 'connexion_echec' || a.action === 'deverrou' ? 'k-absence' : ''}>
                <Icon name={(LABELS[a.action] || [])[1] || 'info'} size={18} />
                <div><b>{(LABELS[a.action] || [a.action])[0]}</b>{a.eleve && <> · {a.eleve}</>}{a.classe && <span className="mut"> ({a.classe})</span>}
                  <div>{describe(a)}</div>
                  <div className="mut">{dt(a.at)} · {a.byName} ({a.role}){a.ip ? ` · ${a.ip}` : ''}</div></div>
              </li>
            ))}
          </ul>
        </section>)}
    </Async>
  </>
}
