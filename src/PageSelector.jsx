import React, { useRef, useState } from "react";

export default function PageSelector({ pages, selected, onSelect, onRename, onAdd, onDuplicate, onDelete }) {
  const dialogRef = useRef(null);
  const [newPageName, setNewPageName] = useState("");
  const currentName = pages[selected].name.trim() || "Untitled page";

  function openNewPage() {
    setNewPageName(`Page ${pages.length + 1}`);
    dialogRef.current.showModal();
    dialogRef.current.querySelector("input").select();
  }

  return (
    <section className="page-selector" aria-label="Page management">
      <div className="page-controls">
        <nav className="page-tabs" aria-label="Pages">
          <input
            className="page-tab current-page" aria-label="Page name" aria-current="page"
            title="Rename current page" placeholder="Untitled page"
            value={pages[selected].name} onChange={(event) => onRename(event.target.value)}
          />
          <select
            id="page-picker" className="page-tab" aria-label="Other pages"
            value="" disabled={pages.length === 1}
            onChange={(event) => onSelect(Number(event.target.value))}
          >
            <option value="" disabled>{pages.length === 1 ? "No other pages" : "Other pages"}</option>
            {pages.map((page, index) => index !== selected && (
              <option key={index} value={index}>{index + 1}. {page.name.trim() || "Untitled page"}</option>
            ))}
          </select>
          <button type="button" className="page-tab add-page" aria-label="Add page" aria-haspopup="dialog" onClick={openNewPage}>+</button>
        </nav>
        <button type="button" onClick={onDelete} disabled={pages.length === 1}>Delete page</button>
      </div>
      <dialog
        ref={dialogRef} className="new-page-dialog" aria-labelledby="new-page-heading"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            dialogRef.current.close();
          }
        }}
      >
        <form onSubmit={(event) => {
          event.preventDefault();
          if (!newPageName.trim()) return;
          dialogRef.current.close();
          onAdd(newPageName.trim());
        }}>
          <h2 id="new-page-heading">Create a new page</h2>
          <label htmlFor="new-page-name">New page name</label>
          <input id="new-page-name" required value={newPageName} onChange={(event) => setNewPageName(event.target.value)} />
          <p className="hint">Create a blank page, or duplicate the current page ({currentName}) with the name above.</p>
          <div className="actions">
            <button type="button" onClick={() => dialogRef.current.close()}>Cancel</button>
            <button type="button" disabled={!newPageName.trim()} onClick={() => {
              dialogRef.current.close();
              onDuplicate(newPageName.trim());
            }}>Duplicate page</button>
            <button type="submit" className="primary" disabled={!newPageName.trim()}>Create page</button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
