import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../../components/ui/Icon'
import Picker from '../../components/ui/Picker'
import { useAuth } from '../../context/AuthContext'
import { useConfirm, useToast } from '../../context/Feedback'
import { incidentsApi } from '../../api'
import { PERIODS, f, moyMat, moyMatRaw, num } from '../../lib/calc'
import { INCIDENT_ICON, INCIDENT_LABEL, BEHAVIOR_LABELS, SANCTION_LABELS, describe, shortDate } from '../../lib/vie'

const today = () => new Date().toISOString().slice(0, 10)
const POINTS = [0.5, 1, 1.5, 2]

// Fenêtre « Vie scolaire » d'un élève : retards, absences, comportement, pénalités de points, sanctions
export default function VieSheet({ eleve, classe, tr, onClose, onChanged }) {
  const { user } = useAuth()
  const toast = useToast(), confirm = useConfirm()
  const admin = user.role === 'admin' || user.role === 'staff'

  const types = ['retard', 'absence', 'comportement', 'penalite', ...(admin ? ['sanction'] : [])]
  // un enseignant ne pénalise que dans SA matière ; l'administration peut aussi pénaliser la moyenne générale
  const myMatieres = admin ? classe.matieres : classe.matieres.filter(m => m.teacherId === user.id)
  const matiereOptions = [...(admin ? [{ value: '', label: 'Moyenne générale' }] : []), ...myMatieres.map(m => ({ value: m.id, label: m.n }))]

  const [type, setType] = useState('retard')
  const [f1, setF1] = useState({ date: today(), minutes: '', hours: '', justified: false, label: BEHAVIOR_LABELS[0], motif: '', points: '1', matiereId: matiereOptions[0]?.value ?? '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = k => v => setF1(s => ({ ...s, [k]: v }))

  useEffect(() => {
    const key = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', key)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = prev }
  }, [onClose])

  const switchType = t => {
    setType(t); setError('')
    setF1(s => ({ ...s, label: t === 'sanction' ? SANCTION_LABELS[0] : BEHAVIOR_LABELS[0], motif: '' }))
  }

  const mats = classe.matieres
  const jIdx = f1.matiereId ? mats.findIndex(m => m.id === f1.matiereId) : -1
  const pts = num(f1.points)
  const before = jIdx >= 0 ? moyMat(eleve, tr, jIdx) : null
  const rawAvg = jIdx >= 0 ? moyMatRaw(eleve, tr, jIdx) : null

  const submit = async () => {
    setBusy(true); setError('')
    const body = { tr, type, date: f1.date, motif: f1.motif.trim() }
    if (type === 'retard' && f1.minutes !== '') body.minutes = Math.round(num(f1.minutes)) || 0
    if (type === 'absence') { body.hours = num(f1.hours); body.justified = f1.justified }
    if (type === 'comportement' || type === 'sanction') body.label = f1.label
    if (type === 'penalite') { body.points = pts; body.matiereId = f1.matiereId || null }
    try {
      await incidentsApi.create(eleve.id, body)
      toast(`${INCIDENT_LABEL[type]} enregistré${type === 'penalite' ? 'e' : ''}`)
      setF1(s => ({ ...s, motif: '', minutes: '', hours: '' }))
      await onChanged()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const remove = async i => {
    if (!(await confirm({ danger: true, ok: 'Supprimer', title: 'Supprimer ce signalement ?', text: describe(i, classe) }))) return
    try { await incidentsApi.remove(i.id); toast('Signalement supprimé'); await onChanged() } catch (e) { toast(e.message, 'err') }
  }

  const needMotif = ['comportement', 'penalite', 'sanction'].includes(type)
  const ready = (!needMotif || f1.motif.trim().length >= 3) && (type !== 'absence' || num(f1.hours) > 0) && (type !== 'penalite' || (pts > 0 && (admin || myMatieres.length > 0)))
  const mine = eleve.inc.filter(i => i.tr === tr)

  return createPortal(
    <div className="pov noprint" onClick={onClose}>
      <div className="psheet vie" role="dialog" aria-modal="true" aria-label={`Vie scolaire — ${eleve.n}`} onClick={e => e.stopPropagation()}>
        <div className="pgrab" />
        <div className="psheet-h">
          <div><h3>Vie scolaire</h3><div className="mut">{eleve.n} · {classe.name} · {PERIODS[tr]}</div></div>
          <button className="btn icon-btn sm" onClick={onClose} aria-label="Fermer"><Icon name="close" size={18} /></button>
        </div>

        <div className="vie-types" role="tablist">
          {types.map(t => (
            <button key={t} role="tab" aria-selected={type === t} className={type === t ? 'on' : ''} onClick={() => switchType(t)}>
              <Icon name={INCIDENT_ICON[t]} size={16} />{INCIDENT_LABEL[t]}
            </button>
          ))}
        </div>

        <div className="vie-form">
          <div className="row">
            <div className="field"><label>Date</label><input type="date" value={f1.date} max={today()} onChange={e => set('date')(e.target.value)} /></div>
            {type === 'retard' && <div className="field"><label>Durée du retard (min)</label><input type="number" inputMode="numeric" min="0" max="600" value={f1.minutes} placeholder="ex. 15" onChange={e => set('minutes')(e.target.value)} /></div>}
            {type === 'absence' && <div className="field"><label>Durée (heures)</label><input type="number" inputMode="decimal" min="0.5" step="0.5" value={f1.hours} placeholder="ex. 2" onChange={e => set('hours')(e.target.value)} /></div>}
          </div>

          {type === 'absence' && (
            <label className="check"><input type="checkbox" checked={f1.justified} onChange={e => set('justified')(e.target.checked)} /> Absence justifiée</label>
          )}

          {(type === 'comportement' || type === 'sanction') && <>
            <label>{type === 'sanction' ? 'Sanction' : 'Catégorie'}</label>
            <div className="chips">
              {(type === 'sanction' ? SANCTION_LABELS : BEHAVIOR_LABELS).map(l => (
                <button key={l} type="button" className={'chipbtn' + (f1.label === l ? ' on' : '')} onClick={() => set('label')(l)}>{l}</button>
              ))}
            </div>
          </>}

          {type === 'penalite' && <>
            <label>Retirer des points sur</label>
            {matiereOptions.length === 0
              ? <div className="alert err"><Icon name="alert" size={18} />Vous n’avez pas de matière dans cette classe : vous ne pouvez pas pénaliser.</div>
              : <Picker label="Matière" title="Matière concernée" value={f1.matiereId} options={matiereOptions} onChange={set('matiereId')} />}
            <label>Points retirés (sur 20)</label>
            <div className="chips">
              {POINTS.map(p => <button key={p} type="button" className={'chipbtn' + (pts === p ? ' on' : '')} onClick={() => set('points')(String(p))}>−{String(p).replace('.', ',')}</button>)}
              <input className="ptsin" type="number" inputMode="decimal" min="0.25" max="10" step="0.25" value={f1.points} onChange={e => set('points')(e.target.value)} aria-label="Points retirés" />
            </div>
            {jIdx >= 0 && rawAvg !== null && pts > 0 && (
              <div className="preview-avg">Moyenne en {mats[jIdx].n} : <b>{f(before)}</b> → <b className="lw">{f(Math.max(0, before - pts))}</b> <span className="mut">(−{f(pts)} pt)</span></div>
            )}
            {jIdx >= 0 && rawAvg === null && <div className="mut">Aucune note saisie dans cette matière : la pénalité s’appliquera dès que la moyenne existera.</div>}
          </>}

          <label>{needMotif ? 'Motif (obligatoire — à préciser)' : 'Précision (facultatif)'}</label>
          <textarea rows="2" maxLength={200} value={f1.motif} onChange={e => set('motif')(e.target.value)}
            placeholder={type === 'penalite' ? 'Ex. : copie sur son voisin pendant le devoir du 12 octobre' : type === 'comportement' ? 'Ex. : perturbe le cours à plusieurs reprises' : type === 'sanction' ? 'Ex. : insolence envers un professeur' : 'Ex. : arrivé après la sonnerie'} />

          {error && <div className="alert err" role="alert"><Icon name="alert" size={18} />{error}</div>}
          <button className="btn p block" disabled={busy || !ready} onClick={submit}><Icon name="check" size={16} /> {busy ? 'Enregistrement…' : `Enregistrer ${type === 'penalite' ? 'la pénalité' : type === 'retard' ? 'le retard' : type === 'absence' ? 'l’absence' : type === 'sanction' ? 'la sanction' : 'l’incident'}`}</button>
        </div>

        <h4 className="vie-h">Déjà enregistré ce trimestre {!admin && <span className="mut">(vos signalements)</span>}</h4>
        {mine.length === 0 && <p className="mut">Rien à signaler pour le moment.</p>}
        <ul className="vie-list">
          {mine.map(i => (
            <li key={i.id} className={'k-' + i.type}>
              <Icon name={INCIDENT_ICON[i.type]} size={18} />
              <div><b>{describe(i, classe)}</b><div className="mut">{shortDate(i.date)} · {i.byName || 'Administration'}</div></div>
              {(admin || i.by === user.id) && <button className="btn icon-btn sm" onClick={() => remove(i)} aria-label="Supprimer"><Icon name="trash" size={16} /></button>}
            </li>
          ))}
        </ul>
      </div>
    </div>, document.body)
}
