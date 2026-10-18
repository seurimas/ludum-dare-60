import assert from "node:assert/strict";
import test from "node:test";
import { createCardStore } from "./cardStorage.js";
import {
  TRIBES, SYMBOL_TRIBES, STORAGE_KEY, blankSheet, blankPage, blankCircle, copyCard, copyPage,
  CIRCLE_CONTENTS, applyCircleShortcut, createInitialPages, serializeBackup, validateBackup, setComponent, setRelic,
  hasSideAttachables, hasCircleSideConflict, NO_COST_SELECTOR_TRIBES, NO_TRIBE_SHORTCUT_TRIBES,
  RELIC_SECTIONS, RELIC_BOX_COUNTS,
} from "./cards.js";

test("side markers and circles are mutually exclusive without making existing saves invalid", () => {
  const card = { ...blankSheet()[0], circles: [] };
  assert.equal(hasSideAttachables(card), false);
  assert.equal(hasSideAttachables({ ...card, attachables: { left: "", right: " ", bottom: "Base" } }), false);
  const sided = { ...card, attachables: { left: "Armor", right: "", bottom: "" } };
  assert.equal(hasSideAttachables(sided), true);
  assert.equal(hasCircleSideConflict(sided), false);
  const both = { ...sided, circles: [blankCircle()] };
  assert.equal(hasCircleSideConflict(both), true);
  assert.equal(hasCircleSideConflict({ ...both, component: true }), false);
  const pages = [{ ...blankPage(), cards: [both, ...blankSheet().slice(1)] }];
  const restored = validateBackup(JSON.parse(serializeBackup(pages)));
  assert.deepEqual((restored.pages ?? restored)[0].cards[0], both);
});

function memoryStorage(value = null) {
  const values = new Map(value === null ? [] : [[STORAGE_KEY, value]]);
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

test("existing edited saves load byte-for-byte unchanged without reseeding or rewriting", () => {
  const pages = [blankPage("My existing cards"), blankPage("Extra page")];
  pages[0].cards[0].title = "Keep this card";
  pages[0].cards[0].keywords = "Keep every line\nof my rules";
  pages[1].cards[5] = setComponent(pages[1].cards[5], true);
  const raw = JSON.stringify({ version: 6, pages });
  const storage = memoryStorage(raw);
  const store = createCardStore(storage);
  assert.deepEqual(store.load(), { pages, restored: true });
  assert.equal(storage.getItem(STORAGE_KEY), raw);
  assert.equal(storage.writes.length, 0);
  pages[0].cards[1].title = "Edited normally";
  store.save(pages);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)).pages, pages);
});

test("only a missing save seeds cards, and subsequent loads never seed again", () => {
  const storage = memoryStorage();
  const store = createCardStore(storage);
  assert.equal(store.load().restored, false);
  assert.equal(storage.writes.length, 1);
  const original = storage.getItem(STORAGE_KEY);
  assert.equal(store.load().restored, true);
  assert.equal(storage.writes.length, 1);
  assert.equal(storage.getItem(STORAGE_KEY), original);
});

test("empty, damaged, unsupported and future saves block editing without changing any bytes", () => {
  for (const raw of ["", "{broken", "null", "{}", ...[5, 7, 999].map((version) =>
    JSON.stringify({ version, pages: [blankPage("Precious cards")] })),
    JSON.stringify({ version: 6, pages: [] }),
    JSON.stringify({ version: 6, pages: [{ name: "Keep all seven", cards: Array.from({ length: 7 }, () => blankSheet()[0]) }] }),
  ]) {
    const storage = memoryStorage(raw);
    const store = createCardStore(storage);
    assert.throws(() => store.load());
    assert.throws(() => store.save(createInitialPages()), /Saving is blocked/);
    assert.equal(storage.writes.length, 0);
    assert.equal(storage.getItem(STORAGE_KEY), raw);
  }
});

test("unknown saved page, card and circle fields survive loading, edits and backups", () => {
  const pages = [blankPage("Extended data")];
  pages[0].notes = { text: "Keep page metadata" };
  pages[0].cards[0].futureField = { text: "Keep card metadata" };
  pages[0].cards[0].circles = [{ ...blankCircle(), annotation: "Keep circle metadata" }];
  const storage = memoryStorage(serializeBackup(pages));
  const store = createCardStore(storage);
  const loaded = store.load().pages;
  loaded[0].cards[1].title = "Unrelated edit";
  store.save(loaded);
  const restored = validateBackup(JSON.parse(storage.getItem(STORAGE_KEY)));
  assert.deepEqual(restored[0].notes, pages[0].notes);
  assert.deepEqual(restored[0].cards[0], pages[0].cards[0]);
});

