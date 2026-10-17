import assert from "node:assert/strict";
import test from "node:test";
import { createEnergyPages, ENERGY_TYPES } from "./energy.js";

test("energy consists of four nine-card sheets with eight singles of each type and no amounts", () => {
  const pages = createEnergyPages();
  assert.equal(pages.length, 4);
  assert.ok(pages.every((page) => page.cards.length === 9));
  const cards = pages.flatMap((page) => page.cards);
  assert.equal(cards.filter((card) => card.types.length === 1).length, 24);
  assert.ok(cards.every((card) => Object.keys(card).join() === "types"));
  for (const { name } of ENERGY_TYPES) {
    const singles = cards.filter((card) => card.types.length === 1 && card.types[0] === name);
    assert.equal(singles.length, 8);
  }
});

test("splits contain four of each distinct pair across all sheets", () => {
  const splits = createEnergyPages().flatMap((page) => page.cards).filter((card) => card.types.length === 2);
  assert.equal(splits.length, 12);
  for (const pair of [["Yonar", "Tiltch"], ["Yonar", "Naxatu"], ["Tiltch", "Naxatu"]]) {
    assert.equal(splits.filter((card) => card.types.join("/") === pair.join("/")).length, 4);
  }
  assert.ok(splits.every((card) =>
    card.amount === undefined && card.types.length === 2 && card.types[0] !== card.types[1],
  ));
});

test("generated cards and subsequent generations are independent", () => {
  const pages = createEnergyPages();
  pages[2].cards[6].types[0] = "Changed";
  assert.equal(pages[2].cards[7].types[0], "Yonar");
  assert.equal(pages[3].cards[0].types[0], "Yonar");
  assert.equal(createEnergyPages()[2].cards[6].types[0], "Yonar");
});
