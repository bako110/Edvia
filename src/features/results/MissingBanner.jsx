import Icon from '../../components/ui/Icon'
import { missingMatieres } from '../../lib/calc'

// Signale les matières dont les notes n’ont pas (toutes) été renseignées, et par qui elles doivent l’être
export default function MissingBanner({ classe, period }) {
  const miss = missingMatieres(classe, period)
  if (!miss.length) return null
  return (
    <section className="card miss noprint" role="alert">
      <h2><Icon name="alert" /> Notes manquantes — résultats provisoires</h2>
      <ul>
        {miss.map(({ matiere: m, filled, total }) => (
          <li key={m.id}>
            <b>{m.n}</b> — {m.teacherName
              ? <>{m.teacherName} {filled === 0 ? 'n’a pas renseigné les notes' : `a renseigné ${filled} élève(s) sur ${total}`}</>
              : <span className="tag gold">aucun enseignant affecté</span>}
          </li>
        ))}
      </ul>
      <p className="mut">Les moyennes et les rangs seront définitifs quand toutes les notes seront saisies.</p>
    </section>
  )
}