test("concurrent changes and invalid edits cannot overwrite the existing save", () => {
  const storage = memoryStorage(serializeBackup([blankPage()]));
  const store = createCardStore(storage);
  const { pages } = store.load();
  pages[0].cards[0].cost = 0;
  assert.throws(() => store.save(pages), /invalid data/);
  assert.equal(storage.writes.length, 0);
  pages[0].cards[0].cost = 3;
  storage.setItem(STORAGE_KEY, "Changed by another tab");
  assert.throws(() => store.save(pages), /another tab/);
  assert.equal(storage.getItem(STORAGE_KEY), "Changed by another tab");
  assert.equal(storage.writes.length, 1);
});

test("storage access failures surface explicitly and do not permit later writes", () => {
  let writes = 0;
  const store = createCardStore({
    getItem() { throw new Error("Access denied"); },
    setItem() { writes++; },
  });
  assert.throws(() => store.load(), /Access denied/);
  assert.throws(() => store.save(createInitialPages()), /Saving is blocked/);
  assert.equal(writes, 0);
  const storage = memoryStorage(serializeBackup([blankPage()]));
  const writableStore = createCardStore(storage);
  const { pages } = writableStore.load();
  const original = storage.getItem(STORAGE_KEY);
  storage.setItem = () => { throw new Error("Quota exceeded"); };
  assert.throws(() => writableStore.save(pages), /Quota exceeded/);
  assert.equal(storage.getItem(STORAGE_KEY), original);
});

test("four full sheets contain 24 named cards with the exact cost spread per tribe", () => {
  const pages = createInitialPages();
  assert.equal(pages.length, 4);
  assert.ok(pages.every((page) => page.cards.length === 6));
  const cards = pages.flatMap((page) => page.cards);
  assert.equal(cards.length, 24);
  assert.deepEqual(TRIBES, ["Yonar", "Tiltch", "Naxatu", "Starter", "Omni"]);
  for (const tribe of SYMBOL_TRIBES) {
    const group = cards.filter((card) => card.tribe === tribe);
    assert.deepEqual(group.map((card) => card.cost), [3, 3, 3, 4, 4, 5, 5, 6]);
    assert.deepEqual(group.map((card) => card.title), Array.from({ length: 8 }, (_, i) => `${tribe} ${i + 1}`));
  }
  assert.ok(cards.every((card) => !card.component && card.keywords === "" && card.circles.length === 0));
  assert.deepEqual(validateBackup(JSON.parse(serializeBackup(pages))), pages);
});

test("blank and initialized cards and later generations are independent", () => {
  const pages = createInitialPages();
  pages[0].cards[0].circles.push(blankCircle());
  pages[0].cards[0].title = "Changed";
  assert.deepEqual(pages[0].cards[1].circles, []);
  assert.equal(createInitialPages()[0].cards[0].title, "Yonar 1");
  const cards = blankSheet();
  assert.equal(cards.length, 6);
  cards[0].circles.push(blankCircle());
  assert.deepEqual(cards[1].circles, []);
});

test("component toggle preserves any circle count and hidden fields", () => {
  const original = { ...blankSheet()[0], title: "Test", keywords: "Kept", tribe: "Naxatu", cost: 6, circles: [blankCircle()] };
  const component = setComponent(original, true);
  assert.equal(component.circles.length, 1);
  assert.equal(original.circles.length, 1);
  assert.equal(component.keywords, "Kept");
  const restored = setComponent(component, false);
  assert.equal(restored.component, false);
  assert.equal(restored.tribe, "Naxatu");
  assert.equal(restored.cost, 6);
  assert.equal(restored.keywords, "Kept");
  assert.deepEqual(restored.circles, component.circles);
});

