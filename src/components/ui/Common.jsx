import Icon from './Icon'

export function Empty({ icon = 'info', title, text, children }) {
  return (
    <section className="card empty">
      <Icon name={icon} size={32} />
      {title && <h2>{title}</h2>}
      {text && <p className="mut">{text}</p>}
      {children}
    </section>
  )
}

export function Bar({ pct, tone }) {
  return <div className={'bar' + (tone ? ' ' + tone : '') + (pct >= 100 ? ' full' : '')}><i style={{ width: Math.max(0, Math.min(100, pct)) + '%' }} /></div>
}

export const Loading = ({ text = 'Chargement…' }) => (
  <div className="loading" role="status"><span className="spin" />{text}</div>
)

export function ErrorBox({ message, onRetry }) {
  return (
    <section className="card empty">
      <Icon name="alert" size={32} />
      <h2>Une erreur est survenue</h2>
      <p className="mut">{message}</p>
      {onRetry && <button className="btn p" onClick={onRetry}>Réessayer</button>}
    </section>
  )
}

// Affiche le chargement / l’erreur, sinon le contenu
export function Async({ loading, error, onRetry, children }) {
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} onRetry={onRetry} />
  return children
}
