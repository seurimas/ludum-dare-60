import { createGuardedStore } from "./cardStorage.js";

// Separate from the main card save (like the Energy page): its own storage
// key and format version, following the same never-reseed, never-rewrite
// preservation rules.
export const REFERENCE_STORAGE_KEY = "reference-cards-v1";
export const REFERENCE_FORMAT_VERSION = 4;
export const PLAYER_REFERENCE_COUNT = 4;
// Used only to migrate pre-v3 saves, which had these three fixed fields.
export const REFERENCE_SECTIONS = ["phases", "cog", "completion"];
export const REFERENCE_SECTION_LABELS = {
  phases: "Phases",
  cog: "C.o.G. reference",
  completion: "Completion rules",
};
// Front/back card layout: 3 columns x 2 rows. The back sheet's columns are
// reversed per row so cards align after long-edge duplex printing.
export const REFERENCE_FRONT_LAYOUT = ["setup", "general", "player", "player", "player", "player"];
export const REFERENCE_BACK_LAYOUT = [2, 1, 0, 5, 4, 3].map((frontIndex) => REFERENCE_FRONT_LAYOUT[frontIndex]);

export const blankReferenceData = () => ({
  setupText: "",
  variantText: "",
  generalText: "",
  generalContText: "",
  playerTurnText: "",
  playerReferenceBackText: "",
});

export const createInitialReferenceData = blankReferenceData;

export const serializeReferenceData = (data) => JSON.stringify({ version: REFERENCE_FORMAT_VERSION, ...data }, null, 2);

function validatePlayerReferenceFields(raw) {
  if (!raw.playerReference || typeof raw.playerReference !== "object" || Array.isArray(raw.playerReference) ||
      REFERENCE_SECTIONS.some((section) => typeof raw.playerReference[section] !== "string")) {
    throw new Error("Player reference sections must be text for Phases, C.o.G. reference, and Completion rules.");
  }
}

// v1/v2 had three fixed Player Reference fields. Losslessly fold them into a
// single free-text block with # headers, the same format the card now reads.
function playerReferenceFieldsToText(playerReference) {
  return REFERENCE_SECTIONS.map((section) => `# ${REFERENCE_SECTION_LABELS[section]}\n${playerReference[section]}`).join("\n\n");
}

const REFERENCE_V4_FIELDS = ["setupText", "variantText", "generalText", "generalContText", "playerTurnText", "playerReferenceBackText"];

export function validateReferenceData(raw) {
  // Future versions need explicit, lossless migrations, same as the main cards.
  // Unsupported or damaged saves must remain untouched, never become seed data.
  const unsupported = () => new Error("The reference save must use format version 1, 2, 3, or 4. Older or unsupported formats are not allowed to overwrite it.");
  if (!raw || typeof raw !== "object") throw unsupported();
  if (raw.version === 1) {
    // v1 had a single free-text "rules" card and fixed Player Reference fields.
    // The new back-side fields (Variant, General Reference Cont., Player
    // Reference) did not exist yet, so they start blank.
    if (typeof raw.rulesText !== "string") throw new Error("Rules text must be text.");
    validatePlayerReferenceFields(raw);
    const { version, rulesText, playerReference, ...rest } = raw;
    return {
      ...rest, setupText: rulesText, variantText: "", generalText: "", generalContText: "",
      playerTurnText: playerReferenceFieldsToText(raw.playerReference), playerReferenceBackText: "",
    };
  }
  if (raw.version === 2) {
    // v2 split Setup/General Reference but still had fixed Player Reference fields.
    if (typeof raw.setupText !== "string" || typeof raw.generalText !== "string") {
      throw new Error("Setup and General Reference text must be text.");
    }
    validatePlayerReferenceFields(raw);
    const { version, playerReference, ...rest } = raw;
    return {
      ...rest, setupText: raw.setupText, variantText: "", generalText: raw.generalText, generalContText: "",
      playerTurnText: playerReferenceFieldsToText(raw.playerReference), playerReferenceBackText: "",
    };
  }
  if (raw.version === 3) {
    // v3 had a single Player Reference text field, now the front-side "Player Turn".
    if (typeof raw.setupText !== "string" || typeof raw.generalText !== "string" || typeof raw.playerReferenceText !== "string") {
      throw new Error("Setup, General Reference, and Player Reference text must be text.");
    }
    const { version, playerReferenceText, ...rest } = raw;
    return {
      ...rest, setupText: raw.setupText, variantText: "", generalText: raw.generalText, generalContText: "",
      playerTurnText: raw.playerReferenceText, playerReferenceBackText: "",
    };
  }
  if (raw.version !== REFERENCE_FORMAT_VERSION) throw unsupported();
  if (REFERENCE_V4_FIELDS.some((field) => typeof raw[field] !== "string")) {
    throw new Error("Setup, Variant, General Reference, General Reference Cont., Player Turn, and Player Reference text must be text.");
  }
  const { version, ...rest } = raw;
  return { ...rest, ...Object.fromEntries(REFERENCE_V4_FIELDS.map((field) => [field, raw[field]])) };
}

export function createReferenceStore(storage) {
  const store = createGuardedStore({
    storage, key: REFERENCE_STORAGE_KEY, createInitial: createInitialReferenceData,
    serialize: serializeReferenceData, validate: validateReferenceData, itemName: "reference cards",
  });
  return {
    load() {
      const { data, restored } = store.load();
      return { data, restored };
    },
    save(data) {
      store.save(data);
    },
  };
}