test("Relic and Component are mutually exclusive, and Relic sections round trip and stay optional", () => {
  const original = { ...blankSheet()[0], title: "Test", tribe: "Naxatu", cost: 6, circles: [blankCircle()] };
  const relic = setRelic(original, true);
  assert.equal(relic.relic, true);
  assert.equal(relic.component, false);
  assert.equal(relic.circles.length, 1);
  const madeComponent = setComponent(relic, true);
  assert.equal(madeComponent.component, true);
  assert.equal(madeComponent.relic, false);
  const madeRelicAgain = setRelic(madeComponent, true);
  assert.equal(madeRelicAgain.relic, true);
  assert.equal(madeRelicAgain.component, false);
  assert.deepEqual(RELIC_SECTIONS, ["top", "middle", "bottom"]);
  assert.deepEqual(RELIC_BOX_COUNTS, { top: 3, middle: 3, bottom: 4 });
  const withText = { ...relic, relicText: { top: "A", middle: "B", bottom: "C" } };
  const pages = [{ ...blankPage(), cards: [withText, ...blankSheet().slice(1)] }];
  const restored = validateBackup(JSON.parse(serializeBackup(pages)));
  assert.deepEqual((restored.pages ?? restored)[0].cards[0], withText);
  const copy = copyCard(withText);
  copy.relicText.top = "Changed";
  assert.equal(withText.relicText.top, "A");
  // Existing saves made before Relic existed have neither field; they must stay valid and unchanged.
  const legacy = [blankPage("Existing")];
  delete legacy[0].cards[0].relic;
  delete legacy[0].cards[0].relicText;
  const raw = serializeBackup(legacy);
  assert.deepEqual(validateBackup(JSON.parse(raw)), legacy);
});

test("version 6 backups round trip components, text and all circle contents", () => {
  assert.equal(STORAGE_KEY, "card-sheet-maker-v6");
  const pages = [blankPage("Components"), blankPage("")];
  pages[0].cards[0] = {
    ...pages[0].cards[0], component: true, title: "Module", keywords: "Hidden text",
    circles: CIRCLE_CONTENTS.map((content) => ({ content })),
  };
  const backup = JSON.parse(serializeBackup(pages));
  assert.equal(backup.version, 6);
  assert.deepEqual(validateBackup(backup), pages);
});

test("copied cards and pages have independent circles and preserve component settings", () => {
  const original = blankPage("Parts");
  original.cards[0] = setComponent(original.cards[0], true);
  original.cards[0].circles = [blankCircle()];
  const copy = copyPage(original);
  assert.equal(copy.name, "Parts (copy)");
  assert.equal(copy.cards[0].component, true);
  copy.cards[0].circles[0].content = "equal";
  assert.equal(original.cards[0].circles[0].content, "empty");
  const card = copyCard(original.cards[0]);
  card.circles[0].content = "asterisk";
  assert.equal(original.cards[0].circles[0].content, "empty");
});

test("circle shortcuts replace counts and use the selected tribe, while special preserves count", () => {
  const original = [{ content: "equal" }, { content: "empty" }, { content: "Tiltch" }];
  for (const tribe of SYMBOL_TRIBES) {
    assert.deepEqual(applyCircleShortcut("1 tribe", original, tribe), [{ content: tribe }]);
    const two = applyCircleShortcut("2 tribe", original, tribe);
    assert.deepEqual(two, [{ content: tribe }, { content: tribe }]);
    two[0].content = "empty";
    assert.equal(two[1].content, tribe);
  }
  assert.deepEqual(applyCircleShortcut("1 any", original, "Yonar"), [blankCircle()]);
  assert.deepEqual(applyCircleShortcut("special", original, "Yonar"), Array.from({ length: 3 }, () => ({ content: "asterisk" })));
  assert.deepEqual(applyCircleShortcut("special", [], "Yonar"), []);
  assert.deepEqual(original, [{ content: "equal" }, { content: "empty" }, { content: "Tiltch" }]);
  assert.throws(() => applyCircleShortcut("unknown", [], "Yonar"), /Unknown circle shortcut/);
  assert.throws(() => applyCircleShortcut("1 tribe", [], "unknown"), /Unknown tribe/);
  for (const shortcut of ["1 tribe", "2 tribe"]) {
    assert.throws(() => applyCircleShortcut(shortcut, [], "Starter"), /Starter has no tribe/);
    assert.throws(() => applyCircleShortcut(shortcut, [], "Omni"), /Omni has no tribe/);
  }
  assert.deepEqual(applyCircleShortcut("1 any", [], "Starter"), [blankCircle()]);
});

test("Omni keeps a 3-6 cost, has no tribe circle shortcuts, but does have a cost selector", () => {
  const pages = [blankPage("Omni cards")];
  const card = pages[0].cards[0];
  card.tribe = "Omni";
  card.cost = 5;
  assert.deepEqual(validateBackup(JSON.parse(serializeBackup(pages))), pages);
  assert.ok(TRIBES.includes("Omni"));
  assert.ok(!SYMBOL_TRIBES.includes("Omni"));
  assert.ok(!NO_COST_SELECTOR_TRIBES.includes("Omni"));
  assert.ok(NO_TRIBE_SHORTCUT_TRIBES.includes("Omni"));
});

