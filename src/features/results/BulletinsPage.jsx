import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { Async, Empty } from '../../components/ui/Common'
import MissingBanner from './MissingBanner'
import { Sheet } from './Sheets'
import { useFullClass } from './useFullClass'
import { useObservations } from './useObservations'
import { useAuth } from '../../context/AuthContext'
import { usePaged } from '../../hooks/usePaged'
import { smartFilter } from '../../lib/search'
import { Hl, SearchBox, ListNav } from '../../components/ui/ListTools'
import { PERIODS, calc, f, rk, tone, missingFor } from '../../lib/calc'

/*
 * Bulletins : une LISTE légère d'élèves. Un clic ouvre la fiche de l'élève (bulletin, notes, vie scolaire).
 * Les bulletins de toute la classe ne sont assemblés qu'au moment d'imprimer (jamais affichés tous ensemble).
 */
function BulletinList({ classe, period, patch }) {
  const { school } = useAuth()
  const obsProps = useObservations(classe, patch)
  const r = calc(classe, period)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('rang')
  const [printing, setPrinting] = useState(false)

  const sorted = [...r.list].sort((a, b) => sort === 'nom' ? a.e.n.localeCompare(b.e.n, 'fr') : (a.rang || 9999) - (b.rang || 9999) || a.e.n.localeCompare(b.e.n, 'fr'))
  const found = smartFilter(sorted, q, o => `${o.e.n} ${o.e.matricule || ''}`)
  const rows = found.items
  const list = usePaged(rows, { size: 20, resetKey: q + sort + classe.id + period })
  const incomplete = r.list.filter(o => missingFor(o.e, classe, period).length > 0).length

  // Impression de la classe entière : on monte les feuilles seulement maintenant, hors écran, puis on lance l'impression
  useEffect(() => {
    if (!printing) return
    const end = () => setPrinting(false)
    window.addEventListener('afterprint', end, { once: true })
    const t = setTimeout(async () => { try { await document.fonts?.ready } catch { /* ignore */ } window.print() }, 500)
    return () => { clearTimeout(t); window.removeEventListener('afterprint', end) }
  }, [printing])

  if (!r.list.length) return <Empty icon="users" title={`Aucun élève en ${classe.name}`} text="L’administration doit d’abord enregistrer les élèves, puis les professeurs saisissent les notes." />

  return <>
    <MissingBanner classe={classe} period={period} />

    <section className="card noprint">
      <h2><Icon name="file" /> Bulletins · {classe.name} · {PERIODS[period]}</h2>
      <p className="mut">Choisissez un élève pour voir son bulletin, ses notes et sa vie scolaire. {incomplete > 0 && <b>{incomplete} bulletin{incomplete > 1 ? 's' : ''} provisoire{incomplete > 1 ? 's' : ''} (notes manquantes).</b>}</p>
      <div className="act">
        <button className="btn p" disabled={printing} onClick={() => setPrinting(true)}>
          <Icon name="print" size={18} /> {printing ? 'Préparation…' : `Imprimer toute la classe (${r.list.length})`}
        </button>
        <span className="mut">Une feuille A4 par élève. Pour un fichier, choisissez « Enregistrer au format PDF ».</span>
      </div>
    </section>

    <section className="card noprint">
      <SearchBox value={q} onChange={setQ} count={rows.length} total={r.list.length} fuzzy={found.fuzzy} />
      <div className="tools">
        <div className="seg sm">
          <button className={sort === 'rang' ? 'on' : ''} onClick={() => setSort('rang')}>Par rang</button>
          <button className={sort === 'nom' ? 'on' : ''} onClick={() => setSort('nom')}>A–Z</button>
        </div>
      </div>
      <ol className="slist">
        {list.shown.map(o => {
          const miss = missingFor(o.e, classe, period)
          return (
            <li key={o.e.id}>
              <Link className="srow" to={`/classes/${classe.id}/eleves/${o.e.id}?tab=bulletin`}>
                <span className={'rrank' + (o.rang && o.rang <= 3 ? ' top' : '')}>{rk(o.rang)}</span>
                <span className="sname"><b><Hl text={o.e.n} q={q} /></b>{o.e.matricule && <span className="mut">{o.e.matricule}</span>}{miss.length > 0 && <span className="tag neutral">provisoire</span>}</span>
                <span className={'chip ' + tone(o.moy)}>{f(o.moy)}</span>
                <Icon name="chev-right" size={16} className="sgo" />
              </Link>
            </li>
          )
        })}
      </ol>
      <ListNav nav={list} />
    </section>

    {printing && (
      <div className="print-batch stage" aria-hidden="true">
        <div className="stage-in">
          {r.list.map((o, i) => <Sheet key={o.e.id} period={period} school={school} classe={classe} r={r} o={o} index={i + 1} total={r.list.length} obsProps={obsProps} />)}
        </div>
      </div>
    )}
  </>
}

export default function BulletinsPage() {
  const { classe, loading, error, reload, patch, period, hasClasses, loadingList } = useFullClass()
  if (!loadingList && !hasClasses) {
    return <Empty icon="file" title="Aucune classe à consulter" text="Les bulletins sont réservés à l’administration, au personnel et aux professeurs principaux.">
      <Link to="/" className="btn p">Retour à l’accueil</Link></Empty>
  }
  return <Async loading={loading} error={error} onRetry={reload}>{classe && <BulletinList classe={classe} period={period} patch={patch} />}</Async>
}
