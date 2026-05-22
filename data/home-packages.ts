export const homePackages = [
  {
    name: "Surf & Stay",
    bestFor: "Best for independent surfers & nomads",
    price: "€59",
    unit: "night",
    featured: false,
    tone: "ocean",
    inclusions: [
      "Daily guided sessions",
      "Breakfast & board storage",
      "Flexible nights · fast wifi"
    ]
  },
  {
    name: "Coached Surf Week",
    bestFor: "Best for improvers who want results",
    price: "€690",
    unit: "week",
    featured: true,
    tone: "sunset",
    inclusions: [
      "5x coached sessions + video analysis",
      "Private room · breakfast + 3 dinners",
      "Yoga 2x · airport transfer"
    ]
  },
  {
    name: "Private Progression",
    bestFor: "Best for couples & fast progress",
    price: "€1,290",
    unit: "week",
    featured: false,
    tone: "clay",
    inclusions: [
      "1:1 / 1:2 daily coaching",
      "Suite · all meals included",
      "Hammam & transfers"
    ]
  }
] as const;
