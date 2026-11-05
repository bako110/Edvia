import { useClasses } from '../../context/ClassesContext'
import { useView, pickClass } from '../../context/ViewContext'
import { useClasse } from '../../hooks/useClasse'

// Classe sélectionnée parmi celles dont l’utilisateur a la consultation COMPLÈTE
// (administration, personnel, ou professeur principal) + ses données
export function useFullClass() {
  const { fullAccess, loading: loadingList } = useClasses()
  const { classId, period } = useView()
  const cur = pickClass(fullAccess, classId)
  const data = useClasse(cur?.id)
  return { ...data, cur, period, hasClasses: fullAccess.length > 0, loadingList, loading: loadingList || data.loading }
}
