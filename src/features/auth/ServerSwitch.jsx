import Picker from '../../components/ui/Picker'
import { apiBase, apiCandidates, apiLabel, apiPreference, selectApi, isLocalUrl } from '../../api'

// Serveur utilisé : « Auto » = le local s'il est lancé, sinon le serveur en ligne.
// Affiché seulement quand plusieurs serveurs sont configurés (VITE_API_URLS).
export default function ServerSwitch() {
  const list = apiCandidates()
  if (list.length < 2) return null
  const base = apiBase()
  const options = [
    { value: 'auto', label: 'Automatique', sub: 'Local d’abord, sinon en ligne' },
    ...list.map(c => ({ value: c.url, label: c.label, sub: c.url.replace(/\/api$/, '') })),
  ]
  return (
    <div className="srv">
      <div className="srv-now"><span className={'srv-dot ' + (isLocalUrl(base) ? 'local' : 'online')} />
        Serveur utilisé : <b>{apiLabel()}</b></div>
      <Picker variant="field" label="Serveur" title="Choisir le serveur" value={apiPreference()} options={options} onChange={selectApi} />
      <p className="mut">Chaque serveur a ses propres comptes et ses propres données. Changer de serveur recharge la page.</p>
    </div>
  )
}
