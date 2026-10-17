export const STORAGE_KEY = "card-sheet-maker-v1";
export const CARD_COUNT = 12;
export const COLORS = ["red", "blue", "green", "white", "black"];
export const CIRCLE_COUNTS = [0, 2, 3, 4, 5];

export const blankCard = () => ({
  title: "",
  tribe: "",
  keywords: "",
  circles: 0,
  costs: [{ color: "white", number: 1 }],
});

export const blankSheet = () => Array.from({ length: CARD_COUNT }, blankCard);
export const blankPage = (name = "Page 1") => ({ name, cards: blankSheet() });
export const serializeBackup = (pages) => JSON.stringify({ version: 2, pages }, null, 2);
export const copyCard = (card) => ({ ...card, costs: card.costs.map((cost) => ({ ...cost })) });
export const copyPage = (page) => ({ name: `${page.name} (copy)`, cards: page.cards.map(copyCard) });

export function validateBackup(data) {
  if (data?.version === 1) {
    return [{ name: "Page 1", cards: validateCards(data.cards) }];
  }
  if (!data || data.version !== 2 || !Array.isArray(data.pages) || data.pages.length === 0) {
    throw new Error("The backup must use format version 1 or 2 and contain at least one page.");
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
    throw new Error("Each page must contain exactly 12 cards.");
  }
  return cards.map((card, index) => {
    const invalid = () => new Error(`Card ${index + 1} has invalid data. Use text fields, 0 or 2-5 circles, and 1-5 costs with a supported color and a whole number from 1 to 999.`);
    if (!card || typeof card.title !== "string" || typeof card.tribe !== "string" ||
        typeof card.keywords !== "string" || !CIRCLE_COUNTS.includes(card.circles) ||
        !Array.isArray(card.costs) || card.costs.length < 1 || card.costs.length > 5) {
      throw invalid();
    }
    const costs = card.costs.map((cost) => {
      if (!cost || !COLORS.includes(cost.color) || !Number.isInteger(cost.number) || cost.number < 1 || cost.number > 999) {
        throw invalid();
      }
      return { color: cost.color, number: cost.number };
    });
    return { title: card.title, tribe: card.tribe, keywords: card.keywords, circles: card.circles, costs };
  });
}
