import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ENERGY_TYPES } from "./energy.js";
import { SYMBOL_TRIBES } from "./cards.js";
import EnergyIcon from "./EnergyIcon.jsx";
import {
  RELIC_SECTIONS, RELIC_SECTION_LABELS, RELIC_BOX_COUNTS, MIDDLE_EXTRA_BOX_LABEL,
  blankRelicsData, createRelicsStore, serializeRelicsData,
} from "./relics.js";
import "./relics.css";

function loadRelics() {
  try {
    const store = createRelicsStore(localStorage);
    const { data, restored } = store.load();
    return {
      data, store,
      status: { text: restored ? "Restored your saved relics." : "New relics page created. Any existing Relic cards from the main editor were copied in once; edits here save independently.", error: false },
    };
  } catch (error) {
    return {
      data: null,
      status: { text: `Could not initialize or restore the relics save: ${error.message} Existing saved data has not been replaced. Editing is blocked to protect it.`, error: true },
    };
  }
}

const BULLET_LINE = /^\*\s+(.*)$/;

function renderBulletLines(text) {
  // Consecutive lines starting with * print as one unordered (bulleted) list.
  const lines = text.split("\n");
  const nodes = [];
  let bulletItems = null;
  let needsLineBreak = false;

  const flushBullets = () => {
    if (bulletItems) {
      nodes.push(
        <ul className="relics-bullet-list" key={`ul-${nodes.length}`}>
          {bulletItems.map((item, i) => <li key={i}>{item}</li>)}
        </ul>,
      );
      bulletItems = null;
      needsLineBreak = false;
    }
  };

  lines.forEach((line) => {
    const bulletMatch = BULLET_LINE.exec(line);
    if (bulletMatch) {
      (bulletItems ??= []).push(bulletMatch[1]);
      return;
    }
    flushBullets();
    nodes.push(
      <React.Fragment key={`line-${nodes.length}`}>
        {needsLineBreak && "\n"}
        {line}
      </React.Fragment>,
    );
    needsLineBreak = true;
  });
  flushBullets();
  return nodes;
}

