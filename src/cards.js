import { ENERGY_TYPES } from "./energy.js";

export const STORAGE_KEY = "card-sheet-maker-v6";
export const CARD_COUNT = 6;
export const TRIBES = ENERGY_TYPES.map((type) => type.name);
export const CIRCLE_VALUES = [2, 3, 4, 5, 6];
export const MAX_CIRCLES = 6;
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
  tribe: TRIBES[0],
  keywords: "",
  component: false,
  cost: 3,
  circles: [],
});

export function setComponent(card, component) {
  return {
    ...card,
    component,
    circles: component && card.circles.length < 3
      ? [...card.circles, ...Array.from({ length: 3 - card.circles.length }, blankCircle)]
      : card.circles,
  };
}

export const blankSheet = () => Array.from({ length: CARD_COUNT }, blankCard);
export const blankPage = (name = "Page 1") => ({ name, cards: blankSheet() });

export function createInitialPages() {
  const cards = TRIBES.flatMap((tribe) =>
    [3, 3, 3, 4, 4, 5, 5, 6].map((cost, index) => ({
      ...blankCard(), tribe, cost, title: `${tribe} ${index + 1}`,
    })),
  );
  return Array.from({ length: cards.length / CARD_COUNT }, (_, index) => ({
    name: `Page ${index + 1}`,
    cards: cards.slice(index * CARD_COUNT, (index + 1) * CARD_COUNT),
  }));
}

export const serializeBackup = (pages) => JSON.stringify({ version: 6, pages }, null, 2);
export const copyCard = (card) => ({
  ...card,
  circles: card.circles.map((circle) => ({ ...circle })),
});
export const copyPage = (page) => ({ name: `${page.name} (copy)`, cards: page.cards.map(copyCard) });

export function validateBackup(data) {
  if (!data || data.version !== 6 || !Array.isArray(data.pages) || data.pages.length === 0) {
    throw new Error("The backup must use format version 6 and contain at least one page. Older page formats are not supported.");
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
    const invalid = () => new Error(`Card ${index + 1} has invalid data. Use text fields, a supported tribe, a Component toggle, a cost from 3-6, and up to ${MAX_CIRCLES} numbered circles (at least 3 for components), with boolean stars and optional eye icons.`);
    if (!card || typeof card.title !== "string" || !TRIBES.includes(card.tribe) ||
        typeof card.keywords !== "string" || typeof card.component !== "boolean" ||
        !Number.isInteger(card.cost) || card.cost < 3 || card.cost > 6 ||
        !Array.isArray(card.circles) || card.circles.length > MAX_CIRCLES ||
        (card.component && card.circles.length < 3)) throw invalid();
    const circles = card.circles.map((circle) => {
      if (!circle || !CIRCLE_VALUES.includes(circle.value) ||
          typeof circle.star !== "boolean" || ![null, "eye"].includes(circle.icon)) throw invalid();
      return { value: circle.value, star: circle.star, icon: circle.icon };
    });
    return {
      title: card.title, tribe: card.tribe, keywords: card.keywords,
      component: card.component, cost: card.cost, circles,
    };
  });
}
