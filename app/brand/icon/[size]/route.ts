import { renderBrandIcon } from "@/lib/content/brand-image";
import { getBranding } from "@/lib/content/branding";
import { brandAsset } from "@/lib/content/brand-assets";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  if (!["96", "180", "192", "512"].includes(size))
    return new Response(null, { status: 404 });
  const b = await getBranding();
  const src = size === "180" ? b.appleIcon || b.favicon : b.favicon;
  if (!src) return new Response(null, { status: 404 });
  try {
    const { bytes } = await brandAsset(src);
    const out = await renderBrandIcon(bytes, Number(size));
    return new Response(new Uint8Array(out), {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=300",
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
