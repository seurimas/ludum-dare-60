import React, { useEffect, useRef, useState } from "react";
import CardEditor from "./CardEditor.jsx";
import CardSheet, { getOverflowWarning } from "./CardSheet.jsx";
import { STORAGE_KEY, blankCard, blankPage, blankSheet, copyCard, copyPage, serializeBackup, validateBackup } from "./cards.js";
import PageSelector from "./PageSelector.jsx";

function loadSheet() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return {
      pages: saved ? validateBackup(JSON.parse(saved)) : [blankPage()],
      status: { text: saved ? "Restored your saved pages." : "Ready. Changes will be saved automatically.", error: false },
    };
  } catch (error) {
    return {
      pages: [blankPage()],
      status: { text: `Could not restore saved cards: ${error.message} You can open a downloaded backup.`, error: true },
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
  const sheetRef = useRef(null);
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
    if (!window.confirm(`Delete "${pages[selectedPage].name || "Untitled page"}" and its 12 cards? This cannot be undone.`)) return;
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
    if (!window.confirm("Clear all 12 cards on the selected page? Other pages and this page's name will be kept. Download a backup first if you want to keep these cards.")) return;
    save(blankSheet());
    setSelected(0);
    setMessage({ text: "Selected page cleared.", error: false });
  }

  function printSheet() {
    const warning = getOverflowWarning(sheetRef.current);
    setOverflowWarning(warning);
    if (warning && !window.confirm(warning + "\nPrint anyway?")) return;
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
    <>
      <header>
        <h1>Card Sheet Maker</h1>
        <p>12 cards per page. No account or internet needed once running.</p>
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
            <button type="button" className="primary" onClick={printSheet}>Print page / Save PDF</button>
            <button type="button" onClick={downloadBackup}>Download all pages</button>
            <button type="button" onClick={() => fileRef.current.click()}>Open backup</button>
            <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={openBackup} />
            <button type="button" onClick={resetSheet}>Clear page</button>
          </div>
          <p className="hint print-help">US Letter, portrait, 12 square cards (2.5 &times; 2.5 inches). Print at <strong>100% / Actual size</strong>, with <strong>headers and footers off</strong> and <strong>background graphics on</strong>. Cut along the dashed lines.</p>
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
      <footer className="hint">Your cards stay on this computer. Download a backup to keep or share them. To run again, use npm run dev.</footer>
    </>
  );
}
