import assert from "node:assert/strict";
import test from "node:test";
import {
  TRIBES, STORAGE_KEY, blankSheet, blankPage, blankCircle, copyCard, copyPage,
  createCirclePreset, createInitialPages, serializeBackup, validateBackup, setComponent,
} from "./cards.js";

test("four full sheets contain 24 named cards with the exact cost spread per tribe", () => {
  const pages = createInitialPages();
  assert.equal(pages.length, 4);
  assert.ok(pages.every((page) => page.cards.length === 6));
  const cards = pages.flatMap((page) => page.cards);
  assert.equal(cards.length, 24);
  assert.deepEqual(TRIBES, ["Yonar", "Tiltch", "Naxatu"]);
  for (const tribe of TRIBES) {
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

test("component toggle adds at least three circles and preserves hidden fields and existing circles", () => {
  const original = { ...blankSheet()[0], title: "Test", keywords: "Kept", tribe: "Naxatu", cost: 6, circles: [blankCircle()] };
  const component = setComponent(original, true);
  assert.equal(component.circles.length, 3);
  assert.equal(original.circles.length, 1);
  component.circles[1].value = 6;
  assert.equal(component.circles[2].value, 2);
  assert.equal(component.keywords, "Kept");
  const restored = setComponent(component, false);
  assert.equal(restored.component, false);
  assert.equal(restored.tribe, "Naxatu");
  assert.equal(restored.cost, 6);
  assert.equal(restored.keywords, "Kept");
  assert.deepEqual(restored.circles, component.circles);
});

test("version 6 backups round trip components, text and all circle decorations", () => {
  assert.equal(STORAGE_KEY, "card-sheet-maker-v6");
  const pages = [blankPage("Components"), blankPage("")];
  pages[0].cards[0] = {
    ...pages[0].cards[0], component: true, title: "Module", keywords: "Hidden text",
    circles: Array.from({ length: 6 }, (_, index) => ({ value: 2 + index % 5, star: index % 2 === 0, icon: index % 2 ? "eye" : null })),
  };
  const backup = JSON.parse(serializeBackup(pages));
  assert.equal(backup.version, 6);
  assert.deepEqual(validateBackup(backup), pages);
});

test("copied cards and pages have independent circles and preserve component settings", () => {
  const original = blankPage("Parts");
  original.cards[0] = setComponent(original.cards[0], true);
  const copy = copyPage(original);
  assert.equal(copy.name, "Parts (copy)");
  assert.equal(copy.cards[0].component, true);
  copy.cards[0].circles[0].star = true;
  assert.equal(original.cards[0].circles[0].star, false);
  const card = copyCard(original.cards[0]);
  card.circles[0].value = 6;
  assert.equal(original.cards[0].circles[0].value, 2);
});

test("circle presets remain independent and unknown presets fail explicitly", () => {
  for (const name of ["Early", "Late", "Standard"]) {
    const preset = createCirclePreset(name);
    const copy = createCirclePreset(name);
    copy[0].value = 2;
    assert.deepEqual(createCirclePreset(name), preset);
  }
  assert.throws(() => createCirclePreset("unknown"), /Unknown circle preset/);
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

test("invalid card fields, costs, tribes and component circle counts are rejected", () => {
  for (const patch of [
    { title: null }, { keywords: [] }, { tribe: "nomi" }, { tribe: null },
    { component: "true" }, { component: true }, { component: undefined },
    ...[2, 7, 3.5, "3", null].map((cost) => ({ cost })),
    { component: true, circles: [blankCircle(), blankCircle()] },
  ]) {
    const pages = [blankPage()];
    Object.assign(pages[0].cards[0], patch);
    assert.throws(() => validateBackup({ version: 6, pages }), /Page 1: Card 1 has invalid data/);
  }
});

test("circle validation accepts zero to six circles and requires supported values and decorations", () => {
  for (const circles of [
    null, {}, [null], Array.from({ length: 7 }, blankCircle),
    ...[null, 1, 7, "2", "power"].map((value) => [{ ...blankCircle(), value }]),
    [{ ...blankCircle(), star: "true" }], [{ ...blankCircle(), icon: "unknown" }], [{ value: 2 }],
  ]) {
    const pages = [blankPage()];
    pages[0].cards[0].circles = circles;
    assert.throws(() => validateBackup({ version: 6, pages }), /invalid data/);
  }
  for (let count = 0; count <= 6; count++) {
    const pages = [blankPage()];
    pages[0].cards[0].circles = Array.from({ length: count }, blankCircle);
    assert.deepEqual(validateBackup({ version: 6, pages }), pages);
    if (count >= 3) {
      pages[0].cards[0].component = true;
      assert.deepEqual(validateBackup({ version: 6, pages }), pages);
    }
  }
});
