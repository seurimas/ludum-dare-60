import assert from "node:assert/strict";
import test from "node:test";
import { STORAGE_KEY as MAIN_STORAGE_KEY, SYMBOL_TRIBES, blankPage, blankSheet, setRelic, serializeBackup } from "./cards.js";
import {
  RELICS_STORAGE_KEY, RELIC_SECTIONS, RELIC_SECTION_LABELS, RELIC_BOX_COUNTS, MIDDLE_EXTRA_BOX_LABEL, DEFAULT_RELIC_BANNER,
  blankRelicsData, serializeRelicsData, validateRelicsData, createRelicsStore,
} from "./relics.js";

function memoryStorage(initialEntries = {}) {
  const values = new Map(Object.entries(initialEntries));
  const writes = [];
  return {
    writes,
    getItem: (key) => values.get(key) ?? null,
    setItem(key, data) {
      writes.push({ key, data });
      values.set(key, data);
    },
  };
}

test("relics data has the expected default shape and fixed box counts", () => {
  assert.deepEqual(RELIC_SECTIONS, ["top", "middle", "bottom"]);
  assert.deepEqual(RELIC_SECTION_LABELS, { top: "Top", middle: "Middle", bottom: "Bottom" });
  assert.deepEqual(RELIC_BOX_COUNTS, { top: 3, middle: 3, bottom: 4 });
  assert.equal(MIDDLE_EXTRA_BOX_LABEL, "2");
  const blank = blankRelicsData();
  assert.equal(blank.banner, DEFAULT_RELIC_BANNER);
  assert.deepEqual(Object.keys(blank.relics), SYMBOL_TRIBES);
  for (const tribe of SYMBOL_TRIBES) {
    assert.deepEqual(blank.relics[tribe], { name: "", top: { text: "" }, middle: { text: "" }, bottom: { text: "" } });
  }
});

test("a missing relics save with no main cards seeds blank relics, and never seeds again", () => {
  const storage = memoryStorage();
  const store = createRelicsStore(storage);
  const { data, restored } = store.load();
  assert.equal(restored, false);
  assert.deepEqual(data, blankRelicsData());
  assert.equal(storage.writes.length, 1);
  const original = storage.getItem(RELICS_STORAGE_KEY);
  assert.deepEqual(store.load(), { data, restored: true });
  assert.equal(storage.writes.length, 1);
  assert.equal(storage.getItem(RELICS_STORAGE_KEY), original);
});

test("a missing relics save copies existing Relic cards from the main save once, recovering tribe from the title", () => {
  const pages = [blankPage("Relics")];
  pages[0].cards[0] = setRelic({ ...blankSheet()[0], title: "Endless Unity (Yonar)" }, true);
  pages[0].cards[0].relicText = { top: "Top text", middle: "Middle text", bottom: "Bottom text" };
  pages[0].cards[1] = setRelic({ ...blankSheet()[0], title: "Fusion Sucker (Tiltch)" }, true);
  pages[0].cards[1].relicText = { top: "T2", middle: "M2", bottom: "B2" };
  pages[0].cards[2] = setRelic({ ...blankSheet()[0], title: "Reality Collider (Naxatu)" }, true);
  pages[0].cards[2].relicText = { top: "T3", middle: "M3", bottom: "B3" };
  const storage = memoryStorage({ [MAIN_STORAGE_KEY]: serializeBackup(pages) });
  const store = createRelicsStore(storage);
  const { data, restored } = store.load();
  assert.equal(restored, false);
  assert.equal(data.relics.Yonar.name, "Endless Unity (Yonar)");
  assert.equal(data.relics.Yonar.top.text, "Top text");
  assert.equal(data.relics.Tiltch.name, "Fusion Sucker (Tiltch)");
  assert.equal(data.relics.Tiltch.middle.text, "M2");
  assert.equal(data.relics.Naxatu.name, "Reality Collider (Naxatu)");
  assert.equal(data.relics.Naxatu.bottom.text, "B3");
  // The main save must never be written to during this one-time copy.
  assert.equal(storage.getItem(MAIN_STORAGE_KEY), serializeBackup(pages));
  const mainWrites = storage.writes.filter((w) => w.key === MAIN_STORAGE_KEY);
  assert.equal(mainWrites.length, 0);
});

test("Relic cards without a recognizable tribe in the title, or a non-Relic card, are ignored during the one-time copy", () => {
  const pages = [blankPage("Relics")];
  pages[0].cards[0] = setRelic({ ...blankSheet()[0], title: "No tribe here" }, true);
  pages[0].cards[1] = { ...blankSheet()[0], title: "Not a relic (Yonar)", relic: false };
  const storage = memoryStorage({ [MAIN_STORAGE_KEY]: serializeBackup(pages) });
  const store = createRelicsStore(storage);
  const { data } = store.load();
  assert.deepEqual(data.relics, blankRelicsData().relics);
});

