import { requestContextQuery } from "../lib/booking/navigation";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  packageHighlights,
  publicPackageInclusions,
} from "../lib/packages/card-content";

test("cards promote useful inclusions after the third line without inventing quantities or losing quote conditions", () => {
  const lines = [
    "7 nights’ accommodation",
    "7 breakfasts",
    "Access to shared hostel spaces",
    "4 homemade Moroccan dinners: arrangements and cost to confirm",
    "5 coached surf days",
    "Surfboard and wetsuit during lessons: availability and cost to confirm",
    "Surf-spot transport: provider, vehicle and cost to confirm",
    "Internal planning target only: EUR 399/person. No selling price approved.",
    "One Paradise Valley or Timlalin excursion: arrangements to confirm",
  ];
  const before = JSON.stringify(lines);
  const rows = packageHighlights(lines, "en");
  assert.deepEqual(
    rows.map((x) => x.key),
    [
      "accommodation",
      "breakfast",
      "dinner",
      "coaching",
      "equipment",
      "transfers",
      "excursion",
    ],
  );
  assert.equal(rows[2].text, "4 Moroccan dinners");
  assert.equal(rows[2].status, "quote");
  assert.equal(rows[3].text, "5 coached surf days");
  assert.equal(rows[3].status, "included");
  assert.equal(rows[4].text, "Board & wetsuit for lessons");
  assert.equal(rows[4].status, "quote");
  assert.equal(rows[5].status, "quote");
  assert.ok(!JSON.stringify(rows).includes("399"));
  assert.equal(
    JSON.stringify(lines),
    before,
    "presentation never rewrites saved business data",
  );
});

test("French card highlights preserve quantities, quote status and singular dinner wording", () => {
  const rows = packageHighlights(
    [
      "Hébergement pour 3 nuits",
      "3 petits-déjeuners",
      "1 dîners marocains faits maison : organisation et coût à confirmer",
      "2 cours de surf",
      "Planche et combinaison pendant les cours : disponibilité et coût à confirmer",
      "Transport vers les spots : coût à confirmer",
    ],
    "fr",
  );
  assert.deepEqual(
    rows.map((x) => x.status),
    ["included", "included", "quote", "included", "quote", "quote"],
  );
  assert.equal(rows[2].text, "1 dîner marocain");
  assert.equal(rows[3].text, "2 cours de surf");
  assert.equal(rows[4].text, "Planche et combinaison en cours");
});

test("missing or excluded services never gain included checkmarks, and airport transfers are not surf transfers", () => {
  const empty = packageHighlights([], "en");
  assert.equal(empty.length, 6);
  assert.ok(empty.every((x) => x.status === "ask"));
  const rows = packageHighlights(
    ["Breakfast", "Dinner not included", "Airport transfers included"],
    "en",
  );
  assert.equal(rows.find((x) => x.key === "dinner")?.status, "excluded");
  assert.equal(rows.find((x) => x.key === "transfers")?.status, "ask");
});

