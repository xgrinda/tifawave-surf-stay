import type { Locale } from "@/lib/i18n";

const normalized = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Internal planning text is never a guest inclusion or a selling price. */
export function publicPackageInclusions(lines: string[]): string[] {
  return lines.filter(
    (line) =>
      !/^(?:internal (?:planning|note|only)|private (?:planning|note)|planning target|objectif interne|notes? (?:interne|privee)|no selling price approved|aucun tarif de vente approuve)/.test(
        normalized(line.trim()),
      ),
  );
}

const features = [
  {
    key: "accommodation",
    label: ["Accommodation", "Hébergement"],
    match: /accommodation|hebergement/,
  },
  {
    key: "breakfast",
    label: ["Breakfast", "Petit-déjeuner"],
    match: /breakfast|petits?[- ]dejeuners?/,
  },
  {
    key: "dinner",
    label: ["Moroccan dinners", "Dîners marocains"],
    match: /dinners?|diners?/,
  },
  {
    key: "coaching",
    label: ["Surf coaching", "Cours de surf"],
    match: /coach|lessons?|cours.*surf|cours[,;]|surf.*encadre/,
  },
  {
    key: "equipment",
    label: ["Surf equipment", "Matériel de surf"],
    match:
      /surfboard|wetsuit|surf equipment|planche|combinaison|materiel.*surf/,
  },
  {
    key: "transfers",
    label: ["Surf-spot transfers", "Transports vers les spots"],
    match: /surf.*(?:transport|transfer)|(?:transport|transfer).*spots/,
  },
  {
    key: "excursion",
    label: ["Local excursion", "Excursion locale"],
    match: /excursion|paradise valley|timlalin/,
  },
] as const;
export type PackageHighlight = {
  key: (typeof features)[number]["key"];
  text: string;
  status: "included" | "quote" | "ask" | "excluded";
};

/** Use the existing editable public lines; never infer quantities or prices. */
export function packageHighlights(
  lines: string[],
  locale: Locale,
  description = "",
): PackageHighlight[] {
  const fr = locale === "fr";
  const publicLines = publicPackageInclusions(lines);
  return features.flatMap<PackageHighlight>((feature) => {
    const matches = publicLines.filter(
      (line) =>
        feature.match.test(normalized(line)) &&
        !(
          feature.key === "coaching" && features[4].match.test(normalized(line))
        ),
    );
    if (!matches.length)
      return feature.key === "excursion"
        ? []
        : [
            {
              key: feature.key,
              text: feature.label[fr ? 1 : 0],
              status: "ask" as const,
            },
          ];
    const source = matches.join("; ");
    const sourceKey = normalized(source);
    const excluded = /not included|non inclus|not available|indisponible/.test(
      sourceKey,
    );
    const needsConfirmation =
      /to confirm|on request|subject to|optional|personal quote|a confirmer|sur demande|sous reserve|facultatif|sur devis|devis personnalise/;
    const conditional =
      needsConfirmation.test(sourceKey) ||
      description.split(/[.!?]/).some((sentence) => {
        const key = normalized(sentence);
        return feature.match.test(key) && needsConfirmation.test(key);
      });
    let text = matches[0].split(/\s*:\s*/)[0].trim();
    if (
      feature.key === "equipment" &&
      /surfboard|planche/.test(sourceKey) &&
      /wetsuit|combinaison/.test(sourceKey)
    )
      text = /during lessons|pendant les cours/.test(sourceKey)
        ? fr
          ? "Planche et combinaison en cours"
          : "Board & wetsuit for lessons"
        : fr
          ? "Planche et combinaison"
          : "Surfboard & wetsuit";
    if (feature.key === "transfers") text = feature.label[fr ? 1 : 0];
    if (feature.key === "dinner") {
      text = text.replace(/homemade\s+/i, "").replace(/\s+faits? maison/i, "");
      if (/^1\s/.test(text))
        text = text
          .replace(/dinners/i, "dinner")
          .replace(/dîners/i, "dîner")
          .replace(/marocains/i, "marocain");
    }
    return [
      {
        key: feature.key,
        text,
        status: excluded
          ? ("excluded" as const)
          : conditional
            ? ("quote" as const)
            : ("included" as const),
      },
    ];
  });
}
