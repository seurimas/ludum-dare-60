import { ENERGY_TYPES } from "./energy.js";

// Permanent key: future formats must migrate existing cards here, never switch
// keys or reseed to bypass a save. v6 is the last user-authorized reset.
export const STORAGE_KEY = "card-sheet-maker-v6";
export const CARD_FORMAT_VERSION = 6;
export const CARD_COUNT = 6;
export const SYMBOL_TRIBES = ENERGY_TYPES.map((type) => type.name);
export const TRIBES = [...SYMBOL_TRIBES, "Starter", "Omni"];
// Starter prints no cost. Omni always prints one circle per symbol tribe, with
// any cost above 3 filled by empty circles, so it keeps a cost selector.
export const NO_COST_SELECTOR_TRIBES = ["Starter"];
export const NO_TRIBE_SHORTCUT_TRIBES = ["Starter", "Omni"];
export const CIRCLE_CONTENTS = ["empty", ...SYMBOL_TRIBES, "equal", "asterisk"];
export const ATTACHABLE_SLOTS = ["left", "right", "bottom"];
export const blankAttachables = () => ({ left: "", right: "", bottom: "" });
export const SIDE_ATTACHABLE_SLOTS = ["left", "right"];
// Side markers sit where circles would print, so a non-component, non-relic card uses one or the other.
export const hasSideAttachables = (card) => !card.component && !card.relic && SIDE_ATTACHABLE_SLOTS.some((slot) => card.attachables?.[slot]?.trim());
export const hasCircleSideConflict = (card) => hasSideAttachables(card) && card.circles.length > 0;
export const MAX_CIRCLES = 6;
export const blankCircle = () => ({ content: "empty" });

// Relic cards are upright (unlike rotated Components) and split into fixed
// thirds, each with free text and a fixed row of unlabeled 8mm boxes.
export const RELIC_SECTIONS = ["top", "middle", "bottom"];
export const RELIC_BOX_COUNTS = { top: 3, middle: 3, bottom: 4 };
export const blankRelicText = () => ({ top: "", middle: "", bottom: "" });

export const CIRCLE_SHORTCUTS = ["1 tribe", "2 tribe", "1 any", "special"];

export function applyCircleShortcut(name, circles, tribe) {
  if (!CIRCLE_SHORTCUTS.includes(name)) throw new Error(`Unknown circle shortcut: ${name}`);
  if (name === "special") return circles.map((circle) => ({ ...circle, content: "asterisk" }));
  if (name === "1 any") return [blankCircle()];
  if (!TRIBES.includes(tribe)) throw new Error(`Unknown tribe: ${tribe}`);
  if (NO_TRIBE_SHORTCUT_TRIBES.includes(tribe)) throw new Error(`${tribe} has no tribe circle shortcuts.`);
  return Array.from({ length: name === "2 tribe" ? 2 : 1 }, () => ({ content: tribe }));
}

export const blankCard = () => ({
  title: "",
  tribe: TRIBES[0],
  keywords: "",
  component: false,
  relic: false,
  cost: 3,
  circles: [],
  attachables: blankAttachables(),
  relicText: blankRelicText(),
});

export function setComponent(card, component) {
  return {
    ...card,
    component,
    relic: component ? false : card.relic,
    circles: card.circles,
  };
}

export function setRelic(card, relic) {
  return {
    ...card,
    relic,
    component: relic ? false : card.component,
    circles: card.circles,
  };
}

export const blankSheet = () => Array.from({ length: CARD_COUNT }, blankCard);
export const blankPage = (name = "Page 1") => ({ name, cards: blankSheet() });

export function createInitialPages() {
  const cards = SYMBOL_TRIBES.flatMap((tribe) =>
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
  ...(card.attachables === undefined ? {} : { attachables: { ...card.attachables } }),
  ...(card.relicText === undefined ? {} : { relicText: { ...card.relicText } }),
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
    const invalid = () => new Error(`Card ${index + 1} has invalid data. Use text fields, a supported tribe, Component/Relic toggles, a cost from 3-6, and up to ${MAX_CIRCLES} circles containing empty, a tribe, equal, or asterisk.`);
    if (!card || typeof card.title !== "string" || !TRIBES.includes(card.tribe) ||
        typeof card.keywords !== "string" || typeof card.component !== "boolean" ||
        (card.relic !== undefined && typeof card.relic !== "boolean") ||
        !Number.isInteger(card.cost) || card.cost < 3 || card.cost > 6 ||
        !Array.isArray(card.circles) || card.circles.length > MAX_CIRCLES) throw invalid();
    const circles = card.circles.map((circle, circleIndex) => {
      if (circle && ["value", "star", "icon"].some((field) => Object.hasOwn(circle, field))) {
        throw new Error(`Card ${index + 1}, circle ${circleIndex + 1}: data consistency error: legacy numbered circles and above/below decorations are not supported. Saved data has not been changed.`);
      }
      if (!circle || !CIRCLE_CONTENTS.includes(circle.content)) throw invalid();
      return { ...circle, content: circle.content };
    });
    if (card.attachables !== undefined &&
        (!card.attachables || typeof card.attachables !== "object" || Array.isArray(card.attachables) ||
        ATTACHABLE_SLOTS.some((slot) => typeof card.attachables[slot] !== "string"))) {
      throw new Error(`Card ${index + 1} has invalid Attachables. Left, right, and bottom must be text.`);
    }
    if (card.relicText !== undefined &&
        (!card.relicText || typeof card.relicText !== "object" || Array.isArray(card.relicText) ||
        RELIC_SECTIONS.some((section) => typeof card.relicText[section] !== "string"))) {
      throw new Error(`Card ${index + 1} has invalid Relic text. Top, middle, and bottom must be text.`);
    }
    return {
      ...card,
      title: card.title, tribe: card.tribe, keywords: card.keywords,
      component: card.component, cost: card.cost, circles,
    };
  });
}
