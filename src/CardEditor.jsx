import React from "react";
import { ATTACHABLE_SLOTS, blankAttachables, CARD_COUNT, TRIBES, hasCircleSideConflict, hasSideAttachables, setComponent } from "./cards.js";
import CircleEditor from "./CircleEditor.jsx";

export default function CardEditor({ card, selected, onSelect, onChange, onCopy, onClear, saveStatus }) {
  return (
    <section className="editor" aria-label="Card editor">
      <h2>Edit a card</h2>
      <div className="navigation">
        <button type="button" aria-label="Previous card" disabled={selected === 0} onClick={() => onSelect(selected - 1)}>Previous</button>
        <select aria-label="Card to edit" value={selected} onChange={(event) => onSelect(Number(event.target.value))}>
          {Array.from({ length: CARD_COUNT }, (_, index) => <option key={index} value={index}>Card {index + 1}</option>)}
        </select>
        <button type="button" aria-label="Next card" disabled={selected === CARD_COUNT - 1} onClick={() => onSelect(selected + 1)}>Next</button>
      </div>
      <div className="field">
        <label htmlFor="title">Name</label>
        <input id="title" placeholder="Card name" autoComplete="off" value={card.title} onChange={(event) => onChange({ title: event.target.value })} />
      </div>
      <div className="field">
        <label className="component-toggle">
          <input type="checkbox" checked={card.component} onChange={(event) => onChange(setComponent(card, event.target.checked))} />
          Component
        </label>
      </div>
      {!card.component && <>
        <div className="field">
          <label htmlFor="tribe">Tribe</label>
          <select id="tribe" value={card.tribe} onChange={(event) => onChange({ tribe: event.target.value })}>
            {TRIBES.map((tribe) => <option key={tribe}>{tribe}</option>)}
          </select>
        </div>
        {card.tribe !== "Starter" && <div className="field">
          <label htmlFor="card-cost">Cost (tribe symbols)</label>
          <select id="card-cost" value={card.cost} onChange={(event) => onChange({ cost: Number(event.target.value) })}>
            {[3, 4, 5, 6].map((cost) => <option key={cost} value={cost}>{cost}</option>)}
          </select>
        </div>}
      </>}
      <div className="field">
        <label htmlFor="keywords">Text{card.component ? " (optional)" : ""}</label>
        <textarea id="keywords" placeholder={card.component ? "Optional component text" : "Rules or other text"} value={card.keywords} onChange={(event) => onChange({ keywords: event.target.value })} />
      </div>
      {!card.component && <>
        <fieldset>
          <legend>Attachables</legend>
          {ATTACHABLE_SLOTS.map((slot) => {
            const blocked = slot !== "bottom" && card.circles.length > 0 && !card.attachables?.[slot];
            return (
            <div className="field" key={slot}>
              <label htmlFor={`attachable-${slot}`}>{slot[0].toUpperCase() + slot.slice(1)} attachable</label>
              <input id={`attachable-${slot}`} disabled={blocked} placeholder={blocked ? "Remove circles to use side markers" : ""} value={card.attachables?.[slot] ?? ""} onChange={(event) => onChange({
                attachables: { ...(card.attachables ?? blankAttachables()), [slot]: event.target.value },
              })} />
            </div>
            );
          })}
          {hasCircleSideConflict(card) && <p className="notice">This card has both circles and side markers. Remove one of them.</p>}
        </fieldset>
      </>}
      {card.component && <div className="field">
        <label htmlFor="shortcut-tribe">Shortcut tribe (not printed)</label>
        <select id="shortcut-tribe" value={card.tribe} onChange={(event) => onChange({ tribe: event.target.value })}>
          {TRIBES.map((tribe) => <option key={tribe}>{tribe}</option>)}
        </select>
      </div>}
      <CircleEditor circles={card.circles} tribe={card.tribe} locked={hasSideAttachables(card)} onChange={(circles) => onChange({ circles })} />
      {card.component && <p className="hint">Landscape content in the same portrait cut outline. Tribe, cost, and attachables are hidden; their values are kept when switching back.</p>}
      <div className="actions">
        <button type="button" disabled={selected === CARD_COUNT - 1} onClick={onCopy}>Copy to next card</button>
        <button type="button" onClick={onClear}>Clear card</button>
      </div>
      <p className="hint">Click any card to edit it. Changes are saved in this browser automatically. Download a backup to keep or share your edits.</p>
      <p className={`status${saveStatus.error ? " error" : ""}`} role="status" aria-live="polite">{saveStatus.text}</p>
    </section>
  );
}
