"use client";
import Image, { getImageProps } from "next/image";
import { useState } from "react";
import { isPublicImageUrl } from "@/lib/image-url";
export function CmsPhoto({
  src,
  alt,
  mobileSrc,
  position = "center",
  mobilePosition,
  sizes = "(max-width:760px) 100vw,50vw",
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  mobileSrc?: string;
  position?: string;
  mobilePosition?: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!isPublicImageUrl(src) || failed)
    return (
      <div className={"cms-photo cms-photo-fallback " + className}>
        <span>Tifawave.</span>
        <small>{alt}</small>
      </div>
    );
  return (
    <div className={"cms-photo " + className}>
      <picture>
        {mobileSrc && isPublicImageUrl(mobileSrc) && (
          <source
            media="(max-width:760px)"
            srcSet={
              getImageProps({ src: mobileSrc, alt: "", fill: true, sizes })
                .props.srcSet
            }
            sizes={sizes}
          />
        )}
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          style={
            {
              objectFit: "cover",
              objectPosition: position,
              "--photo-mobile-position": mobilePosition || position,
            } as import("react").CSSProperties
          }
          onError={() => setFailed(true)}
        />
      </picture>
    </div>
  );
}
