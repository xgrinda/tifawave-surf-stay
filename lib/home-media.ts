import type { PublicGalleryImage } from "@/lib/gallery";
import type { PublicRoomDetail } from "@/lib/rooms";
import type { FocalPosition } from "@/lib/image-position";

export type HomeImage = {
  altText: string;
  focalPosition: FocalPosition;
  imageUrl: string;
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

  return images
    .filter((image) =>
      image.category
        .toLowerCase()
        .split("-")
        .some((part) => packageTags.has(part))
    )
    .map(imageFromGallery);
}
