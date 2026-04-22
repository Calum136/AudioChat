// Icon set — line-based SVG icons used across the Claude Design screens.
// Usage:  <I.plus />  or  <I.mic s={18} />
//
// Every icon accepts a `s` prop (size in px, default varies per icon)
// and inherits colour via `currentColor` — set `color` on a parent to tint.

/* eslint-disable react/prop-types */
export const I = {
  plus: ({ s = 14 } = {}) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  arrow: ({ s = 14 } = {}) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  mic: ({ s = 16 } = {}) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="6" y="2" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3.5 8a4.5 4.5 0 0 0 9 0M8 12.5V14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
  micOff: ({ s = 16 } = {}) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="6" y="2" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3.5 8a4.5 4.5 0 0 0 9 0M8 12.5V14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  headphones: ({ s = 16 } = {}) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 10V8a6 6 0 0 1 12 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="1.5" y="9.5" width="3.5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="9.5" width="3.5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  settings: ({ s = 16 } = {}) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ),
  leave: ({ s = 16 } = {}) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M10 11l3-3-3-3M13 8H5M9 2H3v12h6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  copy: ({ s = 12 } = {}) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v7A1.5 1.5 0 0 0 3.5 12H5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  ),
  search: ({ s = 14 } = {}) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  users: ({ s = 14 } = {}) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M10 4a2.5 2.5 0 0 1 0 5M13.5 13c0-1.9-1.2-3.6-3-4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
  sparkle: ({ s = 14 } = {}) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 2l1.5 4L14 8l-4.5 2L8 14l-1.5-4L2 8l4.5-2L8 2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  ),
  furniture: ({ s = 14 } = {}) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2 12V7h12v5M4 7V5h8v2M3 12v2M13 12v2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  check: ({ s = 14 } = {}) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8.5l3 3 7-7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  link: ({ s = 14 } = {}) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M9 5l2-2a3 3 0 1 1 4 4l-2 2M7 11l-2 2a3 3 0 1 1-4-4l2-2M6 10l4-4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
};
