/* eslint-disable react/no-unescaped-entities -- French prose uses apostrophes heavily. */

import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { Container } from "@/components/primitives/container";
import { getActiveGalleryImages } from "@/lib/gallery";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Galerie | Tifawave Surf Stay",
  description:
    "Parcourez la galerie Tifawave: surf, chambres, cuisine, couchers de soleil et Tamraght.",
  alternates: {
    canonical: `${getSiteUrl()}/fr/gallery`,
    languages: {
      en: `${getSiteUrl()}/gallery`,
      fr: `${getSiteUrl()}/fr/gallery`
    }
  }
};

export default async function FrenchGalleryPage() {
  const images = await getActiveGalleryImages();

  return (
    <main className="gallery-page">
      <section className="gallery-hero" aria-labelledby="gallery-title">
        <Container>
          <p className="eyebrow">Galerie</p>
          <h1 id="gallery-title">Surf, séjour et les instants calmes entre les deux.</h1>
          <p>
            Une galerie vivante de la maison, de la côte, de la cuisine et des
            petits moments qui donnent à Tifawave plus qu'une simple adresse.
          </p>
        </Container>
      </section>

      <section className="gallery-section" aria-label="Galerie d'images Tifawave">
        <Container>
          {images.length > 0 ? (
            <GalleryGrid images={images} locale="fr" />
          ) : (
            <div className="gallery-empty-state">
              <div className="gallery-empty-visual" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div>
                <p className="eyebrow">Galerie en mise à jour</p>
                <h2>La première galerie publique est en préparation.</h2>
                <p>
                  Revenez bientôt pour découvrir les moments surf, chambres,
                  cuisine, communauté et Tamraght de Tifawave.
                </p>
              </div>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
