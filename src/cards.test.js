import assert from "node:assert/strict";
import test from "node:test";
import { COLORS, blankSheet, blankPage, blankCircle, copyCard, copyPage, createCirclePreset, createInitialPages, serializeBackup, validateBackup } from "./cards.js";

test("initial pages have the exact requested colors, titles, tribe distributions and circles", () => {
  const pages = createInitialPages();
  const expected = [
    ["Blue", "blue", "Replicators", { nomi: 3, runite: 2, nuke: 1 }],
    ["Red", "red", "Assemblers", { runite: 4, nomi: 2 }],
    ["Green", "green", "Reassemblers", { nuke: 3, nomi: 2, runite: 1 }],
    ["Black", "black", "Pulsars", { nuke: 4, nomi: 1, runite: 1 }],
    ["White", "white", "Adapters", { nomi: 2, runite: 2, nuke: 2 }],
  ];
  assert.equal(pages.length, 5);
  expected.forEach(([name, color, role, counts], index) => {
    const page = pages[index];
    assert.equal(page.name, name);
    assert.equal(page.cards.length, 6);
    const actual = {};
    page.cards.forEach((card) => {
      actual[card.tribe] = (actual[card.tribe] || 0) + 1;
      assert.equal(card.color, color);
      assert.equal(card.title, `${card.tribe[0].toUpperCase() + card.tribe.slice(1)} ${role}`);
      assert.ok([2, 3].includes(card.circles.length));
      assert.deepEqual(card.circles[0], { value: 5, star: false, icon: null });
      assert.deepEqual(card.costs, [{ color: "white", number: 1 }]);
    });
    assert.deepEqual(actual, counts);
  });
  assert.deepEqual(validateBackup(JSON.parse(serializeBackup(pages))), pages);
});

test("initializing creates independent cards, circles, costs, and subsequent results", () => {
  const pages = createInitialPages();
  pages[0].cards[0].circles[0].value = 6;
  pages[0].cards[0].circles[1].star = false;
  pages[0].cards[0].costs[0].number = 9;
  assert.equal(pages[0].cards[0].circles[2].star, true);
  assert.equal(pages[0].cards[1].circles[1].star, true);
  assert.equal(pages[0].cards[1].circles[0].value, 5);
  assert.equal(pages[0].cards[1].costs[0].number, 1);
  assert.deepEqual(createInitialPages()[0].cards[0].circles.map((circle) => circle.value), [5, 3, 2]);
});

test("every initial card has the exact requested configuration and decorations", () => {
  const expected = {
    Early: [
      { value: 5, star: false, icon: null },
      { value: 4, star: true, icon: "eye" },
    ],
    Late: [
      { value: 5, star: false, icon: null },
      { value: 3, star: true, icon: null },
      { value: 2, star: true, icon: "eye" },
    ],
    Standard: [
      { value: 5, star: false, icon: null },
      { value: 3, star: true, icon: null },
    ],
  };
  const configurations = [
    ["Late", "Late", "Standard", "Late", "Late", "Late"],
    ["Late", "Late", "Standard", "Standard", "Standard", "Standard"],
    ["Late", "Standard", "Standard", "Late", "Late", "Standard"],
    ["Early", "Early", "Early", "Standard", "Early", "Early"],
    ["Standard", "Standard", "Standard", "Standard", "Standard", "Standard"],
  ];
  createInitialPages().forEach((page, p) => page.cards.forEach((card, c) => {
    const circles = expected[configurations[p][c]].map((circle) => page.name === "White" ? { ...circle, star: false } : circle);
    assert.deepEqual(card.circles, circles, `${page.name}, card ${c + 1}`);
    assert.ok(card.circles.every((circle) => typeof circle.value === "number"));
  }));
  for (const name of Object.keys(expected)) {
    assert.deepEqual(createCirclePreset(name), expected[name]);
    const changed = createCirclePreset(name);
    changed[0].value = 2;
    assert.deepEqual(createCirclePreset(name), expected[name]);
  }
  assert.throws(() => createCirclePreset("unknown"), /Unknown circle preset/);
});

