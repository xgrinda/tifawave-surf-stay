// Copies existing PUBLIC property assets into isolated staging. Never fetches
// reservations, private calendars, Auth identities or production credentials.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { assertDatabaseTarget } from "../lib/security/environment.ts";
assertDatabaseTarget();
assert.equal(process.env.TIFAWAVE_ENV, "staging");
assert.equal(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "https://cjtrnnpqwkorxwqhtjeq.supabase.co",
);
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const source = JSON.parse(
  await readFile("work/original-public-catalogue.json", "utf8"),
);
const existing = await admin
  .from("rooms")
  .select("id", { count: "exact", head: true });
if (existing.error || existing.count !== 0)
  throw Error(
    "Import requires an empty staging catalogue; existing content will not be overwritten.",
  );
const journal: {
  target: string;
  source: string;
  assets: { path: string; sha256: string }[];
  roomIds: string[];
  packageIds: string[];
  galleryIds: string[];
  phase: string;
} = {
  target: "cjtrnnpqwkorxwqhtjeq",
  source: "Existing public property catalogue only",
  assets: [],
  roomIds: [],
  packageIds: [],
  galleryIds: [],
  phase: "assets",
};
const save = () =>
  writeFile(
    "work/public-content-import-journal.json",
    JSON.stringify(journal, null, 2),
    { mode: 0o600 },
  );
async function ok<T>(
  p: PromiseLike<{ data: T; error: { message: string } | null }>,
) {
  const r = await p;
  if (r.error) throw Error(r.error.message);
  return r.data;
}
async function copy(url: string, id: string, folder: string) {
  const original = new URL(url);
  assert.equal(original.hostname, "tuzefzcosvvhzffbxhpm.supabase.co");
  assert.equal(original.protocol, "https:");
  assert.ok(
    original.pathname.startsWith("/storage/v1/object/public/tifawave-media/"),
  );
  const extension = original.pathname.split(".").at(-1);
  const mime = (
    {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      png: "image/png",
      avif: "image/avif",
    } as Record<string, string>
  )[extension || ""];
  assert.ok(mime);
  const response = await fetch(original, {
    signal: AbortSignal.timeout(30000),
    redirect: "error",
  });
  assert.ok(response.ok);
  if (Number(response.headers.get("content-length")) > 10 * 1024 * 1024)
    throw Error("Original image exceeds the import bound");
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert.ok(bytes.length <= 10 * 1024 * 1024);
  const path = `original-property/${folder}/${id}.${extension}`;
  await ok(
    admin.storage.from("tifawave-media").upload(path, bytes, {
      contentType: mime,
      cacheControl: "31536000",
      upsert: false,
    }),
  );
  journal.assets.push({
    path,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
  await save();
  return admin.storage.from("tifawave-media").getPublicUrl(path).data.publicUrl;
}
const photos = [];
for (const image of source.roomImages) {
  photos.push({
    ...image,
    image_url: await copy(image.image_url, image.id, "rooms"),
    alt_text: image.alt_text || "Tifawave room photograph",
  });
}
const gallery = [];
for (const image of source.gallery) {
  gallery.push({
    ...image,
    image_url: await copy(image.image_url, image.id, "gallery"),
    is_active: true,
  });
}
const known: Record<
  string,
  { name?: string; description: string; capacity: number }
> = {
  "private-double-room": {
    description: "Private double room for up to two guests.",
    capacity: 2,
  },
  "private-double-room-balcony": {
    description: "Private double room with a balcony for up to two guests.",
    capacity: 2,
  },
  "twin-room": {
    description: "Twin room with two single beds for up to two guests.",
    capacity: 2,
  },
  "triple-room": {
    description: "Triple room for up to three guests.",
    capacity: 3,
  },
  "family-room-4p": {
    name: "Family suite",
    description:
      "Family suite with a double bed and two single beds, sold as one unit for up to four guests.",
    capacity: 4,
  },
  "4-bed-dorm-room": {
    name: "Individual dorm bed",
    description:
      "One individually bookable bed in the shared four-bed dormitory.",
    capacity: 1,
  },
};
const rooms = source.rooms.map(
  (r: { id: string; slug: string; name: string }) => {
    const facts = known[r.slug];
    assert.ok(facts, "Review an unknown source room before import");
    return {
      id: r.id,
      slug: r.slug,
      name: facts.name || r.name,
      description: facts.description,
      max_guests: facts.capacity,
      base_price_cents: (
        {
          "4-bed-dorm-room": 1500,
          "private-double-room": 3500,
          "twin-room": 3500,
          "private-double-room-balcony": 4500,
          "triple-room": 4500,
          "family-room-4p": 5500,
        } as Record<string, number>
      )[r.slug],
      is_active: true,
    };
  },
);
await save();
await ok(admin.from("rooms").insert(rooms));
journal.roomIds = rooms.map((r: { id: string }) => r.id);
journal.phase = "room_images";
await save();
await ok(admin.from("room_images").insert(photos));
await ok(admin.from("gallery_images").insert(gallery));
journal.galleryIds = gallery.map((r: { id: string }) => r.id);
await save();
const packages = source.packages.map((p: Record<string, unknown>) => ({
  ...p,
  is_active: false,
}));
await ok(admin.from("packages").insert(packages));
journal.packageIds = packages.map((r: { id: string }) => r.id);
await ok(
  admin
    .from("settings")
    .update({
      ...source.settings,
      default_currency: "EUR",
      breakfast_included: true,
    })
    .eq("id", true),
);
journal.phase = "complete";
await save();
console.log(
  JSON.stringify({
    pass: true,
    target: journal.target,
    rooms: rooms.length,
    activeRoomTypes: rooms.filter((r: { is_active: boolean }) => r.is_active)
      .length,
    roomPhotos: photos.length,
    gallery: gallery.length,
    unpublishedStarterPackages: packages.length,
    prices: "Owner-confirmed EUR nightly rates; breakfast included",
    productionMutations: 0,
  }),
);
