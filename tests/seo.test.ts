import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PackageHighlights } from "../components/content/package-highlights";
import { packageInclusionDetails } from "../lib/packages/card-content";
import { pageSeoDefaults, roomSeoDefaults, withTifawaveBrand } from "../lib/seo-metadata";

test("six bilingual rendered package outputs hide draft targets and retain conditional services", () => {
  // Historical internal targets are regression fixtures, never selling prices.
  for (const target of [399, 199, 489]) for (const locale of ["en", "fr"] as const) {
    const lines = locale === "en"
      ? ["7 nights’ accommodation", "7 breakfasts", "Surf equipment: availability to confirm", `Internal planning target only: EUR ${target}/person. No selling price approved.`, "Private note: approval pending"]
      : ["Hébergement pour 7 nuits", "7 petits-déjeuners", "Matériel de surf : disponibilité à confirmer", `Objectif interne uniquement : ${target} €/personne. Aucun tarif de vente approuvé.`, "Note interne : validation en attente"];
    const cards = renderToStaticMarkup(createElement(PackageHighlights, { inclusions: lines, locale }));
    const detail = renderToStaticMarkup(createElement("ul", {}, packageInclusionDetails(lines,locale).map((line,i)=>createElement("li",{key:i,"data-status":line.status},line.text," ",line.note))));
    for (const html of [cards,detail]) {
      assert.ok(!html.includes(String(target)));
      assert.doesNotMatch(html,/internal planning|objectif interne|approval pending|validation en attente/i);
      assert.match(html,/quote/);
    }
  }
});

test("French room metadata is localized and descriptions reflect actual room facts", () => {
  const expected = {
    "4-bed-dorm-room": "Lit en dortoir",
    "private-double-room": "Chambre double",
    "private-double-room-balcony": "Chambre double avec balcon",
    "twin-room": "Chambre twin",
    "triple-room": "Chambre triple",
    "family-room-4p": "Suite familiale",
  };
  const descriptions = new Set<string>();
  for (const [slug,name] of Object.entries(expected)) {
    const result = roomSeoDefaults({slug,name:"English database name",maxGuests:slug.includes("family")?4:slug.includes("triple")?3:2,bathroomType:slug.includes("dorm")?"shared_dorm":"private"},"fr",true);
    assert.equal(result.title,`${name} à Tamraght | Tifawave`);
    assert.match(result.description,/Petit-déjeuner inclus/);
    descriptions.add(result.description);
  }
  assert.equal(descriptions.size,6);
  const unknown = roomSeoDefaults({slug:"unknown",name:"Owner room",maxGuests:2},"en",false);
  assert.doesNotMatch(unknown.description,/breakfast|bathroom/i);
});

test("metadata does not duplicate the brand or infer prices and providers", () => {
  assert.equal(withTifawaveBrand("Owner title"),"Owner title | Tifawave");
  assert.equal(withTifawaveBrand("Owner title | Tifawave"),"Owner title | Tifawave");
  for (const page of Object.values(pageSeoDefaults)) for (const seo of Object.values(page)) {
    assert.ok(seo.title.length < 80);
    assert.doesNotMatch(seo.description,/\b(?:399|199|489)\b|guaranteed|daily yoga|airport transfer/i);
  }
});
