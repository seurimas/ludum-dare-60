import React from "react";

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
      tabIndex={0}
      role="button"
      aria-label={`Edit card ${index + 1}${card.title ? ": " + card.title : ""}`}
      aria-pressed={selected}
      onClick={() => onSelect(index)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(index);
          requestAnimationFrame(() => document.getElementById("title").focus());
        }
      }}
    >
      <div className="card-heading">
        <div className="card-title">{card.title}</div>
        <div className="card-tribe">{card.tribe}</div>
      </div>
      <div className="card-center">
        <div className="card-keywords">{card.keywords}</div>
        {card.circles > 0 && (
          <div className="circles" aria-label={`${card.circles} circles`}>
            {Array.from({ length: card.circles }, (_, i) => <span className="circle" key={i} />)}
          </div>
        )}
      </div>
      <div className="card-costs">
        {card.costs.map((cost, i) => (
          <div className={`cost cost-${cost.color}`} aria-label={`${cost.number} ${cost.color}`} key={i}>{cost.number}</div>
        ))}
      </div>
    </div>
  );
}

export default function CardSheet({ cards, selected, onSelect, sheetRef }) {
  return (
    <div className="preview-scroll">
      <div className="sheet" aria-label="12-card print preview" ref={sheetRef}>
        {cards.map((card, index) => <Card key={index} card={card} index={index} selected={selected === index} onSelect={onSelect} />)}
      </div>
    </div>
  );
}
