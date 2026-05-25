import type { PublicGalleryImage } from "@/lib/gallery";
import type { PublicRoomDetail } from "@/lib/rooms";
import type { FocalPosition } from "@/lib/image-position";

export type HomeImage = {
  altText: string;
  focalPosition: FocalPosition;
  imageUrl: string;
};

const FALLBACK_PACKAGE_IMAGES: HomeImage[] = [
  {
    altText: "Surfer walking toward Atlantic waves",
    focalPosition: "center",
    imageUrl:
      "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1400&q=80"
  },
  {
    altText: "Warm beach coastline at sunset",
    focalPosition: "center",
    imageUrl:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=80"
  },
  {
    altText: "Ocean waves rolling toward a sandy beach",
    focalPosition: "center",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80"
  }
];

const FALLBACK_PLACE_IMAGE: HomeImage = {
  altText: "Desert hills and open road at sunset",
  focalPosition: "center",
  imageUrl:
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80"
};

function imageFromGallery(image: PublicGalleryImage): HomeImage {
  return {
    altText: image.altText || image.caption,
    focalPosition: image.focalPosition,
    imageUrl: image.imageUrl
  };
}

export function getPrimaryRoomHomeImage(
  rooms: PublicRoomDetail[]
): HomeImage | null {
  for (const room of rooms) {
    const image = room.images.find((item) => item.isPrimary) ?? room.images[0];

    if (image) {
      return {
        altText: image.altText || `${room.name} at Tifawave`,
        focalPosition: image.focalPosition,
        imageUrl: image.imageUrl
      };
    }
  }

  return null;
}

export function getTaggedGalleryHomeImage(
  images: PublicGalleryImage[],
  tags: string[]
): HomeImage | null {
  const normalizedTags = new Set(tags.map((tag) => tag.toLowerCase()));
  const match = images.find((image) =>
    image.category
      .toLowerCase()
      .split("-")
      .some((part) => normalizedTags.has(part))
  );

  return match ? imageFromGallery(match) : null;
}

export function getPackageHomeImages(images: PublicGalleryImage[]): HomeImage[] {
  const packageTags = new Set(["surf", "package", "packages", "coaching"]);

  const taggedImages = images
    .filter((image) =>
      image.category
        .toLowerCase()
        .split("-")
        .some((part) => packageTags.has(part))
    )
    .map(imageFromGallery);

  if (taggedImages.length >= FALLBACK_PACKAGE_IMAGES.length) {
    return taggedImages;
  }

  return [
    ...taggedImages,
    ...FALLBACK_PACKAGE_IMAGES.slice(taggedImages.length)
  ];
}

export function getPlaceFallbackHomeImage(): HomeImage {
  return FALLBACK_PLACE_IMAGE;
}
