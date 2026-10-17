import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import CardEditor from "./CardEditor.jsx";
import CardSheet, { getOverflowWarning } from "./CardSheet.jsx";
import { STORAGE_KEY, CARD_COUNT, blankCard, blankPage, blankSheet, copyCard, copyPage, createInitialPages, serializeBackup, validateBackup } from "./cards.js";
import PageSelector from "./PageSelector.jsx";

function loadSheet() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const pages = saved ? validateBackup(JSON.parse(saved)) : createInitialPages();
    if (!saved) localStorage.setItem(STORAGE_KEY, serializeBackup(pages));
    return {
      pages,
      status: { text: saved ? "Restored your saved pages." : "New spread generated. Edits will be saved automatically.", error: false },
    };
  } catch (error) {
    return {
      pages: createInitialPages(),
      status: { text: `Could not initialize or restore saved pages: ${error.message} Download a backup to keep edits.`, error: true },
    };
  }
}

export default function App() {
  const [initial] = useState(loadSheet);
  const [pages, setPages] = useState(initial.pages);
  const [selectedPage, setSelectedPage] = useState(0);
  const cards = pages[selectedPage].cards;
  const [saveStatus, setSaveStatus] = useState(initial.status);
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState({ text: "", error: false });
  const [overflowWarning, setOverflowWarning] = useState("");
  const [printAll, setPrintAll] = useState(false);
  const sheetRef = useRef(null);
  const allPagesRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const check = () => setOverflowWarning(getOverflowWarning(sheetRef.current));
    const frame = requestAnimationFrame(check);
    window.addEventListener("resize", check);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", check);
    };
  }, [cards]);

  useEffect(() => {
    const resetPrintMode = () => setPrintAll(false);
    window.addEventListener("afterprint", resetPrintMode);
    return () => window.removeEventListener("afterprint", resetPrintMode);
  }, []);

  function savePages(nextPages) {
    setPages(nextPages);
    try {
      localStorage.setItem(STORAGE_KEY, serializeBackup(nextPages));
      setSaveStatus({ text: "Saved in this browser.", error: false });
    } catch (error) {
      setSaveStatus({
        text: `Automatic saving is unavailable: ${error.message} Download a backup before closing.`,
        error: true,
      });
    }
  }

  function save(nextCards) {
    savePages(pages.map((page, index) => index === selectedPage ? { ...page, cards: nextCards } : page));
  }

  function selectPage(index) {
    setSelectedPage(index);
    setSelected(0);
    setMessage({ text: "", error: false });
  }

  function addPage(name) {
    savePages([...pages, blankPage(name)]);
    selectPage(pages.length);
  }

  function duplicatePage(name) {
    savePages([...pages, { ...copyPage(pages[selectedPage]), name }]);
    selectPage(pages.length);
  }

  function deletePage() {
    if (!window.confirm(`Delete "${pages[selectedPage].name || "Untitled page"}" and its ${CARD_COUNT} cards? This cannot be undone.`)) return;
    savePages(pages.filter((_, index) => index !== selectedPage));
    selectPage(Math.min(selectedPage, pages.length - 2));
  }

  function changeCard(patch) {
    save(cards.map((card, index) => index === selected ? { ...card, ...patch } : card));
  }

  function copyToNext() {
    if (!window.confirm(`Replace card ${selected + 2} with a copy of card ${selected + 1}?`)) return;
    save(cards.map((card, index) => index === selected + 1 ? copyCard(cards[selected]) : card));
    setSelected(selected + 1);
  }

  function clearCard() {
    if (!window.confirm(`Clear card ${selected + 1}?`)) return;
    save(cards.map((card, index) => index === selected ? blankCard() : card));
  }

  function resetSheet() {
    if (!window.confirm(`Clear all ${CARD_COUNT} cards on the selected page? Other pages and this page's name will be kept. Download a backup first if you want to keep these cards.`)) return;
    save(blankSheet());
    setSelected(0);
    setMessage({ text: "Selected page cleared.", error: false });
  }

  function printSheet(allPages = false) {
    const warning = allPages
      ? Array.from(allPagesRef.current.querySelectorAll(".sheet")).map((sheet, index) => {
        const text = getOverflowWarning(sheet);
        return text ? `${pages[index].name || `Page ${index + 1}`}: ${text}` : "";
      }).filter(Boolean).join("\n")
      : getOverflowWarning(sheetRef.current);
    if (allPages) setMessage({ text: warning, error: false });
    else setOverflowWarning(warning);
    if (warning && !window.confirm(warning + "\nPrint anyway?")) return;
    flushSync(() => setPrintAll(allPages));
    window.print();
  }

  function downloadBackup() {
    const blob = new Blob([serializeBackup(pages)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "card-sheet-backup.json";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage({ text: "Backup download requested. Keep it somewhere safe.", error: false });
  }

  async function openBackup(event) {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;
    try {
      const imported = validateBackup(JSON.parse(await file.text()));
      if (!window.confirm("Replace all current pages with this backup?")) return;
      savePages(imported);
      selectPage(0);
      setMessage({ text: "Backup opened. All pages restored.", error: false });
    } catch (error) {
      setMessage({ text: `Could not open backup: ${error.message} Your current cards have not changed.`, error: true });
    } finally {
      input.value = "";
    }
  }

  return (
    <div className={printAll ? "print-all-mode" : ""}>
      <header>
        <h1>Card Sheet Maker</h1>
        <p>{CARD_COUNT} cards per page. No account or internet needed once running.</p>
        <a className="header-link" href="/energy">Energy cards</a>
      </header>
      <main>
        <CardEditor
          key={`${selectedPage}:${selected}`}
          card={cards[selected]} selected={selected}
          onSelect={setSelected} onChange={changeCard} onCopy={copyToNext} onClear={clearCard}
          onError={(text) => setMessage({ text, error: true })} saveStatus={saveStatus}
        />
        <section aria-label="Printable sheet">
          <div className="toolbar">
            <button type="button" className="primary" onClick={() => printSheet(true)}>Print all pages / Save PDF</button>
            <button type="button" onClick={() => printSheet()}>Print page / Save PDF</button>
            <button type="button" onClick={downloadBackup}>Download all pages</button>
            <button type="button" onClick={() => fileRef.current.click()}>Open backup</button>
            <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={openBackup} />
            <button type="button" onClick={resetSheet}>Clear page</button>
          </div>
          <p className="hint print-help">US Letter, portrait, 6 cards in 3 rows of 2 with 3 mm gaps. Print at <strong>100% / Actual size</strong>, with <strong>headers and footers off</strong>. All card colors are written as text for monochrome printing. Cut along the dashed lines.</p>
          <p className={`status${message.error ? " error" : ""}`} role="status" aria-live="polite">{message.text}</p>
          <p className="status notice" role="status" aria-live="polite">{overflowWarning}</p>
          <PageSelector
            pages={pages} selected={selectedPage} onSelect={selectPage}
            onRename={(name) => savePages(pages.map((page, index) => index === selectedPage ? { ...page, name } : page))}
            onAdd={addPage} onDuplicate={duplicatePage} onDelete={deletePage}
          />
          <CardSheet cards={cards} selected={selected} onSelect={setSelected} sheetRef={sheetRef} />
        </section>
      </main>
      <div className="all-pages-print" ref={allPagesRef} aria-hidden="true">
        {pages.map((page, index) => (
          <div className="print-page" key={index}>
            <CardSheet cards={page.cards} />
          </div>
        ))}
      </div>
      <footer className="hint">Your cards stay on this computer. Download a backup to keep or share them. To run again, use npm run dev.</footer>
    </div>
  );
}
