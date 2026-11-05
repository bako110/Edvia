import { useLocation } from 'react-router-dom'
import { useClasses } from '../context/ClassesContext'
import { useView, pickClass } from '../context/ViewContext'
import { selectorsFor } from '../config/navigation'
import { PERIODS, TR } from '../lib/calc'

// Sélecteurs Classe / Période de la page courante (partagés par l’en-tête mobile et la barre web)
export function useSelectors() {
  const { classes, fullAccess } = useClasses()
  const { classId, setClassId, period, setPeriod, trim } = useView()
  const { pathname } = useLocation()
  const sel = selectorsFor(pathname)
  if (!sel) return null
  const list = sel.classes === 'full' ? fullAccess : classes
  const cur = pickClass(list, classId)
  return {
    classes: sel.classes && list.length > 0
      ? { value: cur?.id, options: list.map(c => ({ value: c.id, label: c.name })), onChange: setClassId } : null,
    period: {
      value: sel.annual ? period : trim,
      options: (sel.annual ? PERIODS : TR).map((p, i) => ({ value: i, label: p })),
      onChange: setPeriod,
    },
  }
}
