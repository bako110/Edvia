import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { Ring, CountUp } from '../../components/ui/Widgets'
import { Async, Bar } from '../../components/ui/Common'
import { useAuth } from '../../context/AuthContext'
import { useClasses } from '../../context/ClassesContext'
import { useView } from '../../context/ViewContext'
import { useStatus } from '../../hooks/useStatus'
import { TR } from '../../lib/calc'

const pct = (a, b) => (b ? Math.round(a / b * 100) : 0)

// Avancement de la saisie des notes, classe par classe
function ClassProgress({ rows }) {
  const by = new Map()
  for (const r of rows) {
    const c = by.get(r.classId) || { id: r.classId, name: r.className, filled: 0, total: 0, late: 0 }
    c.filled += r.filled; c.total += r.total
    if (r.total && r.filled < r.total) c.late++
    by.set(r.classId, c)
  }
  const list = [...by.values()]
  if (!list.length) return null
  return (
    <section className="card">
      <h2><Icon name="chart" /> Avancement par classe</h2>
      {list.map(c => (
        <Link to={`/classes/${c.id}`} className="cprog" key={c.id}>
          <div className="cprog-h"><b>{c.name}</b><span className="mut">{pct(c.filled, c.total)} % · {c.late ? `${c.late} matière(s) à compléter` : 'complet'}</span></div>
          <Bar pct={pct(c.filled, c.total)} />
        </Link>
      ))}
    </section>
  )
}

// Regroupe les matières en retard par enseignant
function lateByTeacher(rows) {
  const map = new Map()
  for (const r of rows) {
    if (!r.total || r.filled >= r.total || !r.teacherId) continue
    if (!map.has(r.teacherId)) map.set(r.teacherId, { id: r.teacherId, name: r.teacherName, active: r.teacherActive, items: [] })
    map.get(r.teacherId).items.push(r)
  }
  return [...map.values()].sort((a, b) => b.items.length - a.items.length)
}

