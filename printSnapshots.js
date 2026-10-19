import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { serializeBackup, validateBackup } from "./src/cards.js";
import { serializeReferenceData, validateReferenceData } from "./src/reference.js";

function registerSnapshotRoute(server, directory, { path, prefix, validate, serialize }) {
  server.middlewares.use(path, async (request, response) => {
    const reply = (status, body) => {
      response.writeHead(status, { "Content-Type": "application/json" });
      response.end(JSON.stringify(body));
    };
    if (request.method !== "POST") {
      reply(405, { error: "Use POST to save a print snapshot." });
      return;
    }
    if (request.headers.origin !== `http://${request.headers.host}`) {
      reply(403, { error: "Print snapshots require a same-origin request." });
      return;
    }
    try {
      const chunks = [];
      let bytes = 0;
      for await (const chunk of request) {
        bytes += chunk.length;
        if (bytes > 5 * 1024 * 1024) {
          reply(413, { error: "Print snapshot exceeds the 5 MB limit." });
          return;
        }
        chunks.push(chunk);
      }
      let data;
      try {
        data = validate(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reply(400, { error: `Invalid print snapshot: ${error.message}` });
        return;
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `${prefix}-${timestamp}-${randomUUID()}.json`;
      await writeFile(join(directory, filename), serialize(data), { flag: "wx" });
      reply(201, { filename });
    } catch (error) {
      reply(500, { error: `Could not save print snapshot: ${error.message}` });
    }
  });
}

export function printSnapshots(directory) {
  function configure(server) {
    registerSnapshotRoute(server, directory, {
      path: "/api/print-snapshot", prefix: "printed-cards", validate: validateBackup, serialize: serializeBackup,
    });
    registerSnapshotRoute(server, directory, {
      path: "/api/print-reference-snapshot", prefix: "printed-references", validate: validateReferenceData, serialize: serializeReferenceData,
    });
  }
  return {
    name: "local-print-snapshots",
    configureServer: configure,
    configurePreviewServer: configure,
  };
}
