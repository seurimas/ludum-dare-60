import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  PLAYER_REFERENCE_COUNT, REFERENCE_FRONT_LAYOUT, REFERENCE_BACK_LAYOUT,
  blankReferenceData, createReferenceStore, serializeReferenceData,
} from "./reference.js";
import "./reference.css";

function loadReference() {
  try {
    const store = createReferenceStore(localStorage);
    const { data, restored } = store.load();
    return {
      data, store,
      status: { text: restored ? "Restored your saved reference text." : "New reference cards created. Edits will be saved automatically.", error: false },
    };
  } catch (error) {
    return {
      data: null,
      status: { text: `Could not initialize or restore the reference save: ${error.message} Existing saved data has not been replaced. Editing is blocked to protect it.`, error: true },
    };
  }
}

const HEADING_LINE = /^#\s?(.*)$/;
const BULLET_LINE = /^\*\s+(.*)$/;

function renderParagraphLines(paragraph) {
  // A line starting with # prints as a bold section title, like Player Reference labels.
  // Consecutive lines starting with * print as one unordered (bulleted) list.
  const lines = paragraph.split("\n");
  const nodes = [];
  let bulletItems = null;
  let needsLineBreak = false;

  const flushBullets = () => {
    if (bulletItems) {
      nodes.push(
        <ul className="reference-bullet-list" key={`ul-${nodes.length}`}>
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
    const headingMatch = HEADING_LINE.exec(line);
    nodes.push(
      <React.Fragment key={`line-${nodes.length}`}>
        {needsLineBreak && "\n"}
        {headingMatch ? <strong className="reference-heading-line">{headingMatch[1]}</strong> : line}
      </React.Fragment>,
    );
    needsLineBreak = true;
  });
  flushBullets();
  return nodes;
}

function FreeTextCard({ title, text, ariaLabel, allowHeadings = false }) {
  // A blank line in the text becomes a printed divider between sections.
  const paragraphs = text.split(/\n{2,}/);
  return (
    <div className="reference-card" aria-label={ariaLabel}>
      <div className="reference-card-title">{title}</div>
      <div className="reference-rules-text">
        {paragraphs.map((paragraph, index) => (
          <React.Fragment key={index}>
            {index > 0 && <hr className="reference-rules-separator" />}
            <div className="reference-rules-paragraph">{allowHeadings ? renderParagraphLines(paragraph) : paragraph}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

const FRONT_CARD_CONTENT = {
  setup: { title: "Setup", field: "setupText", ariaLabel: "Setup card (front)" },
  general: { title: "General Reference", field: "generalText", ariaLabel: "General reference card (front)" },
  player: { title: "Player Turn", field: "playerTurnText", ariaLabel: "Player turn card (front)" },
};
// Field keys keep their original names from when the content was first
// introduced; only the printed title and card position have since moved.
const BACK_CARD_CONTENT = {
  setup: { title: "Center of the Galaxy (C.o.G.)", field: "generalContText", ariaLabel: "Center of the Galaxy card (back of Setup)" },
  general: { title: "General Reference Cont.", field: "variantText", ariaLabel: "General reference continued card (back of General Reference)" },
  player: { title: "Player Reference", field: "playerReferenceBackText", ariaLabel: "Player reference card (back of Player Turn)" },
};

function LayoutCard({ type, content, data }) {
  const { title, field, ariaLabel } = content[type];
  return <FreeTextCard title={title} text={data[field]} ariaLabel={ariaLabel} allowHeadings />;
}

export default function ReferencePage() {
  const [initial] = useState(loadReference);
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

  async function printReference() {
    if (printPending.current) return;
    const snapshot = serializeReferenceData(data);
    printPending.current = true;
    setSavingPrint(true);
    try {
      const response = await fetch("/api/print-reference-snapshot", {
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
      if (serializeReferenceData(dataRef.current) !== snapshot) {
        throw new Error(`Reference text changed while saving ${result.filename}. Click Print again to save and print the updated text.`);
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
      <div className="reference-app">
        <header><h1>Reference cards</h1></header>
        <section className="reference-editor" aria-label="Saved reference recovery">
          <h2>Saved reference text needs attention</h2>
          <p className="status error" role="alert">{status.text}</p>
          <p>Do not clear browser storage. Restore access or use an app version that supports this save, then reload.</p>
          <button type="button" onClick={() => window.location.reload()}>Retry loading saved reference text</button>
          <p><a href="/">Card Sheet Maker</a> &middot; <a href="/energy">Energy cards</a></p>
        </section>
      </div>
    );
  }

  return (
    <div className={`reference-app${printing ? " reference-print-mode" : ""}`}>
      <header>
        <h1>Reference cards</h1>
        <p>3 card types, printed front and back on two sheets: Setup/C.o.G.,
          General Reference/Cont., and {PLAYER_REFERENCE_COUNT} identical
          Player Turn/Player Reference cards.</p>
        <a className="header-link" href="/">Card Sheet Maker</a>{" "}
        <a className="header-link" href="/energy">Energy cards</a>
      </header>
      <main className="reference-main">
        <section className="reference-editor" aria-label="Reference text editor">
          <div className="field">
            <label htmlFor="setup-text">Setup card text (front)</label>
            <textarea id="setup-text" placeholder="Fully free text for the Setup card" value={data.setupText}
              onChange={(event) => save({ ...data, setupText: event.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="general-cont-text">Center of the Galaxy (C.o.G.) text (back of Setup)</label>
            <textarea id="general-cont-text" placeholder="Fully free text for the back of the Setup card" value={data.generalContText}
              onChange={(event) => save({ ...data, generalContText: event.target.value })} />
            <p className="hint">Start a line with # to print it bold, like a section title.</p>
          </div>
          <div className="field">
            <label htmlFor="general-text">General Reference card text (front)</label>
            <textarea id="general-text" placeholder="Fully free text for the General Reference card" value={data.generalText}
              onChange={(event) => save({ ...data, generalText: event.target.value })} />
            <p className="hint">Start a line with # to print it bold, like a section title.</p>
          </div>
          <div className="field">
            <label htmlFor="variant-text">General Reference Cont. text (back of General Reference)</label>
            <textarea id="variant-text" placeholder="Fully free text for the back of the General Reference card" value={data.variantText}
              onChange={(event) => save({ ...data, variantText: event.target.value })} />
            <p className="hint">Start a line with # to print it bold, like a section title.</p>
          </div>
          <div className="field">
            <label htmlFor="player-turn-text">Player Turn card text (front, all {PLAYER_REFERENCE_COUNT} cards stay identical)</label>
            <textarea id="player-turn-text" placeholder="Fully free text for the Player Turn cards" value={data.playerTurnText}
              onChange={(event) => save({ ...data, playerTurnText: event.target.value })} />
            <p className="hint">Start a line with # to print it bold, like a section title (e.g. # Phases).</p>
          </div>
          <div className="field">
            <label htmlFor="player-reference-back-text">Player Reference text (back of Player Turn, all {PLAYER_REFERENCE_COUNT} cards stay identical)</label>
            <textarea id="player-reference-back-text" placeholder="Fully free text for the back of the Player Turn cards" value={data.playerReferenceBackText}
              onChange={(event) => save({ ...data, playerReferenceBackText: event.target.value })} />
            <p className="hint">Start a line with # to print it bold, like a section title.</p>
          </div>
          <button type="button" onClick={() => {
            if (window.confirm("Clear the Setup, Center of the Galaxy (C.o.G.), General Reference, General Reference Cont., Player Turn, and Player Reference card text?")) save(blankReferenceData());
          }}>Clear all text</button>
          <p className={`status${status.error ? " error" : ""}`} role="status" aria-live="polite">{status.text}</p>
        </section>
        <div className="reference-sheet-wrap">
          <div className="toolbar">
            <button type="button" className="primary" disabled={savingPrint} onClick={printReference}>Print / Save PDF</button>
          </div>
          <p className="hint print-help">US Letter, portrait. Print at <strong>100% / Actual size</strong> with headers and footers off. Each card is 2.4 x 3.4 inches; 6 cards per sheet with 3 mm gaps. Cut along the dashed borders. Print both sheets double-sided using <strong>Flip on Long Edge</strong> duplexing (the Back sheet's columns are already mirrored for this); if printing single-sided, print the Front sheet, then feed it back in to print the Back sheet on the reverse.</p>
          <div className="preview-scroll">
            <section className="reference-sheet-page" aria-label="Front sheet">
              <h2 className="reference-sheet-heading">Front</h2>
              <div className="reference-sheet" aria-label="Front card print preview">
                {REFERENCE_FRONT_LAYOUT.map((type, i) => <LayoutCard type={type} content={FRONT_CARD_CONTENT} data={data} key={i} />)}
              </div>
            </section>
            <section className="reference-sheet-page" aria-label="Back sheet">
              <h2 className="reference-sheet-heading">Back</h2>
              <div className="reference-sheet" aria-label="Back card print preview">
                {REFERENCE_BACK_LAYOUT.map((type, i) => <LayoutCard type={type} content={BACK_CARD_CONTENT} data={data} key={i} />)}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
