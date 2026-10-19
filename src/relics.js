import { createGuardedStore } from "./cardStorage.js";
import { STORAGE_KEY as MAIN_CARDS_STORAGE_KEY, SYMBOL_TRIBES } from "./cards.js";

// Separate from the main card save and the Reference save: its own storage
// key and format version, following the same never-reseed, never-rewrite
// preservation rules. The only exception is a one-time convenience seed (see
// seedFromMainCards) that copies any existing Relic cards the first time this
// page is opened; after that, this save is fully independent.
export const RELICS_STORAGE_KEY = "relics-v1";
export const RELICS_FORMAT_VERSION = 2;
export const RELIC_SECTIONS = ["top", "middle", "bottom"];
export const RELIC_SECTION_LABELS = { top: "Top", middle: "Middle", bottom: "Bottom" };
// Fixed, not editable data: 3 boxes on top, 3 in the middle plus one more
// box showing "2", and 4 on the bottom.
export const RELIC_BOX_COUNTS = { top: 3, middle: 3, bottom: 4 };
export const MIDDLE_EXTRA_BOX_LABEL = "2";
export const DEFAULT_RELIC_BANNER = "On entering, choose one Magnum Opus to advance.";

export const blankRelicSection = () => ({ text: "" });
export const blankRelicEntry = () => ({
  name: "",
  top: blankRelicSection(),
  middle: blankRelicSection(),
  bottom: blankRelicSection(),
});

export const blankRelicsData = () => ({
  banner: DEFAULT_RELIC_BANNER,
  relics: Object.fromEntries(SYMBOL_TRIBES.map((tribe) => [tribe, blankRelicEntry()])),
});

// A one-time convenience: if this page has never been saved before, copy any
// existing Relic cards out of the main card save so nothing has to be
// retyped. The main save is only ever read here, never written. Each old
// Relic card's tribe is recovered from its title's trailing "(Tribe)" text,
// since the card's own tribe field was only ever a non-printed shortcut.
function seedFromMainCards(storage) {
  const data = blankRelicsData();
  let raw;
  try {
    raw = storage.getItem(MAIN_CARDS_STORAGE_KEY);
  } catch {
    return data;
  }
  if (!raw) return data;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return data;
  }
  for (const page of parsed?.pages ?? []) {
    for (const card of page?.cards ?? []) {
      if (!card?.relic) continue;
      const match = /\(([^()]+)\)\s*$/.exec(card.title ?? "");
      const tribe = match?.[1]?.trim();
      if (!tribe || !SYMBOL_TRIBES.includes(tribe) || data.relics[tribe].name !== "") continue;
      data.relics[tribe] = {
        name: card.title,
        top: { text: card.relicText?.top ?? "" },
        middle: { text: card.relicText?.middle ?? "" },
        bottom: { text: card.relicText?.bottom ?? "" },
      };
    }
  }
  return data;
}

export const serializeRelicsData = (data) => JSON.stringify({ version: RELICS_FORMAT_VERSION, ...data }, null, 2);

function validateRelicSection(section, label) {
  if (!section || typeof section.text !== "string") {
    throw new Error(`${label} must have text.`);
  }
}

function validateRelicsShape(raw) {
  if (typeof raw.banner !== "string") throw new Error("The banner must be text.");
  if (!raw.relics || typeof raw.relics !== "object" || Array.isArray(raw.relics)) {
    throw new Error("Relics must be present for Yonar, Tiltch, and Naxatu.");
  }
  for (const tribe of SYMBOL_TRIBES) {
    const relic = raw.relics[tribe];
    if (!relic || typeof relic.name !== "string") {
      throw new Error(`The ${tribe} relic must have a text name.`);
    }
    for (const section of RELIC_SECTIONS) {
      validateRelicSection(relic[section], `The ${tribe} relic's ${RELIC_SECTION_LABELS[section]} section`);
    }
  }
}

export function validateRelicsData(raw) {
  // Future versions need explicit, lossless migrations, same as the main cards.
  // Unsupported or damaged saves must remain untouched, never become seed data.
  const unsupported = () => new Error("The relics save must use format version 1 or 2. Older or unsupported formats are not allowed to overwrite it.");
  if (!raw || typeof raw !== "object") throw unsupported();
  if (raw.version === 1) {
    // v1 stored a per-section box count; box counts are now fixed at 3/3/4
    // and are no longer stored data, so the old "boxes" field is dropped.
    validateRelicsShape(raw);
    const relics = {};
    for (const tribe of SYMBOL_TRIBES) {
      const relic = raw.relics[tribe];
      relics[tribe] = {
        ...relic,
        name: relic.name,
        top: { ...relic.top }, middle: { ...relic.middle }, bottom: { ...relic.bottom },
      };
      for (const section of RELIC_SECTIONS) delete relics[tribe][section].boxes;
    }
    const { version, ...rest } = raw;
    return { ...rest, banner: raw.banner, relics };
  }
  if (raw.version !== RELICS_FORMAT_VERSION) throw unsupported();
  validateRelicsShape(raw);
  const relics = {};
  for (const tribe of SYMBOL_TRIBES) {
    const relic = raw.relics[tribe];
    relics[tribe] = {
      ...relic,
      name: relic.name,
      top: { ...relic.top }, middle: { ...relic.middle }, bottom: { ...relic.bottom },
    };
  }
  const { version, ...rest } = raw;
  return { ...rest, banner: raw.banner, relics };
}

export function createRelicsStore(storage) {
  const store = createGuardedStore({
    storage, key: RELICS_STORAGE_KEY, createInitial: seedFromMainCards,
    serialize: serializeRelicsData, validate: validateRelicsData, itemName: "relics",
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
