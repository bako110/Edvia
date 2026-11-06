/*
 * Génération directe de fichiers PDF (aucune fenêtre d'impression) : chaque feuille HTML est photographiée puis
 * placée sur une page A4. Les bibliothèques sont chargées à la demande (elles n'alourdissent pas le démarrage).
 */
export async function elementsToPdf(elements, { name, orientation = 'portrait' }) {
  if (!elements.length) throw new Error('Rien à exporter')
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')])
  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4', compress: true })
  const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight()
  for (let i = 0; i < elements.length; i++) {
    const canvas = await html2canvas(elements[i], { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false })
    if (i > 0) pdf.addPage()
    // la feuille occupe toute la page en gardant ses proportions
    const ratio = Math.min(W / canvas.width, H / canvas.height)
    const w = canvas.width * ratio, h = canvas.height * ratio
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', (W - w) / 2, 0, w, h, undefined, 'FAST')
    await new Promise(r => setTimeout(r, 0))   // laisse l'interface respirer entre deux feuilles
  }
  pdf.save(name)
}
