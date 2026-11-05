import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import SchoolMark from '../../components/ui/SchoolMark'
import { Field } from '../../components/ui/Field'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/Feedback'
import { schoolApi } from '../../api'
import { PALETTES, safeBrand } from '../../lib/brand'

// Redimensionne le logo (200 px max) pour rester léger
function readLogo(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onerror = () => reject(new Error('Fichier illisible'))
    r.onload = () => {
      const im = new Image()
      im.onerror = () => reject(new Error('Image illisible'))
      im.onload = () => {
        const s = Math.min(1, 200 / Math.max(im.width, im.height))
        const cv = document.createElement('canvas')
        cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s)
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height)
        resolve(cv.toDataURL('image/png'))
      }
      im.src = r.result
    }
    r.readAsDataURL(file)
  })
}

// Identité de l’établissement : nom, devise, couleurs, logo — réservée à l’administrateur
export default function SchoolIdentity() {
  const { school, setSchool } = useAuth()
  const toast = useToast()
  const [d, setD] = useState({ ...school })
  const [busy, setBusy] = useState(false)
  const set = k => e => setD(x => ({ ...x, [k]: e.target.value }))
  const dirty = ['name', 'ministere', 'devise', 'annee', 'proviseur', 'slogan', 'brand', 'logo'].some(k => d[k] !== school[k])

  const pickLogo = async e => {
    const file = e.target.files[0]; e.target.value = ''
    if (!file) return
    try { const logo = await readLogo(file); setD(x => ({ ...x, logo })) }
    catch (err) { toast(err.message, 'err') }
  }
  const save = async () => {
    setBusy(true)
    try {
      const { name, ministere, devise, annee, proviseur, slogan, brand, logo } = d
      setSchool(await schoolApi.update({ name, ministere, devise, annee, proviseur, slogan, brand, logo }))
      toast('Identité de l’établissement enregistrée')
    } catch (err) { toast(err.message, 'err') }
    setBusy(false)
  }

  return (
    <section className="card">
      <h2><Icon name="school" /> Identité de l’établissement</h2>
      <p className="mut">Ces informations et ces couleurs s’appliquent à toute l’application, à l’écran de démarrage et aux bulletins de votre établissement.</p>

      {/* aperçu en direct : les variables de couleur sont recalculées localement */}
      <div className="preview" style={{ '--brand': safeBrand(d.brand) }}>
        <SchoolMark logo={d.logo} size={44} id="pv" />
        <div><div className="hdr-k">EDVIA</div><b>{d.name || 'Nom de l’établissement'}</b><div className="hdr-sub">{d.slogan || 'Votre slogan'}</div></div>
        <span className="btn gold sm" aria-hidden="true">Bouton</span>
      </div>

      <label>Couleur de l’établissement</label>
      <div className="swatches">
        {PALETTES.map(p => (
          <button key={p.c} type="button" className={'sw' + (d.brand.toLowerCase() === p.c ? ' on' : '')} style={{ '--c': p.c }}
            onClick={() => setD(x => ({ ...x, brand: p.c }))} aria-label={p.n} title={p.n}>
            {d.brand.toLowerCase() === p.c && <Icon name="check" size={16} />}
          </button>
        ))}
        <label className="sw custom" title="Couleur personnalisée"><input type="color" value={safeBrand(d.brand)} onChange={e => setD(x => ({ ...x, brand: e.target.value }))} /><Icon name="plus" size={16} /></label>
      </div>
      <p className="mut">Les couleurs trop claires sont automatiquement assombries pour que les textes restent lisibles.</p>

      <label>Logo</label>
      <div className="logo-row">
        {d.logo && <img src={d.logo} alt="Logo" />}
        <label className="btn" style={{ margin: 0 }}><Icon name="upload" size={16} /> {d.logo ? 'Changer' : 'Choisir une image'}
          <input type="file" accept="image/*" hidden onChange={pickLogo} /></label>
        {d.logo && <button className="btn" onClick={() => setD(x => ({ ...x, logo: '' }))}><Icon name="trash" size={16} /> Retirer</button>}
      </div>

      <Field label="Nom de l’établissement" value={d.name} onChange={set('name')} maxLength={120} />
      <Field label="Slogan (écran de démarrage)" value={d.slogan} onChange={set('slogan')} maxLength={120} placeholder="Discipline · Travail · Réussite" />
      <div className="row">
        <Field label="Année scolaire" value={d.annee} onChange={set('annee')} maxLength={20} />
        <Field label="Nom du proviseur / directeur" value={d.proviseur} onChange={set('proviseur')} maxLength={80} />
      </div>
      <Field label="Ministère (en-tête du bulletin)" value={d.ministere} onChange={set('ministere')} maxLength={160} />
      <Field label="Devise nationale (en-tête du bulletin)" value={d.devise} onChange={set('devise')} maxLength={160} />

      <div className="act">
        <button className="btn p" disabled={!dirty || busy || !d.name.trim()} onClick={save}><Icon name="check" size={16} /> {busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        {dirty && <button className="btn" onClick={() => setD({ ...school })}>Annuler</button>}
      </div>
    </section>
  )
}
