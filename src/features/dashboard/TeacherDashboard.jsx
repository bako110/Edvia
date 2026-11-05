import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { Ring } from '../../components/ui/Widgets'
import { Async, Bar, Empty } from '../../components/ui/Common'
import { useAuth } from '../../context/AuthContext'
import { useClasses } from '../../context/ClassesContext'
import { useView } from '../../context/ViewContext'
import { useStatus } from '../../hooks/useStatus'
import { TR } from '../../lib/calc'

const pct = (a, b) => (b ? Math.round(a / b * 100) : 0)

// Accueil enseignant : uniquement SES matières, dans SES classes
export default function TeacherDashboard() {
  const { user } = useAuth()
  const { fullAccess } = useClasses()
  const { trim, setClassId } = useView()
  const { rows, loading, error, reload } = useStatus(trim)
  const nav = useNavigate()

  const done = rows.reduce((s, r) => s + r.filled, 0), all = rows.reduce((s, r) => s + r.total, 0)
  const open = r => { setClassId(r.classId); nav(`/notes?m=${r.matiereId}`) }

  return <>
    <section className="hero">
      <div>
        <div className="hero-k">{TR[trim]}</div>
        <h2>Bonjour {user.name.split(' ')[0]}</h2>
        <div className="hero-s">{rows.length} matière{rows.length > 1 ? 's' : ''} à votre charge</div>
        <div className="hero-a">
          <Link to="/notes" className="btn gold"><Icon name="edit" size={18} /> Saisir les notes</Link>
          <Link to="/classes" className="btn ghost"><Icon name="users" size={18} /> Mes élèves</Link>
        </div>
      </div>
      <Ring pct={pct(done, all)} label="saisi" />
    </section>

    <div className="dgrid even">
    <Async loading={loading} error={error} onRetry={reload}>
      {rows.length === 0 ? (
        <Empty icon="book" title="Aucune matière affectée" text="L’administration ne vous a pas encore affecté de matière. Contactez-la pour recevoir vos classes." />
      ) : (
        <section className="card">
          <h2><Icon name="book" /> Mes matières · {TR[trim]}</h2>
          <div className="mylist">
            {rows.map(r => {
              const complete = r.total > 0 && r.filled >= r.total
              return (
                <button key={r.classId + r.matiereId} className="mycard" onClick={() => open(r)}>
                  <div className="mycard-h">
                    <b>{r.matiereName}</b><span className="tag">{r.className}</span>
                    {complete ? <span className="tag ok">complet</span> : r.total > 0 && <span className="tag gold">à compléter</span>}
                  </div>
                  <div className="mut">{r.total === 0 ? 'Aucun élève dans la classe' : `${r.filled}/${r.total} élèves renseignés`}</div>
                  <Bar pct={pct(r.filled, r.total)} />
                </button>
              )
            })}
          </div>
        </section>
      )}
    </Async>

    {fullAccess.length > 0 && (
      <section className="card">
        <h2><Icon name="shield" /> Professeur principal</h2>
        <p className="mut">Vous suivez les résultats et les bulletins de : <b>{fullAccess.map(c => c.name).join(', ')}</b>.</p>
        <div className="act">
          <Link to="/results" className="btn"><Icon name="trophy" size={16} /> Résultats</Link>
          <Link to="/bulletins" className="btn"><Icon name="file" size={16} /> Bulletins</Link>
        </div>
      </section>
    )}
    </div>
  </>
}
