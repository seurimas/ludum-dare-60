import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { printSnapshots } from "./printSnapshots.js";
import { createInitialPages, serializeBackup } from "./src/cards.js";

test("print snapshots save exact selected/all pages with unique timestamped filenames", async () => {
  const directory = await mkdtemp(join(tmpdir(), "card-print-test-"));
  let handler;
  printSnapshots(directory).configureServer({ middlewares: { use(path, middleware) {
    assert.equal(path, "/api/print-snapshot");
    handler = middleware;
  } } });
  const server = createServer((request, response) => handler(request, response));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const post = (body, source = origin) => fetch(`${origin}/api/print-snapshot`, {
    method: "POST", headers: { Origin: source, "Content-Type": "application/json" }, body,
  });
  try {
    const pages = createInitialPages();
    pages[0].cards[0].title = "Custom \u263a card";
    const filenames = [];
    for (const selection of [[pages[0]], pages, pages]) {
      const raw = serializeBackup(selection);
      const response = await post(raw);
      assert.equal(response.status, 201);
      const { filename } = await response.json();
      assert.match(filename, /^printed-cards-\d{4}-\d{2}-\d{2}T[\d-]+Z-[\da-f-]+\.json$/);
      assert.equal(await readFile(join(directory, filename), "utf8"), raw);
      filenames.push(filename);
    }
    assert.equal(new Set(filenames).size, 3);
    assert.equal((await post("broken")).status, 400);
    assert.equal((await post(serializeBackup(pages), "http://untrusted.example")).status, 403);
    assert.equal((await fetch(origin)).status, 405);
    assert.equal((await readdir(directory)).length, 3);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true });
  }
});
