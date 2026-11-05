import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { Async, Empty } from '../../components/ui/Common'
import MissingBanner from './MissingBanner'
import { useFullClass } from './useFullClass'
import { useToast } from '../../context/Feedback'
import { PERIODS, ANNUAL, calc, f, rk, appr, mention, decision, tone, missingFor } from '../../lib/calc'
import { download, toCSV, slug } from '../../lib/files'
import { useMedia } from '../../hooks/useMedia'
import { usePaged } from '../../hooks/usePaged'
import { smartFilter } from '../../lib/search'
import { Hl, SearchBox, ListNav } from '../../components/ui/ListTools'

export default function ResultsPage() {
  const { classe, loading, error, reload, period, hasClasses, loadingList } = useFullClass()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('rang')

  if (!loadingList && !hasClasses) {
    return <Empty icon="trophy" title="Aucune classe à consulter" text="Les résultats sont réservés à l’administration, au personnel et aux professeurs principaux.">
      <Link to="/" className="btn p">Retour à l’accueil</Link></Empty>
  }

  return (
    <Async loading={loading} error={error} onRetry={reload}>
      {classe && <Results classe={classe} period={period} q={q} setQ={setQ} sort={sort} setSort={setSort} toast={toast} />}
    </Async>
  )
}

function Results({ classe, period, q, setQ, sort, setSort, toast }) {
  const annual = period === ANNUAL
  const mobile = useMedia('(max-width: 699px)')
  const nav = useNavigate()
  const r = calc(classe, period)
  const sorted = [...r.list].sort((a, b) => sort === 'nom' ? a.e.n.localeCompare(b.e.n, 'fr') : (a.rang || 999) - (b.rang || 999) || a.e.n.localeCompare(b.e.n, 'fr'))
  const found = smartFilter(sorted, q, o => `${o.e.n} ${o.e.matricule || ''}`)
  const rows = found.items
  const list = usePaged(rows, { size: 20, resetKey: q + sort + classe.id + period })
  const open = id => nav(`/classes/${classe.id}/eleves/${id}?tab=bulletin`)

  const exportCSV = () => {
    const head = annual ? ['Rang', 'Élève', 'T1', 'T2', 'T3', 'Moyenne annuelle', 'Décision'] : ['Rang', 'Élève', 'Moyenne', 'Appréciation', 'Mention']
    const body = [...r.list].sort((a, b) => (a.rang || 999) - (b.rang || 999)).map(o => annual
      ? [rk(o.rang), o.e.n, ...o.t.map(x => f(x)), f(o.moy), decision(o.moy)]
      : [rk(o.rang), o.e.n, f(o.moy), appr(o.moy), mention(o.moy)])
    download(`resultats-${slug(classe.name)}-${slug(PERIODS[period])}.csv`, toCSV([head, ...body]), 'text/csv')
    toast('Fichier CSV téléchargé')
  }

  if (!classe.eleves.length) {
    return <Empty icon="users" title={`Aucun élève en ${classe.name}`} text="Ajoutez des élèves puis faites saisir les notes." />
  }

  return <>
    <MissingBanner classe={classe} period={period} />
    <div className="kpis">
      <div className="kpi"><Icon name="users" /><b>{r.tot}</b><span>Classés</span></div>
      <div className="kpi"><Icon name="chart" /><b>{f(r.cm)}</b><span>Moy. classe</span></div>
      <div className="kpi"><Icon name="star" /><b>{f(r.max)}</b><span>Max</span></div>
      <div className="kpi"><Icon name="target" /><b>{r.tot ? Math.round(r.pass / r.tot * 100) + ' %' : '—'}</b><span>Réussite</span></div>
    </div>

    <section className="card">
      <h2><Icon name="trophy" /> Classement · {classe.name} · {PERIODS[period]}</h2>
      <SearchBox value={q} onChange={setQ} count={rows.length} total={r.list.length} fuzzy={found.fuzzy} />
      <div className="tools">
        <div className="seg sm">
          <button className={sort === 'rang' ? 'on' : ''} onClick={() => setSort('rang')}>Par rang</button>
          <button className={sort === 'nom' ? 'on' : ''} onClick={() => setSort('nom')}>A–Z</button>
        </div>
        <button className="btn" onClick={exportCSV}><Icon name="download" size={16} /> CSV</button>
      </div>

      {mobile ? (
        <ol className="rlist">
          {list.shown.map(o => {
            const miss = missingFor(o.e, classe, period)
            return (
              <li className="ritem" key={o.e.id} onClick={() => open(o.e.id)} role="link" tabIndex={0} onKeyDown={ev => ev.key === 'Enter' && open(o.e.id)}>
                <span className={'rrank' + (o.rang && o.rang <= 3 ? ' top' : '')}>{rk(o.rang)}</span>
                <div className="rname"><Hl text={o.e.n} q={q} /></div>
                <span className={'chip rmoy ' + tone(o.moy)}>{f(o.moy)}</span>
                <div className="rsub">
                  {annual
                    ? <><span>T1 {f(o.t[0])} · T2 {f(o.t[1])} · T3 {f(o.t[2])}</span>{o.moy !== null && <span className={'tag ' + (o.moy >= 10 ? 'ok' : 'ko')}>{decision(o.moy)}</span>}</>
                    : <>{appr(o.moy) && <span>{appr(o.moy)}</span>}{mention(o.moy) && <span className="tag gold">{mention(o.moy)}</span>}</>}
                  {miss.length > 0 && <span className="tag neutral" title={'Notes manquantes : ' + miss.map(m => m.n).join(', ')}>provisoire</span>}
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
      <div className="sc"><table>
        <thead>{annual
          ? <tr><th>Rang</th><th className="l">Élève</th><th>T1</th><th>T2</th><th>T3</th><th>Moy. annuelle</th><th>Décision</th></tr>
          : <tr><th>Rang</th><th className="l">Élève</th><th>Moyenne</th><th>Appréciation</th><th>Mention</th></tr>}</thead>
        <tbody>{list.shown.map(o => {
          const miss = missingFor(o.e, classe, period)
          return (
            <tr key={o.e.id} className="click" onClick={() => open(o.e.id)} tabIndex={0} onKeyDown={ev => ev.key === 'Enter' && open(o.e.id)}>
              <td><span className={'rk' + (o.rang && o.rang <= 3 ? ' top' : '')}>{rk(o.rang)}</span></td>
              <td className="l"><Hl text={o.e.n} q={q} />{miss.length > 0 && <span className="tag gold" title={'Notes manquantes : ' + miss.map(m => m.n).join(', ')}> provisoire</span>}</td>
              {annual && o.t.map((x, i) => <td key={i} className="mut-c">{f(x)}</td>)}
              <td><span className={'chip ' + tone(o.moy)}>{f(o.moy)}</span></td>
              {annual
                ? <td>{o.moy === null ? '' : <span className={'tag ' + (o.moy >= 10 ? 'ok' : 'ko')}>{decision(o.moy)}</span>}{o.moy !== null && o.n < 3 && <span className="mut"> (provisoire)</span>}</td>
                : <><td>{appr(o.moy)}</td><td>{mention(o.moy) && <span className="tag gold">{mention(o.moy)}</span>}</td></>}
            </tr>
          )
        })}</tbody>
      </table></div>
      )}
      <ListNav nav={list} />
      <p className="mut">Touchez un élève pour ouvrir sa fiche : bulletin, notes et vie scolaire.</p>
      {annual && <p className="mut">La moyenne annuelle est la moyenne des trimestres renseignés. Admission à partir de 10/20.</p>}
    </section>
  </>
}
