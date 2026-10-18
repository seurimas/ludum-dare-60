import React from "react";
import CircleSymbol from "./CircleSymbol.jsx";
import EnergyIcon from "./EnergyIcon.jsx";
import { ENERGY_TYPES } from "./energy.js";
import { CARD_COUNT } from "./cards.js";

export function getOverflowWarning(sheet) {
  const tooLong = [];
  sheet.querySelectorAll(".card").forEach((node, index) => {
    const fields = node.querySelectorAll(".card-content, .card-heading, .card-title, .card-tribe, .card-keywords, .card-center");
    if (Array.from(fields).some((field) =>
      field.scrollHeight > field.clientHeight + 1 || field.scrollWidth > field.clientWidth + 1)) {
      tooLong.push(index + 1);
    }
  });
  return tooLong.length
    ? `Content will be clipped on card${tooLong.length > 1 ? "s" : ""} ${tooLong.join(", ")}. Shorten the text or remove circles before printing.`
    : "";
}

function Card({ card, index, selected, onSelect }) {
  return (
    <div
      className={`card${card.component ? " component-card" : ""}${selected ? " selected" : ""}`}
      tabIndex={onSelect ? 0 : undefined}
      role={onSelect ? "button" : undefined}
      aria-label={`Edit card ${index + 1}${card.title ? ": " + card.title : ""}${card.component ? ", Component" : ", " + card.tribe}`}
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
      <div className="card-content">
        <div className="card-heading">
          <div className="card-name">
            <div className="card-title">{card.title}</div>
            {!card.component && <div className="card-tribe">{card.tribe}</div>}
          </div>
          {!card.component && (
            <div className="tribe-costs" aria-label={`${card.cost} ${card.tribe} cost`}>
              {Array.from({ length: card.cost }, (_, i) => (
                <span className="tribe-cost" key={i}>
                  <EnergyIcon symbol={ENERGY_TYPES.find((type) => type.name === card.tribe).symbol} />
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="card-center">
          {!card.component && <div className="card-keywords">{card.keywords}</div>}
          {card.circles.length > 0 && (
            <div className="circles" aria-label={`${card.circles.length} circles`}>
              {card.circles.map((circle, i) => <CircleSymbol circle={circle} key={i} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CardSheet({ cards, selected, onSelect, sheetRef }) {
  return (
    <div className="preview-scroll">
      <div className="sheet character-sheet" aria-label={`${CARD_COUNT}-card print preview`} ref={sheetRef}>
        {cards.map((card, index) => <Card key={index} card={card} index={index} selected={selected === index} onSelect={onSelect} />)}
      </div>
    </div>
  );
}