export default function AdminDashboard() {
  const { school, user } = useAuth()
  const { classes } = useClasses()
  const { trim } = useView()
  const { rows, loading, error, reload } = useStatus(trim)
  const isAdmin = user.role === 'admin'

  const counted = rows.filter(r => r.total > 0)
  const done = counted.reduce((s, r) => s + r.filled, 0), all = counted.reduce((s, r) => s + r.total, 0)
  const late = lateByTeacher(rows)
  const orphan = rows.filter(r => !r.teacherId)
  const nbEleves = classes.reduce((s, c) => s + c.nbEleves, 0)
  const orphanByClass = [...orphan.reduce((m, r) => m.set(r.classId, { id: r.classId, name: r.className, items: [...(m.get(r.classId)?.items || []), r] }), new Map()).values()]
  const teachers = new Set(rows.filter(r => r.teacherId).map(r => r.teacherId)).size

  const steps = [
    { ok: school.name && (school.logo || school.slogan || school.proviseur), t: 'Personnaliser l’établissement', d: 'Logo, couleurs, proviseur.', to: '/account' },
    { ok: classes.length > 0, t: 'Créer les classes', d: 'Chaque classe reçoit ses matières par défaut.', to: '/classes' },
    { ok: teachers > 0, t: 'Créer les comptes des enseignants', d: 'Identifiant et mot de passe provisoire.', to: '/team' },
    { ok: nbEleves > 0, t: 'Ajouter les élèves', d: 'Saisie manuelle ou import d’un fichier Excel / PDF.', to: '/classes' },
  ]

  const needsOnboard = isAdmin && steps.some(s => !s.ok)

  return <>
    <section className="hero">
      <div>
        <div className="hero-k">{TR[trim]}</div>
        <h2>{school.name}</h2>
        <div className="hero-s">{classes.length} classe{classes.length > 1 ? 's' : ''} · {nbEleves} élève{nbEleves > 1 ? 's' : ''}</div>
        <div className="hero-a">
          <Link to="/results" className="btn gold"><Icon name="trophy" size={18} /> Résultats</Link>
          <Link to="/bulletins" className="btn ghost"><Icon name="file" size={18} /> Bulletins</Link>
        </div>
      </div>
      <Ring pct={pct(done, all)} label="saisi" />
    </section>

    <div className="kpis">
      <div className="kpi"><Icon name="school" /><b><CountUp value={classes.length} decimals={0} /></b><span>Classes</span></div>
      <div className="kpi"><Icon name="users" /><b><CountUp value={nbEleves} decimals={0} /></b><span>Élèves</span></div>
      <div className="kpi"><Icon name="user" /><b><CountUp value={teachers} decimals={0} /></b><span>Enseignants actifs</span></div>
      <div className="kpi"><Icon name="check" /><b><CountUp value={pct(done, all)} decimals={0} suffix=" %" /></b><span>Notes saisies</span></div>
    </div>

    <div className="dgrid">
      <Async loading={loading} error={error} onRetry={reload}>
        <section className="card">
          <h2><Icon name="bell" /> Notes à relancer · {TR[trim]}</h2>
          {late.length === 0 && orphan.length === 0 && (
            <div className="allgood"><Icon name="checkc" size={26} /><div><b>Tout est à jour</b><div className="mut">Tous les enseignants ont renseigné leurs notes pour ce trimestre.</div></div></div>
          )}
          {late.map(t => (
            <div className="late" key={t.id}>
              <div className="late-h"><span className="avatar">{t.name?.[0]}</span><b>{t.name}</b>
                {!t.active && <span className="tag ko">compte désactivé</span>}
                <span className="tag ko">{t.items.length} matière{t.items.length > 1 ? 's' : ''} incomplète{t.items.length > 1 ? 's' : ''}</span></div>
              {t.items.map(r => (
                <div className="late-r" key={r.classId + r.matiereId}>
                  <span>{r.matiereName} · <b>{r.className}</b></span>
                  <span className="mut">{r.filled === 0 ? 'n’a rien renseigné' : `${r.filled}/${r.total} élèves`}</span>
                  <Bar pct={pct(r.filled, r.total)} tone={r.filled === 0 ? 'bad' : ''} />
                </div>
              ))}
            </div>
          ))}
          {orphan.length > 0 && (
            <div className="orph">
              <header className="mnote-h">
                <span className="mnote-ic"><Icon name="user" size={20} /></span>
                <div><h3>Matières sans enseignant</h3><div className="mut">{orphanByClass.length} classe{orphanByClass.length > 1 ? 's' : ''} concernée{orphanByClass.length > 1 ? 's' : ''}</div></div>
                <span className="count">{orphan.length}</span>
              </header>
              <div className="orph-list">
                {orphanByClass.map(c => (
                  <div className="orph-row" key={c.name}>
                    <b>{c.name}</b>
                    <div className="orph-chips">{c.items.map(r => <span className="orph-chip" key={r.matiereId}>{r.matiereName}</span>)}</div>
                    {isAdmin && <Link to={`/classes/${c.id}`} className="btn sm" aria-label={`Affecter les enseignants de ${c.name}`}>Affecter <Icon name="arrow" size={14} /></Link>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </Async>
      <aside className={'aside' + (needsOnboard ? ' has-onboard' : '')}>
      {needsOnboard && (
        <section className="card onboard">
          <h2><Icon name="target" /> Pour démarrer</h2>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={i} className={s.ok ? 'done' : ''} style={{ '--k': i }}>
                <span className="step-n">{s.ok ? <Icon name="check" size={16} /> : i + 1}</span>
                <div><b>{s.t}</b><div className="mut">{s.d}</div></div>
                {!s.ok && <Link to={s.to} className="btn sm">Ouvrir <Icon name="arrow" size={14} /></Link>}
              </li>
            ))}
          </ol>
        </section>
      )}
      <ClassProgress rows={rows} />
      </aside>
    </div>
  </>
}
