import { test } from "node:test";
import assert from "node:assert/strict";
import {
  homePrice,
  homeRoomCategories,
  homeRoomName,
  homeSection,
  homeSectionOrder,
  packageRequestPath,
  roomRequestPath,
  roomPreferredKind,
  surfEnquiryIntro,
  surfEnquiryPath,
} from "../lib/homepage";
import { homeConversionParams } from "../lib/analytics/homepage";
import { contentSchema } from "../lib/content/schema";
import type { PublicRoomDetail } from "../lib/rooms";
const slugs = [
  "4-bed-dorm-room",
  "private-double-room",
  "private-double-room-balcony",
  "twin-room",
  "triple-room",
  "family-room-4p",
];
const rooms = slugs.map((slug, i) => ({
  id: `room-${i}`,
  slug,
  name: slug,
  description: null,
  maxGuests: i === 0 ? 1 : i === 4 ? 3 : i === 5 ? 4 : 2,
  basePriceCents: [1500, 3500, 4500, 3500, 4500, 5500][i],
  images: [],
})) satisfies PublicRoomDetail[];
test("homepage groups six verified listings into five categories without losing the balcony variant", () => {
  const cards = homeRoomCategories(rooms);
  assert.equal(cards.length, 5);
  assert.equal(cards[1].room.basePriceCents, 3500);
  assert.equal(cards[1].balcony?.basePriceCents, 4500);
  assert.equal(cards[0].room.maxGuests, 1);
  assert.equal(cards[4].room.maxGuests, 4);
  assert.equal(
    homeRoomCategories(rooms.filter((r) => r.slug !== "private-double-room"))[1]
      .room.slug,
    "private-double-room-balcony",
  );
  assert.equal(homeRoomCategories([]).length, 0);
});
test("room and package selections carry the exact ID into the localized existing request page", () => {
  assert.equal(roomPreferredKind("twin-room"), "twin");
  assert.equal(roomPreferredKind("4-bed-dorm-room"), "dorm");
  assert.equal(roomPreferredKind("private-double-room-balcony"), "double");
  assert.equal(roomPreferredKind("unknown"), "mixed");
  for (const locale of ["en", "fr"] as const) {
    const r = new URL(
      roomRequestPath(locale, "a+b&c"),
      "https://example.invalid",
    );
    assert.equal(r.pathname, locale === "fr" ? "/fr/book" : "/book");
    assert.equal(r.searchParams.get("roomId"), "a+b&c");
    const p = new URL(
      packageRequestPath(locale, "package-123"),
      "https://example.invalid",
    );
    assert.equal(p.searchParams.get("packageId"), "package-123");
    assert.equal(p.searchParams.get("roomId"), null);
  }
});
test("approved guide prices and French room names preserve price basis without starter values", () => {
  assert.equal(homePrice(3500, "EUR", "en"), "€35");
  assert.match(homePrice(1500, "EUR", "fr"), /15/);
  assert.equal(homePrice(0, "EUR", "fr"), "Nous consulter");
  assert.equal(
    homeRoomName("family-room-4p", "Family", "fr"),
    "Suite familiale",
  );
});
test("custom surf choices use only recognized topics and produce translated editable enquiry text", () => {
  for (const topic of ["surf-stay", "lessons", "activities"] as const) {
    assert.ok(surfEnquiryIntro(topic, "en").length > 20);
    assert.ok(surfEnquiryIntro(topic, "fr").length > 20);
    assert.match(
      surfEnquiryPath("fr", topic),
      /^\/fr\/contact\?topic=.*#enquiry$/,
    );
  }
  assert.equal(surfEnquiryIntro("<script>injected</script>", "en"), "");
  assert.equal(surfEnquiryIntro(undefined, "fr"), "");
});
test("existing CMS supplies twelve section headings/bodies and defaults fill only missing values", () => {
  assert.equal(homeSectionOrder.length, 12);
  const content = contentSchema.parse({
    sections: homeSectionOrder.map((key) => ({
      heading: key,
      body: `Edited ${key}`,
    })),
  });
  assert.deepEqual(homeSection(content, "meals", "Default", "Default body"), {
    heading: "meals",
    body: "Edited meals",
  });
  assert.deepEqual(homeSection(null, "surf", "Surf", "Enquire"), {
    heading: "Surf",
    body: "Enquire",
  });
});
test("homepage analytics whitelist rejects free text and includes no contact, dates, queries or identifiers", () => {
  const p = homeConversionParams("room_request", "room", "fr");
  assert.deepEqual(p, {
    cta_id: "room_request",
    intent: "room",
    locale: "fr",
    event_source: "homepage",
  });
  assert.equal(homeConversionParams("guest@example.com", "room", "en"), null);
  assert.equal(
    homeConversionParams("room_request", "Name and phone", "en"),
    null,
  );
  assert.equal(homeConversionParams("room_request", "room", "unknown"), null);
  assert.deepEqual(Object.keys(p!).sort(), [
    "cta_id",
    "event_source",
    "intent",
    "locale",
  ]);
});