test("blank sheets contain six independent cards with a default card color", () => {
  const cards = blankSheet();
  assert.equal(cards.length, 6);
  assert.ok(cards.every((card) => card.color === "white"));
  cards[0].costs[0].number = 2;
  assert.equal(cards[1].costs[0].number, 1);
});

test("version 5 backups round trip all card colors, costs, and circle settings", () => {
  const pages = [blankPage("Ember"), blankPage("Water"), blankPage("")];
  [2, 3, 4, 5, 6].forEach((value, index) => {
    pages[0].cards[index].color = COLORS[index % COLORS.length];
    pages[0].cards[index].circles = [{ value, star: index % 2 === 0, icon: index % 2 ? "eye" : null }];
    pages[0].cards[index].costs = COLORS.map((color, i) => ({ color, number: i ? 999 : 1 }));
  });
  const backup = JSON.parse(serializeBackup(pages));
  assert.equal(backup.version, 5);
  assert.deepEqual(validateBackup(backup), pages);
});

test("duplicated cards and pages have independent circles and costs and preserve color", () => {
  const original = blankPage("Ember");
  original.cards[0].color = "red";
  original.cards[0].circles = [blankCircle()];
  const copy = copyPage(original);
  assert.equal(copy.name, "Ember (copy)");
  assert.equal(copy.cards[0].color, "red");
  copy.cards[0].title = "Changed";
  copy.cards[0].costs[0].number = 3;
  copy.cards[0].circles[0].star = true;
  assert.equal(original.cards[0].title, "");
  assert.equal(original.cards[0].costs[0].number, 1);
  assert.equal(original.cards[0].circles[0].star, false);
  const cardCopy = copyCard(original.cards[0]);
  cardCopy.color = "blue";
  assert.equal(original.cards[0].color, "red");
});

test("old formats and invalid pages are explicitly rejected", () => {
  for (const data of [null, {}, ...[1, 2, 3, 4].map((version) => ({ version, pages: [blankPage()] })), { version: 5, pages: [] }]) {
    assert.throws(() => validateBackup(data), /format version 5/);
  }
  assert.throws(() => validateBackup({ version: 5, pages: [{ name: 123, cards: blankSheet() }] }), /text name/);
  for (const count of [0, 5, 7, 12]) {
    assert.throws(() => validateBackup({
      version: 5, pages: [{ name: "Wrong size", cards: Array.from({ length: count }, () => blankSheet()[0]) }],
    }), /exactly 6 cards/);
  }
});

test("invalid card and cost data is rejected", () => {
  for (const patch of [
    { title: null }, { tribe: 2 }, { keywords: [] },
    { color: "purple" }, { color: null }, { color: undefined },
    { costs: [] }, { costs: Array(6).fill({ color: "red", number: 1 }) },
    { costs: [null] }, { costs: [{ color: "purple", number: 1 }] },
    ...[0, 1000, 1.5, "2", null].map((number) => ({ costs: [{ color: "red", number }] })),
  ]) {
    const pages = [blankPage()];
    pages[0].cards[0] = { ...pages[0].cards[0], ...patch };
    assert.throws(() => validateBackup({ version: 5, pages }), /Page 1: Card 1 has invalid data/);
  }
});

test("invalid circle values, decorations, and counts are rejected", () => {
  for (const circles of [
    2, null, {}, ...[4, 5, 6].map((length) => Array.from({ length }, blankCircle)), [null],
    ...[null, 1, 7, "2", "power", "unknown"].map((value) => [{ ...blankCircle(), value }]),
    [{ ...blankCircle(), star: "true" }], [{ ...blankCircle(), icon: "unknown" }],
    [{ value: 2 }], [{ ...blankCircle(), icon: false }],
  ]) {
    const pages = [blankPage()];
    pages[0].cards[0].circles = circles;
    assert.throws(() => validateBackup({ version: 5, pages }), /Card 1 has invalid data/);
  }
  for (let count = 0; count <= 3; count++) {
    const pages = [blankPage()];
    pages[0].cards[0].circles = Array.from({ length: count }, blankCircle);
    assert.deepEqual(validateBackup({ version: 5, pages }), pages);
  }
});
