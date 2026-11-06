import Icon from '../../components/ui/Icon'
import { Bar } from '../../components/ui/Common'
import { missingMatieres } from '../../lib/calc'

// Signale les matières dont les notes n’ont pas (toutes) été renseignées, et par qui elles doivent l’être
export default function MissingBanner({ classe, period }) {
  const miss = missingMatieres(classe, period)
  if (!miss.length) return null
  return (
    <section className="card mnote noprint" role="alert">
      <header className="mnote-h">
        <span className="mnote-ic"><Icon name="edit" size={20} /></span>
        <div><h2>Notes à compléter</h2><div className="mut">Résultats provisoires : {miss.length} matière{miss.length > 1 ? 's' : ''} incomplète{miss.length > 1 ? 's' : ''}</div></div>
        <span className="count">{miss.length}</span>
      </header>
      <div className="mnote-list">
        {miss.map(({ matiere: m, filled, total }) => (
          <div className="mnote-row" key={m.id}>
            <div className="mnote-top">
              <b>{m.n}</b>
              {m.teacherName
                ? <span className="mnote-who"><span className="avatar">{m.teacherName[0]}</span>{m.teacherName}</span>
                : <span className="tag neutral">aucun enseignant affecté</span>}
            </div>
            <Bar pct={total ? filled / total * 100 : 0} />
            <span className="mut">{filled === 0 ? 'Aucune note saisie' : `${filled} élève${filled > 1 ? 's' : ''} sur ${total}`}</span>
          </div>
        ))}
      </div>
      <p className="mnote-foot"><Icon name="info" size={14} /> Les moyennes et les rangs seront définitifs quand toutes les notes seront saisies.</p>
    </section>
  )
}
