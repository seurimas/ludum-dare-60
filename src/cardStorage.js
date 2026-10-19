import { STORAGE_KEY, createInitialPages, serializeBackup, validateBackup } from "./cards.js";

// Generic guarded localStorage wrapper: seeds only when the key is genuinely
// absent, never rewrites or reseeds existing data, and blocks cross-tab
// overwrites. Used for both the main card pages and other independent saves
// (such as the Reference page) that must follow the same preservation rules.
export function createGuardedStore({ storage, key, createInitial, serialize, validate, itemName = "data" }) {
  let lastSaved;
  let loaded = false;

  return {
    load() {
      const saved = storage.getItem(key);
      // Only a genuinely absent save allows initialization. Empty, malformed,
      // or unsupported data is still user data and must not be overwritten.
      const data = saved === null ? createInitial(storage) : validate(JSON.parse(saved));
      if (saved === null) {
        const initial = serialize(data);
        storage.setItem(key, initial);
        lastSaved = initial;
      } else {
        lastSaved = saved;
      }
      loaded = true;
      return { data, restored: saved !== null };
    },
    save(data) {
      if (!loaded) throw new Error(`Saving is blocked because existing ${itemName} could not be loaded.`);
      validate(JSON.parse(serialize(data)));
      if (storage.getItem(key) !== lastSaved) {
        throw new Error(`Saved ${itemName} changed in another tab or outside this editor. Download your edits, then reload before saving again.`);
      }
      const next = serialize(data);
      storage.setItem(key, next);
      lastSaved = next;
    },
  };
}

export function createCardStore(storage) {
  const store = createGuardedStore({
    storage, key: STORAGE_KEY, createInitial: createInitialPages,
    serialize: serializeBackup, validate: validateBackup, itemName: "cards",
  });
  return {
    load() {
      const { data, restored } = store.load();
      return { pages: data, restored };
    },
    save(pages) {
      store.save(pages);
    },
  };
}
