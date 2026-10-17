import React, { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { createEnergyPages, ENERGY_TYPES } from "./energy.js";
import "./energy.css";

function EnergyIcon({ symbol }) {
  return (
    <svg className="energy-icon" viewBox="0 0 64 64" role="img" aria-label={symbol}>
      {symbol === "peace" && (
        <g fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
          <circle cx="32" cy="32" r="27" />
          <path d="M32 5V59 M32 32 13 51 M32 32 51 51" />
        </g>
      )}
      {symbol === "wooden club" && (
        <g transform="rotate(35 32 32)" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
          <path d="M22 5Q32 1 42 5Q49 12 44 26L37 42 37 56Q37 60 32 60T27 56L27 42 20 26Q15 12 22 5Z" />
          <ellipse cx="36" cy="15" rx="2.5" ry="5" transform="rotate(-25 36 15)" />
        </g>
      )}
      {symbol === "interrobang" && (
        <text x="32" y="50" textAnchor="middle" fontFamily="Georgia, serif" fontSize="56" fill="currentColor">&#8253;</text>
      )}
    </svg>
  );
}

function EnergyCard({ card }) {
  return (
    <article className={`energy-card${card.types.length === 2 ? " split-energy" : ""}`}
      aria-label={`${card.types.join(" / ")} energy`}>
      {["top-left", "top-right", "bottom-left", "bottom-right"].map((corner) => (
        <div className={`energy-corner energy-corner-${corner}`} key={corner} aria-hidden="true">
          {card.types.map((name, index) => (
            <React.Fragment key={name}>
              {index > 0 && <span className="energy-corner-slash">/</span>}
              <EnergyIcon symbol={ENERGY_TYPES.find((type) => type.name === name).symbol} />
            </React.Fragment>
          ))}
        </div>
      ))}
      <div className="energy-card-label">Energy</div>
      <div className="energy-types">
        {card.types.map((name) => (
          <div className="energy-type" key={name}>
            <EnergyIcon symbol={ENERGY_TYPES.find((type) => type.name === name).symbol} />
            <span>{name}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function EnergyPage() {
  const pages = createEnergyPages();
  const [printing, setPrinting] = useState(false);

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

  function printEnergy() {
    flushSync(() => setPrinting(true));
    window.print();
  }

  return (
    <div className={`energy-app${printing ? " energy-print-mode" : ""}`}>
      <header>
        <h1>Energy cards</h1>
        <p>36 cards on {pages.length} sheets: 24 single energy and 12 split energy. Every card provides 1 energy.</p>
        <a className="header-link" href="/">Card Sheet Maker</a>
      </header>
      <main className="energy-main">
        <div className="toolbar">
          <button type="button" className="primary" onClick={printEnergy}>Print all cards / Save PDF</button>
        </div>
        <p className="hint print-help">US Letter, portrait. Print at <strong>100% / Actual size</strong> with headers and footers off. Each card is 2 x 3 inches; 9 cards per sheet with 3 mm gaps. Cut along the dashed borders.</p>
        {pages.map((page, index) => (
          <section className="energy-page" key={page.name} aria-label={page.name}>
            <h2 className="energy-page-heading">Sheet {index + 1}: {page.name}</h2>
            <div className="preview-scroll">
              <div className="sheet energy-sheet" aria-label={`${page.name}: ${page.cards.length} cards`}>
                {page.cards.map((card, i) => <EnergyCard card={card} key={i} />)}
              </div>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