test("Starter and attachables round trip, including component-hidden values and independent copies", () => {
  const pages = [blankPage("Starter cards")];
  const card = pages[0].cards[0];
  card.tribe = "Starter";
  card.attachables = { left: "Left", right: "Right", bottom: "Bottom", extra: "Preserved" };
  card.component = true;
  assert.deepEqual(validateBackup(JSON.parse(serializeBackup(pages))), pages);
  const copy = copyCard(card);
  copy.attachables.left = "Changed";
  assert.equal(card.attachables.left, "Left");
  assert.equal(copy.attachables.extra, "Preserved");
  assert.equal(setComponent(card, false).attachables.bottom, "Bottom");
  const legacy = [blankPage("Existing")];
  delete legacy[0].cards[0].attachables;
  const raw = serializeBackup(legacy);
  const storage = memoryStorage(raw);
  assert.deepEqual(createCardStore(storage).load().pages, legacy);
  assert.equal(storage.writes.length, 0);
  assert.equal(storage.getItem(STORAGE_KEY), raw);
  for (const attachables of [null, [], "text", {}, { left: 1, right: "", bottom: "" }]) {
    pages[0].cards[0].attachables = attachables;
    assert.throws(() => validateBackup({ version: 6, pages }), /invalid Attachables/);
  }
});

test("old formats, empty pages and invalid page sizes are rejected", () => {
  for (const data of [null, {}, ...[1, 2, 3, 4, 5].map((version) => ({ version, pages: [blankPage()] })), { version: 6, pages: [] }]) {
    assert.throws(() => validateBackup(data), /format version 6/);
  }
  assert.throws(() => validateBackup({ version: 6, pages: [{ name: 1, cards: blankSheet() }] }), /text name/);
  for (const length of [0, 5, 7, 24]) {
    assert.throws(() => validateBackup({ version: 6, pages: [{ name: "", cards: Array.from({ length }, () => blankSheet()[0]) }] }), /exactly 6 cards/);
  }
});

test("invalid card fields, costs and tribes are rejected", () => {
  for (const patch of [
    { title: null }, { keywords: [] }, { tribe: "nomi" }, { tribe: null },
    { component: "true" }, { component: undefined },
    ...[2, 7, 3.5, "3", null].map((cost) => ({ cost })),
  ]) {
    const pages = [blankPage()];
    Object.assign(pages[0].cards[0], patch);
    assert.throws(() => validateBackup({ version: 6, pages }), /Page 1: Card 1 has invalid data/);
  }
});

test("circle validation accepts zero to six circles and requires supported contents", () => {
  for (const circles of [
    null, {}, [null], Array.from({ length: 7 }, blankCircle),
    ...[null, 1, "2", "power", "unknown"].map((content) => [{ content }]), [{}],
  ]) {
    const pages = [blankPage()];
    pages[0].cards[0].circles = circles;
    assert.throws(() => validateBackup({ version: 6, pages }), /invalid data/);
  }
  for (let count = 0; count <= 6; count++) {
    const pages = [blankPage()];
    pages[0].cards[0].circles = Array.from({ length: count }, blankCircle);
    assert.deepEqual(validateBackup({ version: 6, pages }), pages);
    pages[0].cards[0].component = true;
    assert.deepEqual(validateBackup({ version: 6, pages }), pages);
  }
});

test("legacy circle data is a consistency error and is never reset, migrated or overwritten", () => {
  for (const circle of [
    { value: 2, star: false, icon: null },
    { content: "empty", value: 2 },
    { content: "equal", star: false },
    { content: "Yonar", icon: null },
  ]) {
    const pages = [blankPage("Keep old data")];
    pages[0].cards[0].circles = [circle];
    const raw = serializeBackup(pages);
    const storage = memoryStorage(raw);
    const store = createCardStore(storage);
    assert.throws(() => store.load(), /Page 1: Card 1, circle 1: data consistency error/);
    assert.throws(() => store.save(createInitialPages()), /Saving is blocked/);
    assert.equal(storage.writes.length, 0);
    assert.equal(storage.getItem(STORAGE_KEY), raw);
  }
});
