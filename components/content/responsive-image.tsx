"use client";

import Image, { type ImageProps } from "next/image";
import { imageDeliveryOptions } from "@/lib/image-delivery";

/** Keep the custom CDN loader on the client boundary; no server function props. */
export function ResponsiveImage(props: Omit<ImageProps, "loader" | "unoptimized">) {
  return (
    <Image
      {...props}
      alt={props.alt}
      {...(typeof props.src === "string" ? imageDeliveryOptions(props.src) : {})}
    />
  );
}
