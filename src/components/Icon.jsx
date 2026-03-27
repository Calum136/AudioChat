/**
 * SVG line icons for Sidequest.
 * Placeholder system — designed to be swapped for pixel art or uploaded images later.
 * All icons use a 24x24 viewBox with 1.5px strokes.
 */

const PATHS = {
  // Furniture — seating
  couch: (
    <>
      <path d="M5 10V7a2 2 0 012-2h10a2 2 0 012 2v3" />
      <rect x="3" y="10" width="18" height="6" rx="2" />
      <path d="M5 16v2M19 16v2" />
      <line x1="12" y1="10" x2="12" y2="16" strokeDasharray="2 2" opacity="0.4" />
    </>
  ),
  beanbag: (
    <>
      <path d="M7 13c0-4 2.2-7 5-7s5 3 5 7c0 3-2.2 5-5 5s-5-2-5-5z" />
      <path d="M9 9c1-1.5 2-2 3-2" opacity="0.4" />
    </>
  ),
  barstool: (
    <>
      <ellipse cx="12" cy="7" rx="5" ry="2" />
      <path d="M12 9v8" />
      <path d="M8 14h8" />
      <path d="M7 21l5-4 5 4" />
    </>
  ),
  swing: (
    <>
      <path d="M7 2v10M17 2v10" />
      <path d="M5 12h14" />
      <path d="M7 12c0 3 2.2 5 5 5s5-2 5-5" />
    </>
  ),
  gamingchair: (
    <>
      <path d="M8 4a1 1 0 011-1h6a1 1 0 011 1v10H8V4z" />
      <rect x="6" y="14" width="12" height="4" rx="1" />
      <path d="M10 18v2M14 18v2M8 20h8" />
      <circle cx="12" cy="6" r="1.5" strokeWidth="1" opacity="0.4" />
    </>
  ),
  floorcushion: (
    <>
      <ellipse cx="12" cy="15" rx="8" ry="4" />
      <ellipse cx="12" cy="13" rx="8" ry="4" />
      <path d="M8 13h8" opacity="0.3" />
    </>
  ),

  // Furniture — decor
  table: (
    <>
      <rect x="4" y="8" width="16" height="3" rx="1" />
      <path d="M6 11v7M18 11v7" />
      <path d="M6 18h12" opacity="0.3" />
    </>
  ),
  shelf: (
    <>
      <path d="M3 8h18M3 15h18" />
      <path d="M5 5v3M19 5v3" />
      <path d="M5 8v7M19 8v7" />
      <rect x="7" y="9" width="3" height="6" rx="0.5" opacity="0.5" />
      <rect x="12" y="11" width="4" height="4" rx="0.5" opacity="0.5" />
    </>
  ),
  lamp: (
    <>
      <path d="M9 3h6l-1.5 8h-3L9 3z" />
      <path d="M12 11v7" />
      <path d="M9 18h6" />
      <path d="M10 5h4" opacity="0.3" />
    </>
  ),
  poster: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <rect x="6" y="5" width="12" height="10" rx="1" opacity="0.4" />
      <path d="M9 18h6" opacity="0.3" />
    </>
  ),
  arcade: (
    <>
      <path d="M7 2h10a1 1 0 011 1v16a2 2 0 01-2 2H8a2 2 0 01-2-2V3a1 1 0 011-1z" />
      <rect x="8" y="4" width="8" height="6" rx="1" opacity="0.5" />
      <circle cx="10" cy="14" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14" cy="13" r="1.2" fill="currentColor" stroke="none" />
      <path d="M10 17h4" opacity="0.3" />
    </>
  ),

  // Voice icons
  mic: (
    <>
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </>
  ),
  micOff: (
    <>
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
      <path d="M17 16.95A7 7 0 015 12v-2m14 0v2c0 .76-.12 1.5-.35 2.18" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </>
  ),
  speaking: (
    <>
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <path d="M1 8a4 4 0 014-4" opacity="0.5" />
      <path d="M23 8a4 4 0 00-4-4" opacity="0.5" />
    </>
  ),

  // UI icons
  edit: (
    <>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
  check: (
    <polyline points="20 6 9 17 4 12" />
  ),
  arrowLeft: (
    <path d="M19 12H5M12 19l-7-7 7-7" />
  ),
  arrowUp: (
    <path d="M12 19V5M5 12l7-7 7 7" />
  ),
  arrowRight: (
    <path d="M5 12h14M12 5l7 7-7 7" />
  ),
  furniture: (
    <>
      <rect x="3" y="8" width="18" height="8" rx="2" />
      <path d="M7 16v2M17 16v2M7 8V6M17 8V6" />
    </>
  ),
  palette: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="8" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="14" cy="7" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="14" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </>
  ),
  userPlus: (
    <>
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="17" y1="11" x2="23" y2="11" />
    </>
  ),
  dots: (
    <>
      <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  block: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </>
  ),
};

export default function Icon({ name, size = 24, className = '' }) {
  const paths = PATHS[name];
  if (!paths) return null;

  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
    >
      {paths}
    </svg>
  );
}
