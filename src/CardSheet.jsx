import React from "react";
import CircleSymbol from "./CircleSymbol.jsx";
import EnergyIcon from "./EnergyIcon.jsx";
import { ENERGY_TYPES } from "./energy.js";
import { ATTACHABLE_SLOTS, CARD_COUNT, RELIC_BOX_COUNTS, RELIC_SECTIONS, SYMBOL_TRIBES } from "./cards.js";

export function getOverflowWarning(sheet) {
  const tooLong = [];
  const conflicts = [];
  sheet.querySelectorAll(".card").forEach((node, index) => {
    const fields = node.querySelectorAll(".card-content, .card-heading, .card-title, .card-tribe, .card-keywords, .card-center, .card-attachable-text, .relic-text");
    const markers = Array.from(node.querySelectorAll(".card-attachable-left, .card-attachable-right"), (marker) => marker.getBoundingClientRect());
    const text = node.querySelector(".card-keywords");
    let overlapsMarker = false;
    if (markers.length && text?.textContent) {
      const range = document.createRange();
      range.selectNodeContents(text);
      overlapsMarker = Array.from(range.getClientRects()).some((line) => markers.some((marker) =>
        line.left < marker.right && line.right > marker.left && line.top < marker.bottom && line.bottom > marker.top));
    }
    if (overlapsMarker || Array.from(fields).some((field) =>
      field.scrollHeight > field.clientHeight + 1 || field.scrollWidth > field.clientWidth + 1)) {
      tooLong.push(index + 1);
    }
    if (markers.length && node.querySelector(".circles")) conflicts.push(index + 1);
  });
  return [
    tooLong.length ? `Content will be clipped or overlap a side marker on card${tooLong.length > 1 ? "s" : ""} ${tooLong.join(", ")}. Shorten the text or remove circles before printing.` : "",
    conflicts.length ? `Card${conflicts.length > 1 ? "s" : ""} ${conflicts.join(", ")} ha${conflicts.length > 1 ? "ve" : "s"} both circles and side markers; use one or the other.` : "",
  ].filter(Boolean).join(" ");
}

function RelicContent({ card }) {
  return (
    <div className="relic-content">
      <div className="card-heading">
        <div className="card-name">
          <div className="card-title">{card.title}</div>
        </div>
      </div>
      <div className="relic-sections">
        {RELIC_SECTIONS.map((section) => (
          <div className={`relic-section relic-section-${section}`} key={section}>
            <div className="relic-text">{card.relicText?.[section] ?? ""}</div>
            <div className="relic-boxes" aria-label={`${RELIC_BOX_COUNTS[section]} boxes`}>
              {Array.from({ length: RELIC_BOX_COUNTS[section] }, (_, i) => <span className="relic-box" key={i} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StandardContent({ card, slots }) {
  return (
    <div className="card-content">
      <div className="card-heading">
        <div className="card-name">
          <div className="card-title">{card.title}</div>
          {!card.component && <div className="card-tribe">{card.tribe}</div>}
        </div>
        {!card.component && card.tribe !== "Starter" && (
          card.tribe === "Omni" ? (
            <div className="tribe-costs" aria-label={`${card.cost} Omni cost: 1 of each tribe plus ${Math.max(card.cost - SYMBOL_TRIBES.length, 0)} empty`}>
              {SYMBOL_TRIBES.map((tribe) => (
                <span className="tribe-cost" key={tribe}>
                  <EnergyIcon symbol={ENERGY_TYPES.find((type) => type.name === tribe).symbol} />
                </span>
              ))}
              {Array.from({ length: Math.max(card.cost - SYMBOL_TRIBES.length, 0) }, (_, i) => (
                <span className="tribe-cost" key={`empty-${i}`} />
              ))}
            </div>
          ) : (
            <div className="tribe-costs" aria-label={`${card.cost} ${card.tribe} cost`}>
              {Array.from({ length: card.cost }, (_, i) => (
                <span className="tribe-cost" key={i}>
                  <EnergyIcon symbol={ENERGY_TYPES.find((type) => type.name === card.tribe).symbol} />
                </span>
              ))}
            </div>
          )
        )}
      </div>
      <div className="card-center">
        <div className="card-keywords">{card.keywords}</div>
        {card.circles.length > 0 && (
          <div className="circles" aria-label={`${card.circles.length} circles`}>
            {card.circles.map((circle, i) => <CircleSymbol circle={circle} key={i} />)}
          </div>
        )}
      </div>
      {slots.map((slot) => (
        <div className={`card-attachable card-attachable-${slot}`} key={slot}>
          <div className="card-attachable-text">{card.attachables[slot]}</div>
        </div>
      ))}
    </div>
  );
}

function Card({ card, index, selected, onSelect }) {
  const slots = (card.component || card.relic) ? [] : ATTACHABLE_SLOTS.filter((slot) => card.attachables?.[slot]?.trim());
  return (
    <div
      className={`card${card.component ? " component-card" : ""}${card.relic ? " relic-card" : ""}${selected ? " selected" : ""}${slots.map((slot) => ` has-attachable-${slot}`).join("")}`}
      tabIndex={onSelect ? 0 : undefined}
      role={onSelect ? "button" : undefined}
      aria-label={`Edit card ${index + 1}${card.title ? ": " + card.title : ""}${card.relic ? ", Relic" : card.component ? ", Component" : ", " + card.tribe}`}
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
      {card.relic ? <RelicContent card={card} /> : <StandardContent card={card} slots={slots} />}
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
