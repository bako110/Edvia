import Icon from '../../components/ui/Icon'
import { callLink, phoneIntl, smsLink, waLink } from '../../lib/money'

export const validPhone = v => String(v || '').replace(/\D/g, '').length >= 8

// Joindre le parent en un geste : appel, SMS ou WhatsApp sur le numéro à contacter de l'élève
export default function Contact({ phone, text = '', className = '' }) {
  if (!validPhone(phone)) return <span className="tag gold">numéro manquant</span>
  const intl = phoneIntl(phone)
  return (
    <span className={'contact ' + className}>
      <a className="btn icon-btn sm" href={callLink(phone)} aria-label={`Appeler ${phone}`} title="Appeler"><Icon name="phone" size={16} /></a>
      <a className="btn icon-btn sm" href={smsLink(intl, text)} aria-label="Envoyer un SMS" title="SMS"><Icon name="send" size={16} /></a>
      <a className="btn icon-btn sm" href={waLink(intl, text)} target="_blank" rel="noreferrer" aria-label="Écrire sur WhatsApp" title="WhatsApp"><Icon name="chat" size={16} /></a>
    </span>
  )
}
