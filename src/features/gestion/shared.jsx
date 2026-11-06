import { useState } from 'react'
import Picker from '../../components/ui/Picker'

// Classe choisie par l'utilisateur (la première par défaut, ou celle passée dans l'adresse)
export function useClassChoice(classes, initial = '') {
  const [id, setId] = useState(initial)
  const cur = classes.some(c => c.id === id) ? id : classes[0]?.id || ''
  return [cur, setId]
}

export function ClassPick({ classes, value, onChange, label = 'Classe' }) {
  return (
    <div className="field"><label>{label}</label>
      <Picker label={label} title={`Choisir la ${label.toLowerCase()}`} value={value} searchable={classes.length > 8}
        options={classes.map(c => ({ value: c.id, label: c.name, sub: c.nbEleves != null ? `${c.nbEleves} élève${c.nbEleves > 1 ? 's' : ''}` : undefined }))} onChange={onChange} />
    </div>
  )
}

// Fenêtre coulissante réutilisable (formulaires courts)
export { default as Sheet } from './Sheet'
