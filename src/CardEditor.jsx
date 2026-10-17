import React, { useEffect, useState } from "react";
import { CARD_COUNT, COLORS } from "./cards.js";
import CircleEditor from "./CircleEditor.jsx";

function CostNumber({ number, index, onChange, onError }) {
  const [draft, setDraft] = useState(String(number));
  useEffect(() => setDraft(String(number)), [number]);

  return (
    <input
      type="number" min="1" max="999" step="1" required
      aria-label={`Cost ${index + 1} number`}
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
        if (event.target.checkValidity()) {
          onChange(event.target.valueAsNumber);
        } else {
          event.target.reportValidity();
        }
      }}
      onBlur={(event) => {
        if (!event.target.checkValidity()) {
          setDraft(String(number));
          onError("The invalid cost was not saved. Costs must be whole numbers from 1 to 999.");
        }
      }}
    />
  );
}

export default function CardEditor({ card, selected, onSelect, onChange, onCopy, onClear, onError, saveStatus }) {
  const changeCost = (index, patch) => {
    onChange({ costs: card.costs.map((cost, i) => i === index ? { ...cost, ...patch } : cost) });
  };

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
        <label htmlFor="card-color">Card color</label>
        <select id="card-color" value={card.color} onChange={(event) => onChange({ color: event.target.value })}>
          {COLORS.map((color) => <option key={color} value={color}>{color[0].toUpperCase() + color.slice(1)}</option>)}
        </select>
      </div>
      {[
        ["title", "Title", "Card title"],
        ["tribe", "Tribe", "Tribe"],
        ["keywords", "Keywords", "Enter keywords or rules, one per line"],
      ].map(([key, label, placeholder]) => (
        <div className="field" key={key}>
          <label htmlFor={key}>{label}</label>
          {key === "keywords" ? (
            <textarea id={key} placeholder={placeholder} value={card[key]} onChange={(event) => onChange({ [key]: event.target.value })} />
          ) : (
            <input id={key} placeholder={placeholder} autoComplete="off" value={card[key]} onChange={(event) => onChange({ [key]: event.target.value })} />
          )}
        </div>
      ))}
      <CircleEditor circles={card.circles} onChange={(circles) => onChange({ circles })} />
      <fieldset>
        <legend>Cost (1-5 labeled rectangles)</legend>
        {card.costs.map((cost, index) => (
          <div className="cost-row" key={index}>
            <select aria-label={`Cost ${index + 1} color`} value={cost.color} onChange={(event) => changeCost(index, { color: event.target.value })}>
              {COLORS.map((color) => <option key={color} value={color}>{color[0].toUpperCase() + color.slice(1)}</option>)}
            </select>
            <CostNumber number={cost.number} index={index} onChange={(number) => changeCost(index, { number })} onError={onError} />
            <button type="button" aria-label={`Remove cost ${index + 1}`} disabled={card.costs.length === 1} onClick={() => onChange({ costs: card.costs.filter((_, i) => i !== index) })}>X</button>
          </div>
        ))}
        <button type="button" disabled={card.costs.length === 5} onClick={() => onChange({
          costs: [...card.costs, {
            color: COLORS.find((color) => !card.costs.some((cost) => cost.color === color)) || "white",
            number: 1,
          }],
        })}>+ Add cost</button>
      </fieldset>
      <div className="actions">
        <button type="button" disabled={selected === CARD_COUNT - 1} onClick={onCopy}>Copy to next card</button>
        <button type="button" onClick={onClear}>Clear card</button>
      </div>
      <p className="hint">Click any card to edit it. Changes are saved in this browser automatically. Download a backup to keep or share your edits.</p>
      <p className={`status${saveStatus.error ? " error" : ""}`} role="status" aria-live="polite">{saveStatus.text}</p>
    </section>
  );
}
