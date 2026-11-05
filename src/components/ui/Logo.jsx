// Sigle EDVIA : toque de diplômé posée sur un livre ouvert (vert et ambre), en vectoriel
const NAVY = '#0b2a5e', GREEN = '#0f8159', AMBER = '#fbb017'

export default function Logo({ size = 40 }) {
  return (
    <svg className="logo-mark" width={size} height={size * 0.56} viewBox="300 92 665 372" role="img" aria-label="EDVIA">
      {/* toque */}
      <path fill={NAVY} stroke={NAVY} strokeWidth="8" strokeLinejoin="round" d="M417 186 L640 104 L862 188 L640 271 Z" />
      <path fill={NAVY} d="M505 244 L640 292 L775 242 V287 C738 312 690 340 640 372 C590 340 542 312 505 287 Z" />
      <rect fill={NAVY} x="836" y="200" width="14" height="56" rx="3" />
      <path fill={NAVY} d="M824 250 H858 V312 Q858 322 848 322 H834 Q824 322 824 312 Z" />
      {/* livre ouvert */}
      <path fill={GREEN} d="M357 338 L384 283 C505 292 603 346 640 430 V443 C585 374 470 337 357 338 Z" />
      <path fill={GREEN} d="M640 443 V430 C668 374 744 324 812 307 L826 327 H905 L915 345 L955 413 C882 383 742 379 640 443 Z" />
      <path fill={AMBER} d="M309 423 L338 357 C456 345 586 378 637 441 C560 396 430 383 309 423 Z" />
    </svg>
  )
}
