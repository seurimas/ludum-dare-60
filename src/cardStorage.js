import { STORAGE_KEY, createInitialPages, serializeBackup, validateBackup } from "./cards.js";

export function createCardStore(storage) {
  let lastSaved;
  let loaded = false;

  return {
    load() {
      const saved = storage.getItem(STORAGE_KEY);
      // Only a genuinely absent save allows initialization. Empty, malformed,
      // or unsupported data is still user data and must not be overwritten.
      const pages = saved === null ? createInitialPages() : validateBackup(JSON.parse(saved));
      if (saved === null) {
        const initial = serializeBackup(pages);
        storage.setItem(STORAGE_KEY, initial);
        lastSaved = initial;
      } else {
        lastSaved = saved;
      }
      loaded = true;
      return { pages, restored: saved !== null };
    },
    save(pages) {
      if (!loaded) throw new Error("Saving is blocked because existing cards could not be loaded.");
      validateBackup(JSON.parse(serializeBackup(pages)));
      if (storage.getItem(STORAGE_KEY) !== lastSaved) {
        throw new Error("Saved cards changed in another tab or outside this editor. Download your edits, then reload before saving again.");
      }
      const next = serializeBackup(pages);
      storage.setItem(STORAGE_KEY, next);
      lastSaved = next;
    },
  };
}
