import { test } from "node:test";
import assert from "node:assert/strict";
import {
  catalogueSchema,
  emptyCatalogue,
  packageEstimate,
  localized,
  levelLabel,
  pricingBasis,
} from "../lib/packages/catalogue";
import { bookingRequestSchema } from "../lib/booking/schema";
import { reservationEmail } from "../lib/email/templates";
const catalogue = {
  ...emptyCatalogue(),
  nights: 7,
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
