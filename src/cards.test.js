import assert from "node:assert/strict";
import test from "node:test";
import { blankSheet, blankPage, copyCard, copyPage, serializeBackup, validateBackup } from "./cards.js";

test("blank sheets contain 12 independent cards and costs", () => {
  const cards = blankSheet();
  assert.equal(cards.length, 12);
  cards[0].costs[0].number = 2;
  assert.equal(cards[1].costs[0].number, 1);
});

test("version 1 backups migrate all supported colors and circle counts", () => {
  const cards = blankSheet();
  [0, 2, 3, 4, 5].forEach((circles, index) => {
    cards[index] = {
      title: "<Card>", tribe: "Ember", keywords: "Swift\nDraw one card", circles,
      costs: ["red", "blue", "green", "white", "black"].map((color, i) => ({ color, number: i ? 999 : 1 })),
    };
  });
  assert.deepEqual(validateBackup({ version: 1, cards }), [{ name: "Page 1", cards }]);
});

test("version 2 backups round trip multiple named pages", () => {
  const pages = [blankPage("Ember"), blankPage("Water"), blankPage("")];
  pages[1].cards[0].title = "River";
  assert.deepEqual(validateBackup(JSON.parse(serializeBackup(pages))), pages);
});

test("duplicated and new pages have independent cards and costs", () => {
  const original = blankPage("Ember");
  const copy = copyPage(original);
  assert.equal(copy.name, "Ember (copy)");
  copy.cards[0].title = "Changed";
  copy.cards[0].costs[0].number = 3;
  assert.equal(original.cards[0].title, "");
  assert.equal(original.cards[0].costs[0].number, 1);
  assert.notEqual(blankPage().cards, original.cards);
});

test("copying does not share mutable costs", () => {
  const original = blankSheet()[0];
  const copy = copyCard(original);
  copy.costs[0].number = 3;
  assert.equal(original.costs[0].number, 1);
});

test("invalid backups are rejected", () => {
  for (const data of [null, {}, { version: 3 }, { version: 2, pages: [] }, { version: 2, cards: blankSheet() }]) {
    assert.throws(() => validateBackup(data), /at least one page/);
  }
  assert.throws(() => validateBackup({ version: 1, cards: [] }), /exactly 12 cards/);
  assert.throws(() => validateBackup({ version: 2, pages: [{ name: 123, cards: blankSheet() }] }), /text name/);
  assert.throws(() => validateBackup({ version: 2, pages: [{ name: "Empty", cards: [] }] }), /Page 1:.*exactly 12 cards/);
  for (const patch of [
    { title: null }, { tribe: 2 }, { keywords: [] }, { circles: 1 }, { circles: 6 },
    { costs: [] }, { costs: Array(6).fill({ color: "red", number: 1 }) },
    { costs: [null] }, { costs: [{ color: "purple", number: 1 }] },
    ...[0, 1000, 1.5, "2", null].map((number) => ({ costs: [{ color: "red", number }] })),
  ]) {
    const cards = blankSheet();
    cards[0] = { ...cards[0], ...patch };
    assert.throws(() => validateBackup({ version: 1, cards }), /Card 1 has invalid data/);
    assert.throws(() => validateBackup({ version: 2, pages: [{ name: "Invalid", cards }] }), /Page 1: Card 1 has invalid data/);
  }
});
