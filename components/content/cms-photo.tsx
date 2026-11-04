"use client";
import Image from "next/image";
import { useState } from "react";
import { isPublicImageUrl } from "@/lib/image-url";
export function CmsPhoto({
  src,
  alt,
  position = "center",
  mobilePosition,
  sizes = "(max-width:760px) 100vw,50vw",
  className = "",
}: {
  src: string;
  alt: string;
  position?: string;
  mobilePosition?: string;
  sizes?: string;
  className?: string;
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
      <Image
        src={src}
        alt={alt}
        fill
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
    </div>
  );
}
