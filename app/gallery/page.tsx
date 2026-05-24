import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { Container } from "@/components/primitives/container";
import { getActiveGalleryImages } from "@/lib/gallery";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gallery | Tifawave Surf Stay",
  description:
    "Browse the Tifawave gallery of surf, rooms, food, sunsets, and Tamraght.",
  alternates: {
    canonical: `${getSiteUrl()}/gallery`,
    languages: {
      en: `${getSiteUrl()}/gallery`,
      fr: `${getSiteUrl()}/fr/gallery`
    }
  }
};

export default async function GalleryPage() {
  const images = await getActiveGalleryImages();

  return (
    <main className="gallery-page">
      <section className="gallery-hero" aria-labelledby="gallery-title">
        <Container>
          <p className="eyebrow">Gallery</p>
          <h1 id="gallery-title">Surf, stay, and the quiet in between.</h1>
          <p>
            A living gallery of the house, the coast, the food, and the small
            moments that make Tifawave feel like more than a place to sleep.
          </p>
        </Container>
      </section>

      <section className="gallery-section" aria-label="Tifawave image gallery">
        <Container>
          {images.length > 0 ? (
            <GalleryGrid images={images} />
          ) : (
            <div className="gallery-empty-state">
              <div className="gallery-empty-visual" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div>
                <p className="eyebrow">Gallery being updated</p>
                <h2>The first public gallery is being curated.</h2>
                <p>
                  Check back for surf, rooms, food, community, and Tamraght
                  moments from Tifawave.
                </p>
              </div>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
