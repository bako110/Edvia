import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Picker from '../../components/ui/Picker'
import { Async, Bar, Empty } from '../../components/ui/Common'
import { useAuth } from '../../context/AuthContext'
import { useClasses } from '../../context/ClassesContext'
import { useView, pickClass } from '../../context/ViewContext'
import { useToast } from '../../context/Feedback'
import { useClasse } from '../../hooks/useClasse'
import { notesApi } from '../../api'
import VieSheet from '../vie/VieSheet'
import { TR, f, getN, moyMat, validNote, tone, hasNote } from '../../lib/calc'

const LABELS = ['Devoir 1', 'Devoir 2', 'Compo']

// Met à jour une note dans l’état local (affichage instantané, avant confirmation du serveur)
const withNote = (classe, eleveId, j, tr, k, v) => ({
  ...classe,
  eleves: classe.eleves.map(e => {
    if (e.id !== eleveId) return e
    const base = e.notes[tr] || classe.matieres.map(() => ['', '', ''])
    return { ...e, notes: { ...e.notes, [tr]: base.map((a, jj) => (jj === j ? a.map((x, kk) => (kk === k ? v : x)) : a)) } }
  }),
})

export default function NotesPage() {
  const { user } = useAuth()
  const { classes, loading: loadingClasses } = useClasses()
  const { classId, trim } = useView()
  const toast = useToast()
  const [params, setParams] = useSearchParams()

  const cur = pickClass(classes, classId)
  const { classe, loading, error, reload, refresh, patch } = useClasse(cur?.id)
  const [vie, setVie] = useState(null)   // élève dont on ouvre la vie scolaire

  // matière courante : ?m=… sinon la première
  const j = Math.max(0, classe ? classe.matieres.findIndex(m => m.id === params.get('m')) : 0)
  const matiere = classe?.matieres[j]

  /* ----- enregistrement automatique, regroupé par champ ----- */
  const pending = useRef(new Map())            // clé -> { timer, args }
  const [saving, setSaving] = useState(0)      // nombre d’envois en cours
  const [failed, setFailed] = useState(new Set())
  const [savedAt, setSavedAt] = useState(null)

  const send = async (key, args) => {
    setSaving(n => n + 1)
    try {
      await notesApi.set(...args)
      setFailed(s => { const n = new Set(s); n.delete(key); return n })
      setSavedAt(Date.now())
    } catch (e) {
      setFailed(s => new Set(s).add(key))
      toast(e.message, 'err')
    } finally { setSaving(n => n - 1) }
  }
  const schedule = (key, args) => {
    const p = pending.current.get(key)
    if (p) clearTimeout(p.timer)
    pending.current.set(key, { args, timer: setTimeout(() => { pending.current.delete(key); send(key, args) }, 600) })
  }
  // en quittant la page, on envoie immédiatement ce qui est en attente
  useEffect(() => () => { for (const [key, p] of pending.current) { clearTimeout(p.timer); notesApi.set(...p.args).catch(() => {}) }; pending.current.clear() }, [])

  const locked = !!classe?.locked?.[trim]
  const onChange = (e, i, k, value) => {
    if (locked) return
    patch(c => withNote(c, e.id, j, trim, k, value))
    if (!validNote(value)) return                 // une valeur invalide n’est jamais envoyée
    schedule(`${e.id}|${matiere.id}|${trim}|${k}`, [e.id, matiere.id, trim, k, value])
  }
  const onKey = (ev, i, k) => {
    if (ev.key !== 'Enter') return
    ev.preventDefault()
    document.querySelector(`[data-r="${i + 1}"][data-k="${k}"]`)?.focus()
  }

  /* ----- statistiques de la matière ----- */
  const stats = useMemo(() => {
    if (!classe || !matiere) return null
    const moys = classe.eleves.map(e => moyMat(e, trim, j)).filter(x => x !== null)
    const filled = classe.eleves.filter(e => hasNote(e, trim, j)).length
    return { filled, total: classe.eleves.length, avg: moys.length ? moys.reduce((a, b) => a + b, 0) / moys.length : null }
  }, [classe, matiere, j, trim])

  if (!loadingClasses && classes.length === 0) {
    return <Empty icon="school" title="Aucune classe"
      text={user.role === 'teacher' ? 'Vous n’avez pas encore de classe. L’administration doit vous affecter une matière.' : 'Créez d’abord une classe.'}>
      {user.role !== 'teacher' && <Link to="/classes" className="btn p">Aller aux classes</Link>}
    </Empty>
  }

  return (
    <Async loading={loadingClasses || loading} error={error} onRetry={reload}>
      {classe && !matiere && <Empty icon="book" title="Aucune matière" text={`Vous n’enseignez aucune matière en ${classe.name}.`} />}
      {classe && matiere && <>
        <section className="card">
          <h2><Icon name="edit" /> Saisie des notes · {classe.name} · {TR[trim]}</h2>
          <Picker label="Matière" title="Choisir la matière" value={matiere.id}
            options={classe.matieres.map(m => ({ value: m.id, label: m.n, sub: `coef ${m.c}` }))}
            onChange={id => setParams({ m: id })} />
          <div className="prog">
            <div className="prog-t"><span>{stats.filled}/{stats.total} élèves renseignés</span>
              <b>Moyenne de la classe : {f(stats.avg)}</b></div>
            <Bar pct={stats.total ? stats.filled / stats.total * 100 : 0} />
          </div>
          {locked && <div className="alert warn" role="status"><Icon name="lock" size={18} />Ce trimestre est verrouillé (conseil de classe terminé) : les notes ne peuvent plus être modifiées. Seul l’administrateur peut le déverrouiller.</div>}
          <div className={'savebar ' + (failed.size ? 'err' : saving ? 'busy' : 'ok')} role="status">
            {failed.size ? <><Icon name="alert" size={16} /> {failed.size} note(s) non enregistrée(s) — vérifiez la connexion</>
              : saving ? <><span className="spin sm" /> Enregistrement…</>
                : <><Icon name="checkc" size={16} /> {savedAt ? 'Enregistré' : 'Enregistrement automatique'} · la moyenne se calcule seule</>}
          </div>
        </section>

        {classe.eleves.length === 0
          ? <Empty icon="users" title={`Aucun élève en ${classe.name}`}
              text={user.role === 'teacher' ? 'L’administration n’a pas encore enregistré les élèves de cette classe. Ils apparaîtront ici automatiquement.' : 'Enregistrez d’abord les élèves de la classe.'}>
            {user.role !== 'teacher' && <Link to={`/classes/${classe.id}`} className="btn p">Enregistrer les élèves</Link>}</Empty>
          : (
            <section className="card nlist">
              <div className="nhead"><span>Élève</span>{LABELS.map(l => <span key={l}>{l}</span>)}<span>Moy.</span></div>
              {classe.eleves.map((e, i) => {
                const a = getN(e, trim, j), m = moyMat(e, trim, j)
                return (
                  <div className="nrow" key={e.id} style={{ '--k': Math.min(i, 12) }}>
                    <div className="nname"><span className="nidx">{i + 1}</span><span className="nn">{e.n}</span>
                      <button className="vie-btn" onClick={() => setVie(e.id)} aria-label={`Vie scolaire de ${e.n} : retard, comportement, pénalité`} title="Retard, comportement, pénalité">
                        <Icon name="flag" size={15} /><span className="vie-t">Vie scolaire</span>
                        {e.inc.filter(x => x.tr === trim).length > 0 && <span className="vie-n">{e.inc.filter(x => x.tr === trim).length}</span>}
                      </button>
                    </div>
                    {[0, 1, 2].map(k => {
                      const key = `${e.id}|${matiere.id}|${trim}|${k}`
                      const bad = !validNote(a[k]) || failed.has(key)
                      return (
                        <label key={k} className="ncell"><span>{LABELS[k]}</span>
                          <input type="text" inputMode="decimal" placeholder="–" value={a[k]} data-r={i} data-k={k}
                            className={bad ? 'bad' : ''} readOnly={locked} aria-label={`${LABELS[k]} — ${e.n}`}
                            onFocus={ev => ev.target.select()} onKeyDown={ev => onKey(ev, i, k)}
                            onChange={ev => onChange(e, i, k, ev.target.value)} />
                        </label>
                      )
                    })}
                    <span className={'chip nmoy ' + tone(m)}>{f(m)}</span>
                  </div>
                )
              })}
              <p className="mut">Notes de 0 à 20 · virgule ou point · Entrée passe à l’élève suivant.</p>
            </section>
          )}

        {classe.matieres.length > 1 && j < classe.matieres.length - 1 && (
          <button className="btn block" onClick={() => setParams({ m: classe.matieres[j + 1].id })}>
            Matière suivante : {classe.matieres[j + 1].n} <Icon name="arrow" size={16} />
          </button>
        )}
        {vie && classe.eleves.find(x => x.id === vie) && (
          <VieSheet eleve={classe.eleves.find(x => x.id === vie)} classe={classe} tr={trim} onClose={() => setVie(null)} onChanged={refresh} />
        )}
      </>}
    </Async>
  )
}
