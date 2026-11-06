import { useState } from 'react'
import Icon from '../ui/Icon'
import Sheet from '../../features/gestion/Sheet'
import { useAuth } from '../../context/AuthContext'
import { useConfirm } from '../../context/Feedback'
import { schoolApi } from '../../api'
import { KIND_LABEL, yearKind } from '../../lib/year'

// Archive = année TERMINÉE (consultation seule pour les enseignants). L'année réelle reste valide même si la suivante est ouverte.
export const isArchive = school => yearKind(school.annee) === 'archive'

const nextYear = list => { const last = parseInt([...list].sort().pop(), 10); return `${last + 1}-${last + 2}` }

export function ArchiveBanner() {
  const { school, user } = useAuth()
  const kind = yearKind(school.annee)
  if (kind === 'courante') return null
  return (
    <div className="arch noprint" role="status"><Icon name={kind === 'archive' ? 'lock' : 'calendar'} size={18} />
      {kind === 'archive'
        ? <>Année {school.annee} (archive){user.role === 'teacher' ? ' : consultation seule' : ' : vous consultez une année terminée'}.</>
        : <>Année {school.annee} en préparation : l’année en cours reste valide et se retrouve dans le menu de l’année.</>}</div>
  )
}

function YearSheet({ onClose }) {
  const { school, setSchool } = useAuth()
  const confirm = useConfirm()
  const years = [...(school.annees?.length ? school.annees : [school.annee])].sort().reverse()
  const [name, setName] = useState(nextYear(years))
  const [copy, setCopy] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // changer d'année remplace tout le contenu de l'application : on recharge pour repartir sur les données de cette année
  const go = async (body, text) => {
    if (!(await confirm({ ok: 'Changer d’année', title: text, text: 'Toute l’application (classes, élèves, notes, frais, horaires, messages) affichera les données de cette année. Rien n’est supprimé.' }))) return
    setBusy(true); setError('')
    try { setSchool(await schoolApi.setAnnee(body)); window.location.reload() }
    catch (e) { setError(e.message); setBusy(false) }
  }
  return (
    <Sheet title="Année scolaire" sub="Les données de chaque année sont conservées séparément" onClose={onClose}>
      <div className="vie-form">
        <div className="yr-list">
          {years.map(y => (
            <button key={y} className={'yr-opt' + (y === school.annee ? ' on' : '')} disabled={busy || y === school.annee}
              onClick={() => go({ annee: y }, `Passer à l’année ${y} ?`)}>
              <span>{y}</span>{y === school.annee ? <Icon name="check" size={16} /> : <span className="mut">{KIND_LABEL[yearKind(y)]}</span>}
            </button>
          ))}
        </div>
        <h4 className="vie-h">Ouvrir une nouvelle année</h4>
        <div className="field"><label>Année</label><input value={name} onChange={e => setName(e.target.value)} placeholder="2027-2028" maxLength={9} /></div>
        {!years.includes(name) && (
          <label className="check"><input type="checkbox" checked={copy} onChange={e => setCopy(e.target.checked)} /> Reprendre les classes, matières, enseignants et frais de {school.annee} (sans les élèves)</label>
        )}
        {error && <div className="alert err" role="alert"><Icon name="alert" size={18} />{error}</div>}
        <button className="btn p block" disabled={busy || years.includes(name) || !/^\d{4}-\d{4}$/.test(name)}
          onClick={() => go({ annee: name, create: true, ...(copy ? { copyFrom: school.annee } : {}) }, `Ouvrir l’année ${name} ?`)}>
          <Icon name="plus" size={16} /> Ouvrir cette année
        </button>
      </div>
    </Sheet>
  )
}

// Année scolaire affichée dans le menu : l'administrateur la change ici, les autres la voient seulement
export default function YearSwitch({ inline }) {
  const { school, user } = useAuth()
  const [open, setOpen] = useState(false)
  const label = inline ? `Année ${school.annee}` : `Année scolaire ${school.annee}`
  const kind = yearKind(school.annee)
  const tail = kind === 'courante' ? '' : ` · ${KIND_LABEL[kind]}`
  if (user.role !== 'admin') return <span className={inline ? '' : 'side-year'}>{label}{tail}</span>
  return <>
    <button className={inline ? 'yr' : 'yr side-year'} onClick={() => setOpen(true)} aria-label={`${label} : changer d’année`}>
      {label}{tail} <Icon name="chev-down" size={14} />
    </button>
    {open && <YearSheet onClose={() => setOpen(false)} />}
  </>
}
