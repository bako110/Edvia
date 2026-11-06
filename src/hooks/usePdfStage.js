import { useEffect, useRef, useState } from 'react'
import { useToast } from '../context/Feedback'
import { elementsToPdf } from '../lib/pdf'

/*
 * Téléchargement PDF d'un ensemble de feuilles.
 *   const pdf = usePdfStage()
 *   pdf.start({ name: 'Bulletins.pdf', selector: '.sheet', orientation: 'portrait', ...données })
 *   {pdf.job && <div ref={pdf.stageRef} className="print-batch stage">…les feuilles à photographier…</div>}
 * Les feuilles sont montées hors écran, converties une à une, puis retirées.
 */
export function usePdfStage() {
  const toast = useToast()
  const [job, setJob] = useState(null)
  const stageRef = useRef(null)

  useEffect(() => {
    if (!job) return
    let dead = false
    ;(async () => {
      try {
        try { await document.fonts?.ready } catch { /* ignore */ }
        await new Promise(r => setTimeout(r, 200))   // laisse les feuilles se dessiner
        await elementsToPdf([...stageRef.current.querySelectorAll(job.selector)], job)
        if (!dead) toast('PDF téléchargé')
      } catch (e) { if (!dead) toast(e.message || 'Création du PDF impossible', 'err') }
      finally { if (!dead) setJob(null) }
    })()
    return () => { dead = true }
  }, [job]) // eslint-disable-line

  return { job, busy: !!job, start: setJob, stageRef }
}
