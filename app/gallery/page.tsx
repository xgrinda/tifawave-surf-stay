import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { Container } from "@/components/primitives/container";
import { getActiveGalleryImages } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Gallery | Tifawave Surf Stay",
  description:
    "Browse the Tifawave gallery of surf, rooms, food, sunsets, and Tamraght."
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
              <p className="eyebrow">Images coming soon</p>
              <h2>The gallery is ready for its first images.</h2>
              <p>
                Add active image URLs from the protected admin gallery page to
                publish them here.
              </p>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
