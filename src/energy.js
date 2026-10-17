export const ENERGY_TYPES = [
  { name: "Yonar", symbol: "peace" },
  { name: "Tiltch", symbol: "wooden club" },
  { name: "Naxatu", symbol: "interrobang" },
];

export const ENERGY_CARDS_PER_PAGE = 9;

export function createEnergyPages() {
  const singles = ENERGY_TYPES.flatMap((type) =>
    Array.from({ length: 8 }, () => ({ types: [type.name] })),
  );
  const pairs = [
    ["Yonar", "Tiltch"],
    ["Yonar", "Naxatu"],
    ["Tiltch", "Naxatu"],
  ];
  const splits = pairs.flatMap((pair) =>
    Array.from({ length: 4 }, () => ({ types: [...pair] })),
  );
  const cards = [...singles, ...splits];
  return Array.from({ length: Math.ceil(cards.length / ENERGY_CARDS_PER_PAGE) }, (_, index) => ({
    name: `Energy ${index + 1}`,
    cards: cards.slice(index * ENERGY_CARDS_PER_PAGE, (index + 1) * ENERGY_CARDS_PER_PAGE),
  }));
}
