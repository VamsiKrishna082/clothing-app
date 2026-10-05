import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  title?: string
}

/**
 * Phones: full-width swipe carousel with a count badge.
 * Desktop: first image large, the rest in a two-column grid.
 */
const ImageGallery = ({ images, title = "Product" }: ImageGalleryProps) => {
  const list = images.filter((i) => !!i.url)

  return (
    <div className="relative">
      <div className="flex small:grid small:grid-cols-2 gap-2 small:gap-3 overflow-x-auto small:overflow-visible snap-x snap-mandatory no-scrollbar">
        {list.map((image, index) => (
          <div
            key={image.id}
            id={image.id}
            className={`relative shrink-0 w-full snap-center aspect-[3/4] overflow-hidden bg-sand small:rounded-2xl ${
              index === 0 || list.length === 2 ? "small:col-span-2" : ""
            }`}
          >
            <Image
              src={image.url!}
              priority={index === 0}
              alt={`${title} — image ${index + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-top"
            />
          </div>
        ))}
      </div>
      {list.length > 1 && (
        <span className="small:hidden absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-semibold text-ivory">
          1 / {list.length} · swipe
        </span>
      )}
    </div>
  )
}

export default ImageGallery
