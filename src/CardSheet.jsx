import React from "react";
import CircleSymbol, { SymbolIcon } from "./CircleSymbol.jsx";
import { CARD_COUNT } from "./cards.js";

export function getOverflowWarning(sheet) {
  const tooLong = [];
  sheet.querySelectorAll(".card").forEach((node, index) => {
    const fields = node.querySelectorAll(".card-title, .card-tribe, .card-keywords");
    if (node.scrollHeight > node.clientHeight + 1 ||
        Array.from(fields).some((field) => field.scrollHeight > field.clientHeight + 1)) {
      tooLong.push(index + 1);
    }
  });
  return tooLong.length
    ? `Text will be clipped on card${tooLong.length > 1 ? "s" : ""} ${tooLong.join(", ")}. Shorten the text before printing.`
    : "";
}

function Card({ card, index, selected, onSelect }) {
  return (
    <div
      className={`card${selected ? " selected" : ""}`}
      tabIndex={onSelect ? 0 : undefined}
      role={onSelect ? "button" : undefined}
      aria-label={`Edit card ${index + 1}${card.title ? ": " + card.title : ""}, ${card.color}`}
      aria-pressed={onSelect ? selected : undefined}
      onClick={onSelect ? () => onSelect(index) : undefined}
      onKeyDown={onSelect ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(index);
          requestAnimationFrame(() => document.getElementById("title").focus());
        }
      } : undefined}
    >
      <div className="card-watermark" aria-hidden="true">{card.color}</div>
      {["top", "right", "bottom", "left"].map((edge) => (
        <div key={edge} className={`card-edge card-edge-${edge}`} aria-hidden="true">
          {Array.from({ length: 8 }, () => card.color).join("  ")}
        </div>
      ))}
      <div className="card-heading">
        <div className="card-title">{card.title}</div>
        <div className="card-tribe">{card.tribe}</div>
      </div>
      <div className="card-center">
        <div className="card-keywords">{card.keywords}</div>
        <div className="circles" aria-label={`${card.circles.length} circles and power`}>
          {card.circles.map((circle, i) => <CircleSymbol circle={circle} key={i} />)}
          <span className="row-power" role="img" aria-label="Power"><SymbolIcon name="power" /></span>
        </div>
      </div>
      <div className="card-costs">
        {card.costs.map((cost, i) => (
          <div className="cost" aria-label={`${cost.number} ${cost.color}`} key={i}>
            <span className="cost-number">{cost.number}</span>
            <span className="cost-color">{cost.color}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CardSheet({ cards, selected, onSelect, sheetRef }) {
  return (
    <div className="preview-scroll">
      <div className="sheet" aria-label={`${CARD_COUNT}-card print preview`} ref={sheetRef}>
        {cards.map((card, index) => <Card key={index} card={card} index={index} selected={selected === index} onSelect={onSelect} />)}
      </div>
    </div>
  );
}