function RelicColumn({ tribe, relic }) {
  const symbol = ENERGY_TYPES.find((type) => type.name === tribe).symbol;
  return (
    <div className="relics-column" aria-label={`${tribe} relic`}>
      <EnergyIcon symbol={symbol} />
      <div className="relics-name">{relic.name}</div>
      <div className="relics-sections">
        {RELIC_SECTIONS.map((section) => (
          <div className="relics-section" key={section}>
            <div className="relics-text">{renderBulletLines(relic[section].text)}</div>
            <div className="relics-boxes" aria-label={`${RELIC_BOX_COUNTS[section]} boxes${section === "middle" ? ` plus one numbered ${MIDDLE_EXTRA_BOX_LABEL}` : ""}`}>
              {Array.from({ length: RELIC_BOX_COUNTS[section] }, (_, i) => <span className="relics-box" key={i} />)}
              {section === "middle" && <span className="relics-box relics-box-numbered">{MIDDLE_EXTRA_BOX_LABEL}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RelicsPage() {
  const [initial] = useState(loadRelics);
  const [data, setData] = useState(initial.data);
  const [status, setStatus] = useState(initial.status);
  const [printing, setPrinting] = useState(false);
  const [savingPrint, setSavingPrint] = useState(false);
  const printPending = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  const storeRef = useRef(initial.store);

  useEffect(() => {
    const preparePrint = () => flushSync(() => setPrinting(true));
    const finishPrint = () => setPrinting(false);
    window.addEventListener("beforeprint", preparePrint);
    window.addEventListener("afterprint", finishPrint);
    return () => {
      window.removeEventListener("beforeprint", preparePrint);
      window.removeEventListener("afterprint", finishPrint);
    };
  }, []);

  function save(next) {
    try {
      storeRef.current.save(next);
      setData(next);
      setStatus({ text: "Saved in this browser.", error: false });
    } catch (error) {
      setStatus({ text: error.message, error: true });
    }
  }

  function changeRelic(tribe, patch) {
    save({ ...data, relics: { ...data.relics, [tribe]: { ...data.relics[tribe], ...patch } } });
  }

  function changeSection(tribe, section, patch) {
    changeRelic(tribe, { [section]: { ...data.relics[tribe][section], ...patch } });
  }

  async function printRelics() {
    if (printPending.current) return;
    const snapshot = serializeRelicsData(data);
    printPending.current = true;
    setSavingPrint(true);
    try {
      const response = await fetch("/api/print-relics-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: snapshot,
      });
      if (!response.headers.get("content-type")?.includes("application/json")) {
        throw new Error("The local snapshot server is unavailable. Run this app with npm run dev or npm run preview.");
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The snapshot server rejected the save.");
      if (typeof result.filename !== "string") throw new Error("The snapshot server did not confirm a saved filename.");
      if (serializeRelicsData(dataRef.current) !== snapshot) {
        throw new Error(`Relics changed while saving ${result.filename}. Click Print again to save and print the updated relics.`);
      }
      setStatus({ text: `Print snapshot saved: ${result.filename}`, error: false });
    } catch (error) {
      setStatus({ text: `Printing stopped: ${error.message}`, error: true });
      return;
    } finally {
      printPending.current = false;
      setSavingPrint(false);
    }
    flushSync(() => setPrinting(true));
    window.print();
  }

  if (!data) {
    return (
      <div className="relics-app">
        <header><h1>Relics</h1></header>
        <section className="relics-editor" aria-label="Saved relics recovery">
          <h2>Saved relics need attention</h2>
          <p className="status error" role="alert">{status.text}</p>
          <p>Do not clear browser storage. Restore access or use an app version that supports this save, then reload.</p>
          <button type="button" onClick={() => window.location.reload()}>Retry loading saved relics</button>
          <p><a href="/">Card Sheet Maker</a> &middot; <a href="/energy">Energy cards</a> &middot; <a href="/reference">Reference cards</a></p>
        </section>
      </div>
    );
  }

  return (
    <div className={`relics-app${printing ? " relics-print-mode" : ""}`}>
      <header>
        <h1>Relics</h1>
        <p>One half US Letter sheet (8.5 x 5.5 in) with a banner and one column per tribe: Yonar, Tiltch, and Naxatu.</p>
        <a className="header-link" href="/">Card Sheet Maker</a>{" "}
        <a className="header-link" href="/energy">Energy cards</a>{" "}
        <a className="header-link" href="/reference">Reference cards</a>
      </header>
      <main className="relics-main">
        <section className="relics-editor" aria-label="Relics text editor">
          <div className="field">
            <label htmlFor="relics-banner">Banner text</label>
            <input id="relics-banner" value={data.banner} onChange={(event) => save({ ...data, banner: event.target.value })} />
          </div>
          {SYMBOL_TRIBES.map((tribe) => (
            <fieldset key={tribe}>
              <legend>{tribe} relic</legend>
              <div className="field">
                <label htmlFor={`relic-${tribe}-name`}>Name</label>
                <input id={`relic-${tribe}-name`} placeholder="Relic name" value={data.relics[tribe].name}
                  onChange={(event) => changeRelic(tribe, { name: event.target.value })} />
              </div>
              {RELIC_SECTIONS.map((section) => (
                <div className="field" key={section}>
                  <label htmlFor={`relic-${tribe}-${section}-text`}>{RELIC_SECTION_LABELS[section]} text</label>
                  <textarea id={`relic-${tribe}-${section}-text`} value={data.relics[tribe][section].text}
                    onChange={(event) => changeSection(tribe, section, { text: event.target.value })} />
                </div>
              ))}
            </fieldset>
          ))}
          <button type="button" onClick={() => {
            if (window.confirm("Clear the banner and all three relics?")) save(blankRelicsData());
          }}>Clear all text</button>
          <p className={`status${status.error ? " error" : ""}`} role="status" aria-live="polite">{status.text}</p>
        </section>
        <div className="relics-sheet-wrap">
          <div className="toolbar">
            <button type="button" className="primary" disabled={savingPrint} onClick={printRelics}>Print / Save PDF</button>
          </div>
          <p className="hint print-help">US Letter, portrait, printed on the top half of the sheet. Print at <strong>100% / Actual size</strong> with headers and footers off. The sheet is 8.5 x 5.5 inches. Cut along the dashed border.</p>
          <div className="preview-scroll">
            <div className="relics-sheet" aria-label="Relics print preview">
              <div className="relics-banner">{data.banner}</div>
              <div className="relics-columns">
                {SYMBOL_TRIBES.map((tribe) => <RelicColumn tribe={tribe} relic={data.relics[tribe]} key={tribe} />)}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
