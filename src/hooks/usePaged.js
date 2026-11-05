import { useEffect, useState } from 'react'
import { useMedia } from './useMedia'

/*
 * Pagination d'une longue liste (jamais toute la liste d'un coup, pour ne pas saturer l'appareil)
 *  - ordinateur : pages numérotées
 *  - mobile     : « Voir plus » qui ajoute la page suivante à la suite
 * resetKey : quand il change (recherche, tri, classe…), on revient au début.
 */
export function usePaged(items, { size = 20, resetKey = '' } = {}) {
  const mobile = useMedia('(max-width: 699px)')
  const [pageSize, setPageSize] = useState(size)
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(size)
  useEffect(() => { setPage(1); setCount(pageSize) }, [resetKey, pageSize])

  const total = items.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const p = Math.min(page, pages)
  const shown = mobile ? items.slice(0, count) : items.slice((p - 1) * pageSize, p * pageSize)
  return {
    shown, mobile, total, page: p, pages, setPage, pageSize, setPageSize,
    from: total ? (mobile ? 1 : (p - 1) * pageSize + 1) : 0,
    to: mobile ? Math.min(count, total) : Math.min(p * pageSize, total),
    hasMore: count < total, remaining: Math.max(0, total - count), more: () => setCount(c => c + pageSize),
  }
}
