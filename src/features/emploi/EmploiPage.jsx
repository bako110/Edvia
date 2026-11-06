import { useEffect, useState } from 'react'
import Icon from '../../components/ui/Icon'
import Picker from '../../components/ui/Picker'
import { Async, Empty } from '../../components/ui/Common'
import { Field } from '../../components/ui/Field'
import { useAuth } from '../../context/AuthContext'
import { useClasses } from '../../context/ClassesContext'
import { useConfirm, useToast } from '../../context/Feedback'
import { useAsync } from '../../hooks/useAsync'
import { useClasse } from '../../hooks/useClasse'
import { timetableApi } from '../../api'
import SchoolMark from '../../components/ui/SchoolMark'
import { ClassPick, Sheet, useClassChoice } from '../gestion/shared'
import { slug } from '../../lib/files'
import { usePdfStage } from '../../hooks/usePdfStage'

const DAYS = [[1, 'Lundi'], [2, 'Mardi'], [3, 'Mercredi'], [4, 'Jeudi'], [5, 'Vendredi'], [6, 'Samedi']]
const DAY_OPTIONS = DAYS.map(([value, label]) => ({ value, label }))
const HUE = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)   // une couleur stable par matière

/* ---------- ajout / modification d'un cours (administrateur) ---------- */
function CoursSheet({ classeId, matieres, cours, day, onClose, onSaved }) {
  const toast = useToast(), confirm = useConfirm()
  const [f, setF] = useState({ matiereId: cours?.matiereId || matieres[0]?.id || '', day: cours?.day || day || 1, start: cours?.start || '08:00', end: cours?.end || '10:00', room: cours?.room || '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = k => v => setF(s => ({ ...s, [k]: v }))

  const save = async () => {
    setBusy(true); setError('')
    try {
      if (cours) await timetableApi.update(cours.id, f); else await timetableApi.create(classeId, f)
      toast(cours ? 'Cours modifié' : 'Cours ajouté'); onSaved(); onClose()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const remove = async () => {
    if (!(await confirm({ danger: true, ok: 'Supprimer', title: 'Supprimer ce cours ?', text: 'Il disparaîtra de l’emploi du temps de la classe.' }))) return
    try { await timetableApi.remove(cours.id); toast('Cours supprimé'); onSaved(); onClose() } catch (e) { setError(e.message) }
  }
  return (
    <Sheet title={cours ? 'Modifier le cours' : 'Ajouter un cours'} onClose={onClose}>
      <div className="vie-form">
        <div className="field"><label>Matière</label>
          <Picker label="Matière" value={f.matiereId} options={matieres.map(m => ({ value: m.id, label: m.n, sub: m.teacherName || 'sans enseignant' }))} onChange={set('matiereId')} /></div>
        <div className="field"><label>Jour</label><Picker label="Jour" value={f.day} options={DAY_OPTIONS} onChange={set('day')} /></div>
        <div className="row mrow">
          <Field label="Début" type="time" value={f.start} onChange={e => set('start')(e.target.value)} />
          <Field label="Fin" type="time" value={f.end} onChange={e => set('end')(e.target.value)} />
        </div>
        <Field label="Salle (facultatif)" value={f.room} onChange={e => set('room')(e.target.value)} maxLength={30} />
        {error && <div className="alert err" role="alert"><Icon name="alert" size={18} />{error}</div>}
        <button className="btn p block" disabled={busy || !f.matiereId || !f.start || !f.end} onClick={save}><Icon name="check" size={16} /> {busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        {cours && <button className="btn danger-o block" onClick={remove}><Icon name="trash" size={16} /> Supprimer ce cours</button>}
      </div>
    </Sheet>
  )
}

/* ---------- feuille A4 paysage : imprimée ou enregistrée en PDF, comme les bulletins ---------- */
function TimetableSheet({ pdf }) {
  const { school } = useAuth()
  const slots = [...new Set(pdf.creneaux.map(c => c.start + '-' + c.end))].sort()
  return (
    <div className="tt-print" aria-hidden="true">
      <header className="tt-head">
        <SchoolMark logo={school.logo} size={56} id="tt" />
        <div><div className="tt-school">{school.name}</div><div className="tt-sub">Année scolaire {school.annee}</div></div>
        <div className="tt-title"><b>Emploi du temps</b><span>{pdf.title}</span></div>
      </header>
      <table className="tt-table">
        <thead><tr><th>Horaire</th>{DAYS.slice(0, pdf.saturday ? 6 : 5).map(([d, l]) => <th key={d}>{l}</th>)}</tr></thead>
        <tbody>
          {slots.map(s => (
            <tr key={s}>
              <th>{s.replace('-', ' – ')}</th>
              {DAYS.slice(0, pdf.saturday ? 6 : 5).map(([d]) => (
                <td key={d}>{pdf.creneaux.filter(c => c.day === d && c.start + '-' + c.end === s).map(c => (
                  <div className="tt-cell" key={c.id} style={{ '--hue': HUE(c.matiere) }}>
                    <b>{c.matiere}</b>
                    <span>{[pdf.showClasse && c.classe, !pdf.showClasse && c.teacher, c.room && `Salle ${c.room}`].filter(Boolean).join(' · ')}</span>
                  </div>
                ))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="tt-foot">Document généré par EDVIA · {school.name}</footer>
    </div>
  )
}

function PdfButton({ onPdf, title, creneaux, showClasse }) {
  if (!creneaux.length) return null
  return (
    <div className="act">
      <button className="btn p" onClick={() => onPdf({ title, creneaux, showClasse, saturday: creneaux.some(c => c.day === 6) })}>
        <Icon name="download" size={16} /> Télécharger en PDF
      </button>
      <span className="mut">Choisissez « Enregistrer au format PDF » dans la fenêtre d’impression.</span>
    </div>
  )
}

/* ---------- grille de la semaine ---------- */
function Week({ creneaux, showClasse, onEdit, onAdd }) {
  return (
    <div className="week">
      {DAYS.map(([d, label]) => {
        const list = creneaux.filter(c => c.day === d)
        if (!list.length && d === 6 && !onAdd) return null
        return (
          <section className="card day" key={d}>
            <h2>{label} {onAdd && <button className="btn sm day-add" onClick={() => onAdd(d)}><Icon name="plus" size={14} /> Cours</button>}</h2>
            {list.length === 0 && <p className="mut">Aucun cours.</p>}
            {list.map(c => (
              <button key={c.id} className="slot" style={{ '--hue': HUE(c.matiere) }} onClick={() => onEdit && onEdit(c)} disabled={!onEdit}>
                <span className="slot-t">{c.start}<br /><small>{c.end}</small></span>
                <span className="slot-b"><b>{c.matiere}</b>
                  <span className="mut">{[showClasse && c.classe, c.teacher, c.room && `Salle ${c.room}`].filter(Boolean).join(' · ')}</span></span>
                {onEdit && <Icon name="edit" size={16} className="slot-ed" />}
              </button>
            ))}
          </section>
        )
      })}
    </div>
  )
}

function ClassWeek({ classeId, name, isAdmin, office, onPdf }) {
  const { data, loading, error, reload } = useAsync(() => timetableApi.classe(classeId), [classeId])
  const { classe } = useClasse(isAdmin ? classeId : null)
  const [sheet, setSheet] = useState(null)
  return (
    <Async loading={loading && !data} error={error} onRetry={reload}>
      {data && <>
        {isAdmin && (data.creneaux.length === 0
          ? <p className="mut">Aucun cours pour le moment. Ajoutez-les jour par jour avec le bouton « + Cours ».</p>
          : <p className="mut"><Icon name="edit" size={14} /> Touchez un cours pour le modifier (matière, jour, horaire, salle) ou le supprimer. « + Cours » en ajoute un.</p>)}
        {!isAdmin && office && <p className="mut"><Icon name="lock" size={14} /> Seul l’administrateur modifie les emplois du temps.</p>}
        <PdfButton onPdf={onPdf} title={name} creneaux={data.creneaux} showClasse={false} />
        <Week creneaux={data.creneaux} showClasse={false} onEdit={isAdmin ? c => setSheet({ cours: c }) : null} onAdd={isAdmin ? d => setSheet({ day: d }) : null} />
        {sheet && classe && <CoursSheet classeId={classeId} matieres={classe.matieres} cours={sheet.cours} day={sheet.day} onClose={() => setSheet(null)} onSaved={reload} />}
      </>}
    </Async>
  )
}

function MyWeek({ onPdf, teacher }) {
  const { data, loading, error, reload } = useAsync(timetableApi.mine)
  return (
    <Async loading={loading} error={error} onRetry={reload}>
      {data && (data.creneaux.length === 0
        ? <Empty icon="calendar" title="Aucun cours programmé" text="L’administration n’a pas encore saisi votre emploi du temps." />
        : <>
          <PdfButton onPdf={onPdf} title={teacher} creneaux={data.creneaux} showClasse />
          <Week creneaux={data.creneaux} showClasse />
        </>)}
    </Async>
  )
}

export default function EmploiPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { classes } = useClasses()
  const isTeacher = user.role === 'teacher'
  const [mode, setMode] = useState(isTeacher ? 'mine' : 'class')
  const [classeId, setClasseId] = useClassChoice(classes)
  const stage = usePdfStage()
  const className = classes.find(c => c.id === classeId)?.name || ''
  const office = user.role !== 'teacher'
  const [bulk, setBulk] = useState('')

  // un seul fichier PDF A4 paysage ; une page par feuille
  const startPdf = (name, sheets) => stage.start({ name, sheets, selector: '.tt-print', orientation: 'landscape' })
  const setPdf = p => startPdf(`Emploi-du-temps-${slug(p.title)}.pdf`, [p])
  const sat = list => list.some(c => c.day === 6)

  // tout le programme de la semaine : une page par classe, ou une page par enseignant
  const downloadAll = async by => {
    setBulk(by)
    try {
      const { creneaux } = await timetableApi.all()
      if (!creneaux.length) throw new Error('Aucun cours n’est encore programmé')
      const key = c => (by === 'classe' ? c.classe : c.teacher || 'Sans enseignant')
      const groups = [...creneaux.reduce((m, c) => m.set(key(c), [...(m.get(key(c)) || []), c]), new Map())]
        .sort((x, y) => x[0].localeCompare(y[0], 'fr', { numeric: true }))
      startPdf(by === 'classe' ? 'Programme-de-la-semaine-par-classe.pdf' : 'Programme-de-la-semaine-par-enseignant.pdf',
        groups.map(([title, list]) => ({ title, creneaux: list, showClasse: by !== 'classe', saturday: sat(list) })))
    } catch (e) { toast(e.message, 'err') }
    setBulk('')
  }

  return <>
    <div>
    {isTeacher && (
      <div className="vie-types" role="tablist">
        <button role="tab" aria-selected={mode === 'mine'} className={mode === 'mine' ? 'on' : ''} onClick={() => setMode('mine')}><Icon name="user" size={16} />Mes cours</button>
        <button role="tab" aria-selected={mode === 'class'} className={mode === 'class' ? 'on' : ''} onClick={() => setMode('class')}><Icon name="school" size={16} />Une classe</button>
      </div>
    )}
    {office && (
      <section className="card">
        <h2><Icon name="download" /> Tout le programme de la semaine</h2>
        <p className="mut">Un seul fichier PDF, classé et groupé : une page par classe, ou une page par enseignant.</p>
        <div className="act">
          <button className="btn p" disabled={!!bulk || stage.busy} onClick={() => downloadAll('classe')}><Icon name="school" size={16} /> {bulk === 'classe' || stage.busy ? 'Création du PDF…' : 'Par classe'}</button>
          <button className="btn" disabled={!!bulk || stage.busy} onClick={() => downloadAll('enseignant')}><Icon name="user" size={16} /> Par enseignant</button>
        </div>
      </section>
    )}
    {mode === 'mine' && isTeacher && <MyWeek onPdf={setPdf} teacher={user.name} />}
    {mode === 'class' && (classes.length === 0
      ? <Empty icon="school" title="Aucune classe" text="Créez d’abord les classes de l’établissement." />
      : <>
        <section className="card"><ClassPick classes={classes} value={classeId} onChange={setClasseId} /></section>
        {classeId && <ClassWeek key={classeId} classeId={classeId} name={className} isAdmin={user.role === 'admin'} office={office} onPdf={setPdf} />}
      </>)}
    </div>
    {stage.job && <div className="print-batch stage land" aria-hidden="true" ref={stage.stageRef}>{stage.job.sheets.map((s, i) => <TimetableSheet key={i} pdf={s} />)}</div>}
  </>
}
