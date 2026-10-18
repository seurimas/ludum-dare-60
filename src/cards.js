import { ENERGY_TYPES } from "./energy.js";

// Permanent key: future formats must migrate existing cards here, never switch
// keys or reseed to bypass a save. v6 is the last user-authorized reset.
export const STORAGE_KEY = "card-sheet-maker-v6";
export const CARD_FORMAT_VERSION = 6;
export const CARD_COUNT = 6;
export const TRIBES = ENERGY_TYPES.map((type) => type.name);
export const CIRCLE_CONTENTS = ["empty", ...TRIBES, "equal", "asterisk"];
export const MAX_CIRCLES = 6;
export const blankCircle = () => ({ content: "empty" });

export const CIRCLE_SHORTCUTS = ["1 tribe", "2 tribe", "1 any", "special"];

export function applyCircleShortcut(name, circles, tribe) {
  if (!CIRCLE_SHORTCUTS.includes(name)) throw new Error(`Unknown circle shortcut: ${name}`);
  if (name === "special") return circles.map((circle) => ({ ...circle, content: "asterisk" }));
  if (name === "1 any") return [blankCircle()];
  if (!TRIBES.includes(tribe)) throw new Error(`Unknown tribe: ${tribe}`);
  return Array.from({ length: name === "2 tribe" ? 2 : 1 }, () => ({ content: tribe }));
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
    circles: card.circles,
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

export const serializeBackup = (pages) => JSON.stringify({ version: CARD_FORMAT_VERSION, pages }, null, 2);
export const copyCard = (card) => ({
  ...card,
  circles: card.circles.map((circle) => ({ ...circle })),
});
export const copyPage = (page) => ({ ...page, name: `${page.name} (copy)`, cards: page.cards.map(copyCard) });

export function validateBackup(data) {
  // Future versions need explicit, lossless migrations and regression fixtures.
  // Unsupported or damaged saves must remain untouched, never become seed data.
  if (!data || data.version !== CARD_FORMAT_VERSION || !Array.isArray(data.pages) || data.pages.length === 0) {
    throw new Error("The backup must use format version 6 and contain at least one page. Older page formats are not supported.");
  }
  return data.pages.map((page, index) => {
    if (!page || typeof page.name !== "string") {
      throw new Error(`Page ${index + 1} must have a text name.`);
    }
    try {
      return { ...page, name: page.name, cards: validateCards(page.cards) };
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
    const invalid = () => new Error(`Card ${index + 1} has invalid data. Use text fields, a supported tribe, a Component toggle, a cost from 3-6, and up to ${MAX_CIRCLES} circles containing empty, a tribe, equal, or asterisk.`);
    if (!card || typeof card.title !== "string" || !TRIBES.includes(card.tribe) ||
        typeof card.keywords !== "string" || typeof card.component !== "boolean" ||
        !Number.isInteger(card.cost) || card.cost < 3 || card.cost > 6 ||
        !Array.isArray(card.circles) || card.circles.length > MAX_CIRCLES) throw invalid();
    const circles = card.circles.map((circle, circleIndex) => {
      if (circle && ["value", "star", "icon"].some((field) => Object.hasOwn(circle, field))) {
        throw new Error(`Card ${index + 1}, circle ${circleIndex + 1}: data consistency error: legacy numbered circles and above/below decorations are not supported. Saved data has not been changed.`);
      }
      if (!circle || !CIRCLE_CONTENTS.includes(circle.content)) throw invalid();
      return { ...circle, content: circle.content };
    });
    return {
      ...card,
      title: card.title, tribe: card.tribe, keywords: card.keywords,
      component: card.component, cost: card.cost, circles,
    };
  });
}
