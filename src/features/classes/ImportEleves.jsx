import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import { Field } from '../../components/ui/Field'
import { useToast } from '../../context/Feedback'
import { elevesApi } from '../../api'
import { norm } from '../../lib/calc'
import { readFileRows, extractEleves, downloadTemplate } from '../../lib/importEleves'

const toLine = e => (e.matricule ? `${e.name} ; ${e.matricule}` : e.name)

// Enregistrement des élèves d'une classe : saisie manuelle ou import Excel / CSV / PDF (avec aperçu à valider)
export default function ImportEleves({ classe, onDone }) {
  const toast = useToast()
  const [tab, setTab] = useState('file')
  const [one, setOne] = useState({ name: '', matricule: '' })
  const [txt, setTxt] = useState('')
  const [items, setItems] = useState(null)     // aperçu de l'import
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)

  const existing = new Set(classe.eleves.map(e => norm(e.n)))

  // envoie par paquets de 400 (limite du serveur)
  const send = async lines => {
    setBusy(true); setError('')
    try {
      let added = 0, skipped = 0
      for (let i = 0; i < lines.length; i += 400) { const r = await elevesApi.add(classe.id, lines.slice(i, i + 400)); added += r.added; skipped += r.skipped }
      toast(`${added} élève(s) enregistré(s)${skipped ? ` · ${skipped} déjà présent(s)` : ''}`)
      onDone(); return true
    } catch (e) { setError(e.message); return false } finally { setBusy(false) }
  }

  const addOne = async () => { if (await send([toLine({ name: one.name.replace(/;/g, ' '), matricule: one.matricule.replace(/;/g, ' ') })])) setOne({ name: '', matricule: '' }) }
  const lines = txt.split('\n').map(x => x.trim()).filter(Boolean)
  const addList = async () => { if (await send(lines)) setTxt('') }

  const readFile = async file => {
    if (!file) return
    setBusy(true); setError(''); setItems(null); setFileName(file.name)
    try {
      const found = extractEleves(await readFileRows(file))
      if (!found.length) throw new Error('Aucun élève détecté dans ce fichier. Vérifiez qu’il contient une colonne « Nom » (et « Prénoms »), ou utilisez le modèle.')
      setItems(found.map((e, i) => ({ ...e, id: i, dup: existing.has(norm(e.name)), keep: !existing.has(norm(e.name)) })))
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const patch = (id, p) => setItems(l => l.map(x => (x.id === id ? { ...x, ...p } : x)))
  const kept = items?.filter(i => i.keep && i.name.trim()) || []
  const confirm = async () => { if (await send(kept.map(toLine))) { setItems(null); setFileName('') } }

  return (
    <section className="card">
      <h2><Icon name="plus" /> Enregistrer les élèves</h2>
      <p className="mut">C’est l’administration qui enregistre les élèves. Les enseignants de la classe les retrouvent automatiquement chargés dès leur connexion.</p>

      <div className="seg">
        <button className={tab === 'file' ? 'on' : ''} onClick={() => setTab('file')}><Icon name="upload" size={16} /> Importer un fichier</button>
        <button className={tab === 'manual' ? 'on' : ''} onClick={() => setTab('manual')}><Icon name="edit" size={16} /> Saisie manuelle</button>
      </div>

      {tab === 'manual' && <>
        <div className="row mrow">
          <Field label="Nom et prénoms" value={one.name} onChange={e => setOne({ ...one, name: e.target.value })} placeholder="OUEDRAOGO Awa" maxLength={100} />
          <Field label="Matricule (facultatif)" value={one.matricule} onChange={e => setOne({ ...one, matricule: e.target.value })} placeholder="123456A" maxLength={30} />
        </div>
        <button className="btn p" disabled={busy || !one.name.trim()} onClick={addOne}><Icon name="plus" size={16} /> Ajouter cet élève</button>
        <label>Ou coller toute une liste (un élève par ligne : « NOM Prénoms » ou « NOM Prénoms ; matricule »)</label>
        <textarea rows="5" value={txt} onChange={e => setTxt(e.target.value)} placeholder={'OUEDRAOGO Awa\nSAWADOGO Ibrahim ; 123456A\nKABORE Fatimata'} />
        <div className="act"><button className="btn p" disabled={busy || !lines.length} onClick={addList}><Icon name="plus" size={16} /> Ajouter {lines.length || ''} élève{lines.length > 1 ? 's' : ''}</button></div>
      </>}

      {tab === 'file' && !items && <>
        <label className={'drop' + (drag ? ' on' : '')} onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); readFile(e.dataTransfer.files[0]) }}>
          <Icon name="upload" size={30} />
          <b>{busy ? 'Lecture du fichier…' : 'Choisir ou déposer un fichier'}</b>
          <span className="mut">Excel (.xlsx) · CSV · PDF — la liste est détectée automatiquement puis vous la vérifiez</span>
          <input type="file" accept=".xlsx,.csv,.txt,.pdf,application/pdf" hidden disabled={busy} onChange={e => { readFile(e.target.files[0]); e.target.value = '' }} />
          {busy && <span className="spin" />}
        </label>
        <button className="btn link" onClick={downloadTemplate}><Icon name="download" size={14} /> Télécharger le modèle (Excel / CSV)</button>
      </>}

      {error && <div className="alert err" role="alert"><Icon name="alert" size={18} />{error}</div>}

      {tab === 'file' && items && (
        <div className="imp">
          <div className="imp-h">
            <b>{fileName}</b>
            <span className="mut">{items.length} élève(s) détecté(s) · {kept.length} à enregistrer{items.some(i => i.dup) && ` · ${items.filter(i => i.dup).length} déjà dans la classe`}</span>
          </div>
          <div className="mut">Vérifiez la liste : corrigez un nom, décochez une ligne inutile.</div>
          <div className="imp-list">
            {items.map((e, i) => (
              <div className={'imp-row' + (e.keep ? '' : ' off')} key={e.id}>
                <input type="checkbox" checked={e.keep} onChange={ev => patch(e.id, { keep: ev.target.checked })} aria-label={`Inclure ${e.name}`} />
                <span className="nidx">{i + 1}</span>
                <input value={e.name} onChange={ev => patch(e.id, { name: ev.target.value })} aria-label="Nom" />
                <input className="mat" value={e.matricule} placeholder="Matricule" onChange={ev => patch(e.id, { matricule: ev.target.value })} aria-label="Matricule" />
                {e.dup && <span className="tag gold">déjà présent</span>}
              </div>
            ))}
          </div>
          <div className="act">
            <button className="btn p" disabled={busy || !kept.length} onClick={confirm}><Icon name="check" size={16} /> {busy ? 'Enregistrement…' : `Enregistrer ${kept.length} élève${kept.length > 1 ? 's' : ''}`}</button>
            <button className="btn" onClick={() => { setItems(null); setFileName(''); setError('') }}>Annuler</button>
          </div>
        </div>
      )}
    </section>
  )
}
