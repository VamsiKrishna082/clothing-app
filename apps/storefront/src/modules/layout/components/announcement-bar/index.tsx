import { ANNOUNCEMENTS } from "@lib/brand"

/** Thin maroon strip above the nav. Static — safe to cache at the edge. */
export default function AnnouncementBar() {
  const items = [...ANNOUNCEMENTS, ...ANNOUNCEMENTS]
  return (
    <div className="bg-maroon text-ivory text-[12px] tracking-wide overflow-hidden" role="region" aria-label="Store offers">
      <div className="flex w-max animate-marquee py-2">
        {items.map((text, i) => (
          <span key={i} className="flex items-center px-8 whitespace-nowrap" aria-hidden={i >= ANNOUNCEMENTS.length}>
            <span className="text-gold mr-8">✦</span>
            {text}
          </span>
        ))}
      </div>
    </div>
  )
}
