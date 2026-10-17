export const STORAGE_KEY = "card-sheet-maker-v5";
export const CARD_COUNT = 6;
export const COLORS = ["red", "blue", "green", "white", "black"];
export const CIRCLE_VALUES = [2, 3, 4, 5, 6];
export const MAX_CIRCLES = 3;
export const blankCircle = () => ({ value: 2, star: false, icon: null });

export const CIRCLE_PRESETS = {
  Early: [
    { value: 5, star: false, icon: null },
    { value: 4, star: true, icon: "eye" },
  ],
  Late: [
    { value: 5, star: false, icon: null },
    { value: 3, star: true, icon: null },
    { value: 2, star: true, icon: "eye" },
  ],
  Standard: [
    { value: 5, star: false, icon: null },
    { value: 3, star: true, icon: null },
  ],
};

export function createCirclePreset(name) {
  if (!Object.hasOwn(CIRCLE_PRESETS, name)) throw new Error(`Unknown circle preset: ${name}`);
  return CIRCLE_PRESETS[name].map((circle) => ({ ...circle }));
}

export const blankCard = () => ({
  title: "",
  tribe: "",
  keywords: "",
  color: "white",
  circles: [],
  costs: [{ color: "white", number: 1 }],
});

export const blankSheet = () => Array.from({ length: CARD_COUNT }, blankCard);
export const blankPage = (name = "Page 1") => ({ name, cards: blankSheet() });

export function createInitialPages() {
  const layouts = [
    { color: "blue", role: "Replicators", tribes: [["nomi", 3], ["runite", 2], ["nuke", 1]] },
    { color: "red", role: "Assemblers", tribes: [["runite", 4], ["nomi", 2]] },
    { color: "green", role: "Reassemblers", tribes: [["nuke", 3], ["nomi", 2], ["runite", 1]] },
    { color: "black", role: "Pulsars", tribes: [["nuke", 4], ["nomi", 1], ["runite", 1]] },
    { color: "white", role: "Adapters", tribes: [["nomi", 2], ["runite", 2], ["nuke", 2]] },
  ];
  return layouts.map(({ color, role, tribes }) => ({
    name: color[0].toUpperCase() + color.slice(1),
    cards: tribes.flatMap(([tribe, count]) => Array.from({ length: count }, (_, index) => ({
      ...blankCard(),
      color,
      tribe,
      title: `${tribe[0].toUpperCase() + tribe.slice(1)} ${role}`,
      circles: createCirclePreset(
        color === "black" && (tribe !== "nuke" || index < 3) ? "Early" :
        (color === "blue" && (tribe !== "nomi" || index < 2)) ||
        (color === "green" && ((tribe === "nuke" && index === 0) || tribe === "nomi")) ||
        (color === "red" && tribe === "runite" && index < 2) ? "Late" : "Standard",
      ).map((circle) => color === "white" ? { ...circle, star: false } : circle),
    }))),
  }));
}

export const serializeBackup = (pages) => JSON.stringify({ version: 5, pages }, null, 2);
export const copyCard = (card) => ({
  ...card,
  circles: card.circles.map((circle) => ({ ...circle })),
  costs: card.costs.map((cost) => ({ ...cost })),
});
export const copyPage = (page) => ({ name: `${page.name} (copy)`, cards: page.cards.map(copyCard) });

export function validateBackup(data) {
  if (!data || data.version !== 5 || !Array.isArray(data.pages) || data.pages.length === 0) {
    throw new Error("The backup must use format version 5 and contain at least one page. Older page formats are not supported.");
  }
  return data.pages.map((page, index) => {
    if (!page || typeof page.name !== "string") {
      throw new Error(`Page ${index + 1} must have a text name.`);
    }
    try {
      return { name: page.name, cards: validateCards(page.cards) };
    } catch (error) {
      throw new Error(`Page ${index + 1}: ${error.message}`);
    }
  });
}

function validateCards(cards) {
  if (!Array.isArray(cards) || cards.length !== CARD_COUNT) {
    throw new Error(`Each page must contain exactly ${CARD_COUNT} cards.`);
  }
  return cards.map((card, index) => {
    const invalid = () => new Error(`Card ${index + 1} has invalid data. Use text fields, a supported card color, up to ${MAX_CIRCLES} circles with a number from 2-6, a star toggle and an optional eye icon, and 1-5 costs with a supported color and a whole number from 1 to 999.`);
    if (!card || typeof card.title !== "string" || typeof card.tribe !== "string" ||
        typeof card.keywords !== "string" || !COLORS.includes(card.color) ||
        !Array.isArray(card.costs) || card.costs.length < 1 || card.costs.length > 5) {
      throw invalid();
    }
    if (!Array.isArray(card.circles) || card.circles.length > MAX_CIRCLES) throw invalid();
    const circles = card.circles.map((circle) => {
      if (!circle || !CIRCLE_VALUES.includes(circle.value) ||
          typeof circle.star !== "boolean" || ![null, "eye"].includes(circle.icon)) throw invalid();
      return { value: circle.value, star: circle.star, icon: circle.icon };
    });
    const costs = card.costs.map((cost) => {
      if (!cost || !COLORS.includes(cost.color) || !Number.isInteger(cost.number) || cost.number < 1 || cost.number > 999) {
        throw invalid();
      }
      return { color: cost.color, number: cost.number };
    });
    return { title: card.title, tribe: card.tribe, keywords: card.keywords, color: card.color, circles, costs };
  });
}
