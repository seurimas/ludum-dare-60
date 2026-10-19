import assert from "node:assert/strict";
import test from "node:test";
import {
  REFERENCE_STORAGE_KEY, REFERENCE_SECTIONS, REFERENCE_SECTION_LABELS, PLAYER_REFERENCE_COUNT,
  REFERENCE_FRONT_LAYOUT, REFERENCE_BACK_LAYOUT,
  blankReferenceData, createInitialReferenceData, serializeReferenceData, validateReferenceData, createReferenceStore,
} from "./reference.js";

function memoryStorage(value = null) {
  const values = new Map(value === null ? [] : [[REFERENCE_STORAGE_KEY, value]]);
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

test("reference data has the expected shape, labels and front/back layout", () => {
  assert.equal(PLAYER_REFERENCE_COUNT, 4);
  assert.deepEqual(REFERENCE_SECTIONS, ["phases", "cog", "completion"]);
  assert.deepEqual(REFERENCE_SECTION_LABELS, { phases: "Phases", cog: "C.o.G. reference", completion: "Completion rules" });
  assert.deepEqual(blankReferenceData(), {
    setupText: "", variantText: "", generalText: "", generalContText: "", playerTurnText: "", playerReferenceBackText: "",
  });
  assert.deepEqual(createInitialReferenceData(), blankReferenceData());
  assert.deepEqual(REFERENCE_FRONT_LAYOUT, ["setup", "general", "player", "player", "player", "player"]);
  // Back columns are reversed per row of 3, so each back card aligns with its
  // front card after long-edge duplex printing.
  assert.deepEqual(REFERENCE_BACK_LAYOUT, ["player", "general", "setup", "player", "player", "player"]);
});

test("existing edited reference saves load byte-for-byte unchanged without reseeding or rewriting", () => {
  const data = {
    setupText: "Full setup text", variantText: "Full variant text",
    generalText: "Full general reference text", generalContText: "Full general reference cont. text",
    playerTurnText: "# Phases\nDraw, play, end", playerReferenceBackText: "Full player reference back text",
  };
  const raw = serializeReferenceData(data);
  const storage = memoryStorage(raw);
  const store = createReferenceStore(storage);
  assert.deepEqual(store.load(), { data, restored: true });
  assert.equal(storage.getItem(REFERENCE_STORAGE_KEY), raw);
  assert.equal(storage.writes.length, 0);
  const edited = { ...data, setupText: "Edited setup text" };
  store.save(edited);
  assert.deepEqual(JSON.parse(storage.getItem(REFERENCE_STORAGE_KEY)), { version: 4, ...edited });
});

test("only a missing save seeds reference data, and subsequent loads never seed again", () => {
  const storage = memoryStorage();
  const store = createReferenceStore(storage);
  assert.equal(store.load().restored, false);
  assert.equal(storage.writes.length, 1);
  const original = storage.getItem(REFERENCE_STORAGE_KEY);
  assert.equal(store.load().restored, true);
  assert.equal(storage.writes.length, 1);
  assert.equal(storage.getItem(REFERENCE_STORAGE_KEY), original);
});

test("empty, damaged, unsupported and future reference saves block editing without changing any bytes", () => {
  for (const raw of ["", "{broken", "null", "{}",
    ...[0, 5, 999].map((version) => JSON.stringify({ version, ...blankReferenceData() })),
    JSON.stringify({ version: 1, rulesText: 5, playerReference: { phases: "", cog: "", completion: "" } }),
    JSON.stringify({ version: 1, rulesText: "", playerReference: { phases: "", cog: "" } }),
    JSON.stringify({ version: 2, setupText: 5, generalText: "", playerReference: { phases: "", cog: "", completion: "" } }),
    JSON.stringify({ version: 2, setupText: "", generalText: "", playerReference: { phases: "", cog: "" } }),
    JSON.stringify({ version: 3, setupText: 5, generalText: "", playerReferenceText: "" }),
    JSON.stringify({ version: 3, setupText: "", generalText: 5, playerReferenceText: "" }),
    JSON.stringify({ version: 3, setupText: "", generalText: "", playerReferenceText: 5 }),
    JSON.stringify({ version: 4, ...blankReferenceData(), setupText: 5 }),
    JSON.stringify({ version: 4, ...blankReferenceData(), playerReferenceBackText: 5 }),
  ]) {
    const storage = memoryStorage(raw);
    const store = createReferenceStore(storage);
    assert.throws(() => store.load());
    assert.throws(() => store.save(createInitialReferenceData()), /Saving is blocked/);
    assert.equal(storage.writes.length, 0);
    assert.equal(storage.getItem(REFERENCE_STORAGE_KEY), raw);
  }
});

test("v1 saves migrate losslessly into the v4 front/back shape without rewriting until an explicit save", () => {
  const v1Raw = JSON.stringify({
    version: 1,
    rulesText: "Original single rules card text",
    playerReference: { phases: "Draw, play, end", cog: "Notes", completion: "Win condition" },
  });
  const storage = memoryStorage(v1Raw);
  const store = createReferenceStore(storage);
  const { data, restored } = store.load();
  assert.equal(restored, true);
  assert.deepEqual(data, {
    setupText: "Original single rules card text", variantText: "",
    generalText: "", generalContText: "",
    playerTurnText: "# Phases\nDraw, play, end\n\n# C.o.G. reference\nNotes\n\n# Completion rules\nWin condition",
    playerReferenceBackText: "",
  });
  // Loading must not rewrite the save, even though it returns the migrated shape.
  assert.equal(storage.getItem(REFERENCE_STORAGE_KEY), v1Raw);
  assert.equal(storage.writes.length, 0);
  store.save({ ...data, variantText: "Added variant text" });
  assert.deepEqual(JSON.parse(storage.getItem(REFERENCE_STORAGE_KEY)), { version: 4, ...data, variantText: "Added variant text" });
});

test("v2 saves migrate losslessly into the v4 front/back shape without rewriting until an explicit save", () => {
  const v2Raw = JSON.stringify({
    version: 2,
    setupText: "Setup text",
    generalText: "General text",
    playerReference: { phases: "Draw, play, end", cog: "Notes", completion: "Win condition" },
  });
  const storage = memoryStorage(v2Raw);
  const store = createReferenceStore(storage);
  const { data, restored } = store.load();
  assert.equal(restored, true);
  assert.deepEqual(data, {
    setupText: "Setup text", variantText: "",
    generalText: "General text", generalContText: "",
    playerTurnText: "# Phases\nDraw, play, end\n\n# C.o.G. reference\nNotes\n\n# Completion rules\nWin condition",
    playerReferenceBackText: "",
  });
  assert.equal(storage.getItem(REFERENCE_STORAGE_KEY), v2Raw);
  assert.equal(storage.writes.length, 0);
  store.save(data);
  assert.deepEqual(JSON.parse(storage.getItem(REFERENCE_STORAGE_KEY)), { version: 4, ...data });
});

test("v3 saves migrate losslessly into the v4 front/back shape, renaming Player Reference to Player Turn, without rewriting until an explicit save", () => {
  const v3Raw = JSON.stringify({
    version: 3,
    setupText: "Setup text",
    generalText: "General text",
    playerReferenceText: "# Phases\nDraw, play, end",
  });
  const storage = memoryStorage(v3Raw);
  const store = createReferenceStore(storage);
  const { data, restored } = store.load();
  assert.equal(restored, true);
  assert.deepEqual(data, {
    setupText: "Setup text", variantText: "",
    generalText: "General text", generalContText: "",
    playerTurnText: "# Phases\nDraw, play, end",
    playerReferenceBackText: "",
  });
  assert.equal(storage.getItem(REFERENCE_STORAGE_KEY), v3Raw);
  assert.equal(storage.writes.length, 0);
  store.save({ ...data, playerReferenceBackText: "Added back text" });
  assert.deepEqual(JSON.parse(storage.getItem(REFERENCE_STORAGE_KEY)), { version: 4, ...data, playerReferenceBackText: "Added back text" });
});

test("unknown saved reference fields survive loading, edits and re-saves", () => {
  const data = blankReferenceData();
  data.notes = "Keep top-level metadata";
  const storage = memoryStorage(serializeReferenceData(data));
  const store = createReferenceStore(storage);
  const loaded = store.load().data;
  loaded.setupText = "Unrelated edit";
  store.save(loaded);
  const restored = validateReferenceData(JSON.parse(storage.getItem(REFERENCE_STORAGE_KEY)));
  assert.equal(restored.notes, data.notes);
  assert.equal(restored.setupText, "Unrelated edit");
});

test("concurrent changes and invalid edits cannot overwrite the existing reference save", () => {
  const storage = memoryStorage(serializeReferenceData(blankReferenceData()));
  const store = createReferenceStore(storage);
  const { data } = store.load();
  assert.throws(() => store.save({ ...data, setupText: 5 }), /must be text/);
  assert.equal(storage.writes.length, 0);
  storage.setItem(REFERENCE_STORAGE_KEY, "Changed by another tab");
  assert.throws(() => store.save(data), /another tab/);
  assert.equal(storage.getItem(REFERENCE_STORAGE_KEY), "Changed by another tab");
});

test("storage access failures surface explicitly and do not permit later writes", () => {
  const storage = { getItem: () => { throw new Error("Storage unavailable"); }, setItem: () => {} };
  const store = createReferenceStore(storage);
  assert.throws(() => store.load(), /Storage unavailable/);
  assert.throws(() => store.save(blankReferenceData()), /Saving is blocked/);
});