test("Google profile links reject deceptive hosts, credentials and arbitrary destinations", async () => {
  const { approvedGoogleReviewUrl, reviewLinkState } = await import(
    "../lib/google-business/review-links"
  );
  for (const value of [
    "javascript:alert(1)",
    "http://maps.google.com/",
    "https://www.google.com.evil.invalid/maps",
    "https://www.google.com@evil.invalid/maps",
    "https://user:secret@www.google.com/maps",
    "https://www.google.com:444/maps",
    "https://www.google.com/url?q=https://evil.invalid",
    "https://example.invalid/reviews",
    "https://goo.gl/anything",
  ])
    assert.equal(approvedGoogleReviewUrl(value), "", value);
  for (const value of [
    "https://maps.app.goo.gl/6jfHrM5LRffLZ2Ut9",
    "https://www.google.com/maps/place/Tifawave",
    "https://g.page/r/exampleId/review",
  ])
    assert.ok(approvedGoogleReviewUrl(value));
  const settings = {
    googleReviewsEnabled: true,
    googleReviewsProfileUrl: "",
    googleMapsUrl: "https://maps.app.goo.gl/6jfHrM5LRffLZ2Ut9",
    googleWriteReviewUrl: "",
  };
  assert.equal(reviewLinkState(settings).mode, "link-only");
  assert.equal(reviewLinkState(settings).visible, true);
  assert.equal(
    reviewLinkState({ ...settings, googleReviewsEnabled: false }).visible,
    false,
  );
  assert.equal(
    reviewLinkState({ ...settings, googleMapsUrl: "https://evil.invalid" })
      .visible,
    false,
  );
  assert.equal(reviewLinkState(settings).writeUrl, "");
});

test("homepage package component handles zero to three featured packages with one clear localized CTA", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { FeaturedPackages } = await import(
    "../components/home/featured-packages"
  );
  const { catalogueSchema } = await import("../lib/packages/catalogue");
  const fixture = (
    i: number,
  ): import("../lib/surf-packages").PublicSurfPackage => ({
    id: `layout-${i}`,
    slug: `layout-${i}`,
    name: `Layout fixture ${i}`,
    cover: null,
    startingVariant: null,
    shortDescription: "Synthetic layout test only",
    fullDescription: "",
    priceLabel: "Price on request",
    pricingLabel: "per person · shared accommodation",
    unitLabel: "7 nights",
    surfLevel: "Beginner",
    inclusions: [
      "Breakfast",
      "Test inclusion two",
      "Test inclusion three",
      "Test fourth",
    ],
    featured: true,
    tone: "ocean",
    catalogue: catalogueSchema.parse({}),
  });
  assert.equal(
    renderToStaticMarkup(
      createElement(FeaturedPackages, { packages: [], locale: "en" }),
    ),
    "",
  );
  for (const count of [1, 2, 3]) {
    const html = renderToStaticMarkup(
      createElement(FeaturedPackages, {
        packages: Array.from({ length: count }, (_, i) => fixture(i)),
        locale: "en",
      }),
    );
    assert.ok(html.includes(`data-count="${count}"`));
    assert.equal((html.match(/class="hc-package-card"/g) || []).length, count);
    assert.equal(
      (html.match(/View Package &amp; Request/g) || []).length,
      count,
    );
    assert.ok(!html.includes("Test fourth"));
    assert.ok(!html.includes("€0"));
  }
  const html = renderToStaticMarkup(
    createElement(FeaturedPackages, {
      packages: [fixture(0), { ...fixture(1), featured: false }],
      locale: "fr",
    }),
  );
  assert.ok(html.includes("/fr/surf/packages/layout-0"));
  assert.ok(html.includes("Voir le séjour et le demander"));
  assert.ok(!html.includes("layout-1"));
});

test("review fallback copy stays localized and uses editorial defaults for blank fields", async () => {
  const { reviewFallbackText, reviewFallbackDefaults } = await import(
    "../lib/google-business/review-links"
  );
  const settings = {
    googleReviewsFallbackEn: "  Owner-approved English introduction.  ",
    googleReviewsFallbackFr: "Présentation française approuvée.",
  };
  assert.equal(
    reviewFallbackText(settings, "en"),
    "Owner-approved English introduction.",
  );
  assert.equal(
    reviewFallbackText(settings, "fr"),
    "Présentation française approuvée.",
  );
  assert.equal(
    reviewFallbackText({ ...settings, googleReviewsFallbackFr: " " }, "fr"),
    reviewFallbackDefaults.fr,
  );
  assert.equal(reviewFallbackText({}, "en"), reviewFallbackDefaults.en);
});

