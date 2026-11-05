import type { MetadataRoute } from "next";
import { getBranding } from "@/lib/content/branding";
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const b = await getBranding();
  return {
    name: "Tifawave Surf Stay",
    short_name: "Tifawave",
    start_url: "/",
    display: "browser",
    background_color: "#f6f1e7",
    theme_color: "#173f39",
    icons: b.favicon
      ? [192, 512].map((s) => ({
          src: `/brand/icon/${s}`,
          sizes: `${s}x${s}`,
          type: "image/png",
        }))
      : [],
  };
}
