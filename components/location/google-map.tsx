import { approvedGoogleMapsEmbedUrl } from "@/lib/google-business/map-links";
export function GoogleMap({
  url,
  title,
  className = "location-map-frame",
}: {
  url: string;
  title: string;
  className?: string;
}) {
  const src = approvedGoogleMapsEmbedUrl(url);
  if (!src) return null;
  return (
    <div className={className}>
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
