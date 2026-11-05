import { useState } from 'react'
import Icon from './Icon'

// Champ de formulaire avec libellé (et aide facultative)
export function Field({ label, hint, className = '', ...props }) {
  return (
    <div className={'field ' + className}>
      {label && <label>{label}</label>}
      <input {...props} />
      {hint && <div className="mut">{hint}</div>}
    </div>
  )
}

// Mot de passe avec bouton afficher / masquer
export function PasswordField({ label, hint, ...props }) {
  const [show, setShow] = useState(false)
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div className="pw">
        <input {...props} type={show ? 'text' : 'password'} />
        <button type="button" className="pw-eye" onClick={() => setShow(s => !s)} aria-label={show ? 'Masquer' : 'Afficher'}>
          <Icon name={show ? 'eye-off' : 'eye'} size={18} />
        </button>
      </div>
      {hint && <div className="mut">{hint}</div>}
    </div>
  )
}
