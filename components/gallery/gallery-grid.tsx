"use client";

/* eslint-disable @next/next/no-img-element -- Gallery CMS accepts arbitrary remote image URLs. */

import { useEffect, useMemo, useState } from "react";
import type { PublicGalleryImage } from "@/lib/gallery";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

type GalleryGridProps = {
  images: PublicGalleryImage[];
  locale?: Locale;
};

const galleryCopy = {
  en: {
    all: "All",
    categoriesLabel: "Gallery categories",
    close: "Close",
    closeImage: "Close gallery image",
    openImage: (altText: string) => `Open ${altText}`
  },
  fr: {
    all: "Tout",
    categoriesLabel: "Catégories de galerie",
    close: "Fermer",
    closeImage: "Fermer l'image de galerie",
    openImage: (altText: string) => `Ouvrir ${altText}`
  }
} satisfies Record<
  Locale,
  {
    all: string;
    categoriesLabel: string;
    close: string;
    closeImage: string;
    openImage: (altText: string) => string;
  }
>;

function categoryLabel(category: string): string {
  return category
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function GalleryGrid({
  images,
  locale = DEFAULT_LOCALE
}: GalleryGridProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedImage, setSelectedImage] = useState<PublicGalleryImage | null>(
    null
  );
  const copy = galleryCopy[locale];

  const categories = useMemo(
    () => Array.from(new Set(images.map((image) => image.category))).sort(),
    [images]
  );

  const visibleImages = useMemo(() => {
    if (selectedCategory === "all") {
      return images;
    }

    return images.filter((image) => image.category === selectedCategory);
  }, [images, selectedCategory]);

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedImage]);

  return (
    <div className="gallery-browser">
      {categories.length > 1 ? (
        <div className="gallery-filters" aria-label={copy.categoriesLabel}>
          <button
            aria-pressed={selectedCategory === "all"}
            onClick={() => setSelectedCategory("all")}
            type="button"
          >
            {copy.all}
          </button>
          {categories.map((category) => (
            <button
              aria-pressed={selectedCategory === category}
              key={category}
              onClick={() => setSelectedCategory(category)}
              type="button"
            >
              {categoryLabel(category)}
            </button>
          ))}
        </div>
      ) : null}

      <div className="gallery-grid">
        {visibleImages.map((image, index) => (
          <button
            aria-label={copy.openImage(image.altText)}
            className={`gallery-tile gallery-tile-${(index % 5) + 1}`}
            key={image.id}
            onClick={() => setSelectedImage(image)}
            type="button"
          >
            <img alt={image.altText} src={image.imageUrl} />
            <span>
              <strong>{image.caption || categoryLabel(image.category)}</strong>
              <small>{categoryLabel(image.category)}</small>
            </span>
          </button>
        ))}
      </div>

      {selectedImage ? (
        <div
          aria-labelledby="gallery-lightbox-title"
          aria-modal="true"
          className="gallery-lightbox"
          role="dialog"
        >
          <button
            aria-label={copy.closeImage}
            className="gallery-lightbox-backdrop"
            onClick={() => setSelectedImage(null)}
            type="button"
          />
          <div className="gallery-lightbox-panel">
            <button
              aria-label={copy.closeImage}
              className="gallery-lightbox-close"
              onClick={() => setSelectedImage(null)}
              type="button"
            >
              {copy.close}
            </button>
            <img alt={selectedImage.altText} src={selectedImage.imageUrl} />
            <div className="gallery-lightbox-copy">
              <p className="eyebrow">{categoryLabel(selectedImage.category)}</p>
              <h2 id="gallery-lightbox-title">
                {selectedImage.caption || selectedImage.altText}
              </h2>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