test("internal pricing instructions are excluded from guest inclusions while legitimate private-room features remain", () => {
  const result = publicPackageInclusions([
    "Internal planning target only: EUR 399/person",
    "Objectif interne uniquement : 399 €/personne",
    "Private bathroom",
    "Private surf lesson",
    "Breakfast",
  ]);
  assert.deepEqual(result, [
    "Private bathroom",
    "Private surf lesson",
    "Breakfast",
  ]);
});
import {
  catalogueSchema,
  emptyCatalogue,
  packageEstimate,
  packageStartingPrice,
  localized,
  levelLabel,
  pricingBasis,
} from "../lib/packages/catalogue";
import { bookingRequestSchema } from "../lib/booking/schema";
import { reservationEmail } from "../lib/email/templates";
const catalogue = {
  ...emptyCatalogue(),
  nights: 7,
  chargesIncluded: true,
  variants: [
    {
      id: "double",
      roomId: "11111111-1111-4111-8111-111111111111",
      label: "Double",
      labelFr: "Chambre double",
      priceCents: 10000,
    },
  ],
  extras: [
    {
      id: "yoga",
      label: "Test only",
      labelFr: "Test uniquement",
      priceCents: 2000,
      basis: "person" as const,
    },
  ],
  seasons: [
    {
      id: "season",
      label: "Test season",
      variantId: "double",
      start: "2031-06-01",
      end: "2031-07-01",
      priceCents: 15000,
    },
  ],
};
test("seasonal whole-package estimates use arrival boundary and correct party/extra basis", () => {
  assert.equal(
    packageEstimate(catalogue, "double", "2031-06-30", 2, ["yoga"])?.total,
    34000,
  );
  assert.equal(
    packageEstimate(catalogue, "double", "2031-07-01", 2, [])?.total,
    20000,
  );
  assert.equal(
    packageEstimate(
      { ...catalogue, pricingBasis: "booking" },
      "double",
      "2031-06-20",
      3,
      ["yoga"],
    )?.total,
    21000,
  );
});
test("unknown package or extra prices remain personal quotes, including zero-priced legitimate extras", () => {
  assert.equal(
    packageEstimate(
      {
        ...catalogue,
        variants: [{ ...catalogue.variants[0], priceCents: null }],
      },
      "double",
      "2031-08-01",
      2,
    )?.total,
    null,
  );
  assert.equal(
    packageEstimate(
      { ...catalogue, extras: [{ ...catalogue.extras[0], priceCents: null }] },
      "double",
      "2031-06-01",
      2,
      ["yoga"],
    )?.total,
    null,
  );
  assert.equal(
    packageEstimate(
      { ...catalogue, extras: [{ ...catalogue.extras[0], priceCents: 0 }] },
      "double",
      "2031-06-01",
      2,
      ["yoga"],
    )?.total,
    30000,
  );
});
test("catalogue validation rejects duplicate IDs, overlapping seasons and non-existent variants", () => {
  assert.equal(catalogueSchema.safeParse(catalogue).success, true);
  for (const patch of [
    { variants: [catalogue.variants[0], catalogue.variants[0]] },
    {
      seasons: [
        catalogue.seasons[0],
        { ...catalogue.seasons[0], id: "overlap", variantId: "" },
      ],
    },
    { seasons: [{ ...catalogue.seasons[0], variantId: "missing" }] },
    { variants: [{ ...catalogue.variants[0], priceCents: -1 }] },
  ])
    assert.equal(
      catalogueSchema.safeParse({ ...catalogue, ...patch }).success,
      false,
    );
});
test("public package requests accept IDs/preferences only and reject protected fields", () => {
  const request = {
    bookingType: "surf_package",
    packageId: "11111111-1111-4111-8111-111111111111",
    packageVariant: "double",
    packageExtras: ["yoga"],
    surfLevel: "beginner",
    checkIn: "2031-06-01",
    checkOut: "2031-06-08",
    guests: 2,
    guestName: "Test fixture",
    guestEmail: "test@example.invalid",
    guestPhone: "+212600000000",
  };
  assert.ok(bookingRequestSchema.safeParse(request).success);
  for (const patch of [
    { packageVariant: "" },
    { priceCents: 1 },
    { packageSelection: {} },
    { status: "confirmed" },
    { unitIds: [] },
    { quotedAmountCents: 1 },
  ])
    assert.equal(
      bookingRequestSchema.safeParse({ ...request, ...patch }).success,
      false,
    );
});
test("package copy helpers retain French level and whole-stay pricing meaning", () => {
  assert.equal(localized("Double", "Chambre double", "fr"), "Chambre double");
  assert.equal(levelLabel("beginner", "fr"), "Débutant");
  assert.match(pricingBasis("person", "fr"), /personne.*complet/);
});
test("both package emails include frozen variant, level, extras, rate basis and Pending copy safely", () => {
  const snapshot = {
    id: "test-id",
    variantId: "double",
    variantLabel: "<b>Double</b>",
    surfLevel: "beginner",
    nights: 7,
    currency: "EUR",
    basis: "person",
    basePriceCents: 15000,
    totalCents: 34000,
    season: "Test season",
    extras: [
      { id: "yoga", label: "Test option", priceCents: 2000, basis: "person" },
    ],
    inclusions: ["Breakfast"],
    exclusions: ["Dinner"],
  };
  const base = {
    name: "Fixture",
    email: "test@example.invalid",
    phone: null,
    checkIn: "2031-06-01",
    checkOut: "2031-06-08",
    guests: 2,
    locale: "fr" as const,
    reference: "TW-TEST",
    preference: null,
    notes: null,
    bookingType: "surf_package",
    package: "Test package",
    units: [],
    packageSelection: snapshot,
  };
  for (const event of ["received", "owner_alert"] as const) {
    const mail = reservationEmail(event, base);
    assert.match(mail.text, /double/);
    assert.match(mail.text, /Test option/);
    assert.match(mail.text, /Débutant/);
    assert.match(mail.text, /personne, séjour complet/);
    assert.ok(!mail.html.includes("<b>Double</b>"));
    assert.match(mail.subject, /attente|demande/);
  }
});

test("language switching retains package/variant/dates without copying contact or price fields", () => {
  const q = requestContextQuery(
    "?packageId=11111111-1111-4111-8111-111111111111&variantId=twin-room&checkIn=2031-06-01&checkOut=2031-06-08&guests=2&guestEmail=private@example.invalid&message=private&price=1",
  );
  assert.equal(new URLSearchParams(q).get("variantId"), "twin-room");
  assert.equal(new URLSearchParams(q).get("guests"), "2");
  assert.ok(!q.includes("private"));
  assert.ok(!q.includes("price"));
  assert.equal(
    requestContextQuery("?variantId=unsafe/value&checkIn=2031-02-30&guests=24"),
    "",
  );
});

// Test prices are synthetic fixtures and never applied to a hosted catalogue.
test("starting rate excludes expired seasons and base prices hidden by quote seasons", () => {
  const c = {
    ...catalogue,
    seasons: [
      {
        ...catalogue.seasons[0],
        start: "2020-01-01",
        end: "2020-02-01",
        priceCents: 100,
      },
    ],
  };
  assert.equal(packageStartingPrice(c, "2031-05-01")?.priceCents, 10000);
  assert.equal(
    packageStartingPrice(
      {
        ...c,
        seasons: [
          {
            ...c.seasons[0],
            start: "2031-01-01",
            end: "2033-01-01",
            priceCents: null,
          },
        ],
      },
      "2031-05-01",
    ),
    null,
  );
  assert.equal(
    packageStartingPrice({ ...c, chargesIncluded: false }, "2031-05-01"),
    null,
  );
});
test("per-room rates count the configured rooms once and reject invalid occupancy or extras", () => {
  const c = {
    ...catalogue,
    pricingBasis: "room" as const,
    variants: [
      { ...catalogue.variants[0], roomCount: 2, minGuests: 2, maxGuests: 4 },
    ],
  };
  assert.equal(
    packageEstimate(c, "double", "2031-08-01", 4, ["yoga"])?.total,
    28000,
  );
  assert.equal(packageEstimate(c, "double", "2031-08-01", 1), null);
  assert.equal(packageEstimate(c, "double", "2031-08-01", 5), null);
  assert.equal(packageEstimate(c, "double", "2031-08-01", 2, ["forged"]), null);
});