test("existing edited relics saves load byte-for-byte unchanged without reseeding or rewriting", () => {
  const data = blankRelicsData();
  data.banner = "Custom banner";
  data.relics.Yonar = { name: "Endless Unity", top: { text: "A" }, middle: { text: "B" }, bottom: { text: "C" } };
  const raw = serializeRelicsData(data);
  const storage = memoryStorage({ [RELICS_STORAGE_KEY]: raw });
  const store = createRelicsStore(storage);
  assert.deepEqual(store.load(), { data, restored: true });
  assert.equal(storage.getItem(RELICS_STORAGE_KEY), raw);
  assert.equal(storage.writes.length, 0);
  const edited = { ...data, banner: "Edited banner" };
  store.save(edited);
  assert.deepEqual(JSON.parse(storage.getItem(RELICS_STORAGE_KEY)), { version: 2, ...edited });
});

test("v1 saves migrate losslessly by dropping the old per-section box counts, without rewriting until an explicit save", () => {
  const v1Raw = JSON.stringify({
    version: 1,
    banner: "Custom banner",
    relics: {
      Yonar: { name: "Endless Unity", top: { text: "A", boxes: 2 }, middle: { text: "B", boxes: 5 }, bottom: { text: "C", boxes: 1 } },
      Tiltch: { name: "", top: { text: "", boxes: 3 }, middle: { text: "", boxes: 3 }, bottom: { text: "", boxes: 4 } },
      Naxatu: { name: "", top: { text: "", boxes: 3 }, middle: { text: "", boxes: 3 }, bottom: { text: "", boxes: 4 } },
    },
  });
  const storage = memoryStorage({ [RELICS_STORAGE_KEY]: v1Raw });
  const store = createRelicsStore(storage);
  const { data, restored } = store.load();
  assert.equal(restored, true);
  assert.deepEqual(data.relics.Yonar, { name: "Endless Unity", top: { text: "A" }, middle: { text: "B" }, bottom: { text: "C" } });
  assert.ok(!("boxes" in data.relics.Yonar.top));
  // Loading must not rewrite the save, even though it returns the migrated shape.
  assert.equal(storage.getItem(RELICS_STORAGE_KEY), v1Raw);
  assert.equal(storage.writes.length, 0);
  store.save(data);
  assert.deepEqual(JSON.parse(storage.getItem(RELICS_STORAGE_KEY)), { version: 2, ...data });
});

test("empty, damaged, unsupported and invalid relics saves block editing without changing any bytes", () => {
  const valid = blankRelicsData();
  for (const raw of ["", "{broken", "null", "{}",
    ...[0, 3, 999].map((version) => JSON.stringify({ version, ...valid })),
    JSON.stringify({ version: 1, banner: 5, relics: valid.relics }),
    JSON.stringify({ version: 1, banner: "", relics: {} }),
    JSON.stringify({ version: 1, banner: "", relics: { ...valid.relics, Yonar: { ...valid.relics.Yonar, name: 5 } } }),
    JSON.stringify({ version: 2, banner: 5, relics: valid.relics }),
    JSON.stringify({ version: 2, banner: "", relics: {} }),
    JSON.stringify({ version: 2, banner: "", relics: { ...valid.relics, Yonar: { ...valid.relics.Yonar, name: 5 } } }),
    JSON.stringify({ version: 2, banner: "", relics: { ...valid.relics, Yonar: { ...valid.relics.Yonar, top: { text: 5 } } } }),
  ]) {
    const storage = memoryStorage({ [RELICS_STORAGE_KEY]: raw });
    const store = createRelicsStore(storage);
    assert.throws(() => store.load());
    assert.throws(() => store.save(blankRelicsData()), /Saving is blocked/);
    assert.equal(storage.writes.length, 0);
    assert.equal(storage.getItem(RELICS_STORAGE_KEY), raw);
  }
});

test("unknown saved relics fields survive loading, edits and re-saves", () => {
  const data = blankRelicsData();
  data.notes = "Keep top-level metadata";
  data.relics.Yonar.annotation = "Keep relic metadata";
  const storage = memoryStorage({ [RELICS_STORAGE_KEY]: serializeRelicsData(data) });
  const store = createRelicsStore(storage);
  const loaded = store.load().data;
  loaded.banner = "Unrelated edit";
  store.save(loaded);
  const restored = validateRelicsData(JSON.parse(storage.getItem(RELICS_STORAGE_KEY)));
  assert.equal(restored.notes, data.notes);
  assert.equal(restored.relics.Yonar.annotation, data.relics.Yonar.annotation);
  assert.equal(restored.banner, "Unrelated edit");
});

test("concurrent changes and invalid edits cannot overwrite the existing relics save", () => {
  const storage = memoryStorage({ [RELICS_STORAGE_KEY]: serializeRelicsData(blankRelicsData()) });
  const store = createRelicsStore(storage);
  const { data } = store.load();
  assert.throws(() => store.save({ ...data, banner: 5 }), /must be text/);
  assert.equal(storage.writes.length, 0);
  storage.setItem(RELICS_STORAGE_KEY, "Changed by another tab");
  assert.throws(() => store.save(data), /another tab/);
  assert.equal(storage.getItem(RELICS_STORAGE_KEY), "Changed by another tab");
});

test("storage access failures surface explicitly and do not permit later writes", () => {
  const storage = { getItem: () => { throw new Error("Storage unavailable"); }, setItem: () => {} };
  const store = createRelicsStore(storage);
  assert.throws(() => store.load(), /Storage unavailable/);
  assert.throws(() => store.save(blankRelicsData()), /Saving is blocked/);
});
