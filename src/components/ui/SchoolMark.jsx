import Logo from './Logo'

// Logo de l’établissement s’il en a un, sinon le sigle EDVIA (sur une pastille blanche, lisible sur tous les fonds)
export default function SchoolMark({ logo, size = 40 }) {
  return logo
    ? <img className="logo-img" style={{ width: size, height: size }} src={logo} alt="" />
    : <span className="mark-tile" style={{ width: size, height: size }}><Logo size={size * 0.86} /></span>
}
