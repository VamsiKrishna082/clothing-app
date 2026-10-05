import { SVGProps } from "react"

/** Thin line icons for the Tharam UI (24px grid, 1.6 stroke, currentColor). */
type P = SVGProps<SVGSVGElement> & { size?: number }

const Base = ({ size = 20, children, ...rest }: P & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
)

export const SearchIcon = (p: P) => (
  <Base {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Base>
)
export const UserIcon = (p: P) => (
  <Base {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></Base>
)
export const BagIcon = (p: P) => (
  <Base {...p}><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></Base>
)
export const MenuIcon = (p: P) => (
  <Base {...p}><path d="M4 7h16M4 12h16M4 17h10" /></Base>
)
export const CloseIcon = (p: P) => (
  <Base {...p}><path d="M6 6l12 12M18 6 6 18" /></Base>
)
export const TruckIcon = (p: P) => (
  <Base {...p}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></Base>
)
export const CashIcon = (p: P) => (
  <Base {...p}><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 9v.01M18 15v.01" /></Base>
)
export const ReturnIcon = (p: P) => (
  <Base {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></Base>
)
export const ThreadIcon = (p: P) => (
  <Base {...p}><path d="M7 3h10M7 21h10" /><path d="M8 3v18M16 3v18" /><path d="M8 7l8 3M8 11l8 3M8 15l8 3" /></Base>
)
export const ShieldIcon = (p: P) => (
  <Base {...p}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></Base>
)
export const ArrowRightIcon = (p: P) => (
  <Base {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Base>
)
export const ChevronDownIcon = (p: P) => (
  <Base {...p}><path d="m6 9 6 6 6-6" /></Base>
)
export const RulerIcon = (p: P) => (
  <Base {...p}><path d="M3 17 17 3l4 4L7 21l-4-4Z" /><path d="m7 13 2 2M10 10l2 2M13 7l2 2" /></Base>
)
export const StarIcon = ({ filled = true, ...p }: P & { filled?: boolean }) => (
  <Base {...p} fill={filled ? "currentColor" : "none"} strokeWidth={1.2}>
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
  </Base>
)
export const WhatsAppIcon = (p: P) => (
  <Base {...p}><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19l-4 1Z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8c-1-.4-1.8-1.2-2.2-2.2l.8-1-1-2L9 9.5Z" /></Base>
)
