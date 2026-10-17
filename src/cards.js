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
export const serializeBackup = (cards) => JSON.stringify({ version: 1, cards }, null, 2);
export const copyCard = (card) => ({ ...card, costs: card.costs.map((cost) => ({ ...cost })) });

export function validateBackup(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.cards) || data.cards.length !== CARD_COUNT) {
    throw new Error("The backup must contain exactly 12 cards and use format version 1.");
  }
  return data.cards.map((card, index) => {
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
