import Icon from './Icon'
import { highlightParts } from '../../lib/search'

// Texte avec les mots recherchés surlignés
export function Hl({ text, q }) {
  const parts = highlightParts(String(text ?? ''), q)
  return <>{parts.map((p, i) => (p.hit ? <mark key={i}>{p.t}</mark> : <span key={i}>{p.t}</span>))}</>
}

// Barre de recherche intelligente avec compteur de résultats
export function SearchBox({ value, onChange, count, total, fuzzy, placeholder = 'Rechercher : nom, prénom, matricule…' }) {
  return (
    <div className="sbox">
      <div className="search">
        <Icon name="search" size={18} />
        <input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label="Rechercher un élève" autoComplete="off" />
        {value && <button type="button" className="sclear" onClick={() => onChange('')} aria-label="Effacer la recherche"><Icon name="close" size={16} /></button>}
      </div>
      {value.trim() && (
        <div className="sstat" role="status">
          {count === 0
            ? <>Aucun résultat pour « {value} ». Essayez avec moins de lettres ou un autre mot.</>
            : <><b>{count}</b> résultat{count > 1 ? 's' : ''} sur {total}{fuzzy && <span className="tag gold">résultats approchants</span>}</>}
        </div>
      )}
      {!value.trim() && total > 8 && <div className="sstat mut">Astuce : tapez plusieurs mots, dans n’importe quel ordre.</div>}
    </div>
  )
}

// Numéros de page compacts : 1 … 4 5 6 … 12
function pageNumbers(page, pages) {
  const set = new Set([1, pages, page - 1, page, page + 1])
  const list = [...set].filter(n => n >= 1 && n <= pages).sort((a, b) => a - b)
  const out = []
  list.forEach((n, i) => { if (i && n - list[i - 1] > 1) out.push('…'); out.push(n) })
  return out
}

// Navigation de la liste : pages (ordinateur) ou « Voir plus » (mobile)
export function ListNav({ nav, sizes = [20, 50, 100] }) {
  if (nav.total <= Math.min(...sizes) && nav.pageSize === sizes[0] && !nav.hasMore && nav.pages <= 1) return null
  if (nav.mobile) {
    return (
      <div className="lnav">
        <div className="mut center">{nav.to} élève{nav.to > 1 ? 's' : ''} affiché{nav.to > 1 ? 's' : ''} sur {nav.total}</div>
        {nav.hasMore && <button className="btn block" onClick={nav.more}>Voir plus <span className="mut">({nav.remaining} restant{nav.remaining > 1 ? 's' : ''})</span></button>}
      </div>
    )
  }
  return (
    <nav className="lnav" aria-label="Pagination">
      <span className="mut">{nav.from}–{nav.to} sur {nav.total}</span>
      <div className="lnav-pages">
        <button className="btn sm" disabled={nav.page <= 1} onClick={() => nav.setPage(nav.page - 1)}><Icon name="chev-left" size={14} /> Précédent</button>
        {pageNumbers(nav.page, nav.pages).map((n, i) => n === '…'
          ? <span key={'e' + i} className="mut">…</span>
          : <button key={n} className={'pgn' + (n === nav.page ? ' on' : '')} aria-current={n === nav.page ? 'page' : undefined} onClick={() => nav.setPage(n)}>{n}</button>)}
        <button className="btn sm" disabled={nav.page >= nav.pages} onClick={() => nav.setPage(nav.page + 1)}>Suivant <Icon name="chev-right" size={14} /></button>
      </div>
      <label className="lnav-size">Par page
        <select value={nav.pageSize} onChange={e => nav.setPageSize(Number(e.target.value))}>{sizes.map(s => <option key={s} value={s}>{s}</option>)}</select>
      </label>
    </nav>
  )
}