test("premium reviews fallback has accessible source links without invented scores, quotes or images", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { ReviewsPanel } = await import("../components/home/reviews-panel");
  const settings = {
    googleReviewsEnabled: true,
    googleReviewsProfileUrl: "https://maps.app.goo.gl/6jfHrM5LRffLZ2Ut9",
    googleMapsUrl: "",
    googleWriteReviewUrl: "",
    googleReviewsFallbackEn: "Approved <b>editorial</b> invitation.",
    googleReviewsFallbackFr: "Présentation française approuvée.",
  };
  const render = (value: typeof settings, locale: "en" | "fr" = "en") =>
    renderToStaticMarkup(
      createElement(ReviewsPanel, { settings: value, locale }),
    );
  const en = render(settings);
  assert.ok(en.includes('aria-labelledby="hc-trust-title"'));
  assert.ok(en.includes("Guest Reviews"));
  assert.ok(en.includes("Read all reviews on Google"));
  assert.ok(en.includes("&lt;b&gt;editorial&lt;/b&gt;"));
  for (const absent of [
    "<blockquote",
    "<img",
    "ratingValue",
    "reviewCount",
    "★",
    "Leave a review",
  ])
    assert.ok(!en.includes(absent), absent);
  assert.ok(
    render({
      ...settings,
      googleWriteReviewUrl: "https://g.page/r/test-link/review",
    }).includes("Leave a review"),
  );
  assert.ok(
    !render({
      ...settings,
      googleWriteReviewUrl: "https://evil.invalid/review",
    }).includes("Leave a review"),
  );
  const fr = render(settings, "fr");
  assert.ok(fr.includes("Avis voyageurs"));
  assert.ok(fr.includes("Présentation française approuvée."));
  assert.ok(!fr.includes("Approved &lt;b&gt;"));
  assert.equal(render({ ...settings, googleReviewsEnabled: false }), "");
  assert.equal(
    render({ ...settings, googleReviewsProfileUrl: "https://evil.invalid" }),
    "",
  );
});

test("homepage media slots preserve legacy drafts and reject duplicate, unknown and unsafe choices", async () => {
  const { homeMediaSlots } = await import("../lib/content/home-slots");
  const legacy = contentSchema.parse({
    title: "Existing",
    sections: [
      {
        heading: "Old",
        body: "Copy",
        imageUrl: "https://images.unsplash.com/existing",
      },
    ],
  });
  assert.deepEqual(legacy.homeMedia, []);
  assert.equal(
    legacy.sections[0].imageUrl,
    "https://images.unsplash.com/existing",
  );
  const choices = Object.keys(homeMediaSlots).map((slot) => ({
    slot,
    imageUrl: "https://images.unsplash.com/real",
    mobileImage: "https://images.pexels.com/real-mobile",
    focal: "top",
    mobileFocal: "bottom",
    alt: "Owner choice",
  }));
  assert.equal(
    contentSchema.parse({ homeMedia: choices }).homeMedia.length,
    21,
  );
  assert.equal(
    contentSchema.safeParse({ homeMedia: [choices[0], choices[0]] }).success,
    false,
  );
  assert.equal(
    contentSchema.safeParse({
      homeMedia: [{ ...choices[0], slot: "not-a-position" }],
    }).success,
    false,
  );
  assert.equal(
    contentSchema.safeParse({
      homeMedia: [{ ...choices[0], imageUrl: "https://evil.invalid/photo" }],
    }).success,
    false,
  );
  assert.equal(
    contentSchema.safeParse({ roomOrder: ["room-dorm", "room-dorm"] }).success,
    false,
  );
  assert.deepEqual(
    contentSchema.parse({ roomOrder: ["room-family", "room-dorm"] }).roomOrder,
    ["room-family", "room-dorm"],
  );
});
test("branding accepts genuine property artwork only and bounds bilingual metadata", async () => {
  const { brandingSchema } = await import("../lib/content/branding-schema");
  assert.equal(
    brandingSchema.safeParse({
      logo: "https://tuzefzcosvvhzffbxhpm.supabase.co/storage/v1/object/public/tifawave-media/brand/logo.png",
    }).success,
    true,
  );
  for (const logo of [
    "https://images.unsplash.com/logo",
    "https://evil.invalid/logo",
    "javascript:alert(1)",
    "https://tuzefzcosvvhzffbxhpm.supabase.co.evil.invalid/logo",
  ])
    assert.equal(brandingSchema.safeParse({ logo }).success, false);
  assert.equal(
    brandingSchema.safeParse({ titleFr: "x".repeat(181) }).success,
    false,
  );
  assert.equal(
    brandingSchema.safeParse({ secret: "never accepted" }).success,
    false,
  );
});

test("brand artwork processing preserves full artwork and emits the required PNG resolutions", async () => {
  const sharp = (await import("sharp")).default;
  const { validateArtworkDimensions, renderBrandIcon } = await import(
    "../lib/content/brand-image"
  );
  assert.throws(() => validateArtworkDimensions("logo", 111, 112));
  assert.throws(() => validateArtworkDimensions("favicon", 96, 128));
  assert.throws(() => validateArtworkDimensions("appleIcon", 128, 128));
  validateArtworkDimensions("logo", 400, 112);
  validateArtworkDimensions("favicon", 512, 512);
  const original = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 23, g: 63, b: 57, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
  for (const size of [96, 180, 192, 512]) {
    const out = await renderBrandIcon(original, size);
    const meta = await sharp(out).metadata();
    assert.equal(meta.width, size);
    assert.equal(meta.height, size);
    assert.equal(meta.format, "png");
  }
  assert.throws(() => renderBrandIcon(original, 48));
});
