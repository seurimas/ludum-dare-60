import React from "react";

export function SymbolIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" className="symbol-icon" aria-hidden="true">
      {name === "eye" && <>
        <path d="M2 12 Q12 0 22 12 Q12 24 2 12Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </>}
      {name === "power" && <>
        <path d="M7 5 A9 9 0 1 0 17 5 M12 2 V12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </>}
      {name === "star" && <path d="m12 2 3 6.5 7 .9-5 5 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5-5 7-.9Z" fill="currentColor" />}
    </svg>
  );
}

export default function CircleSymbol({ circle }) {
  return (
    <span className="circle-symbol" role="img" aria-label={`${circle.value} circle${circle.icon ? ", eye above" : ""}${circle.star ? ", star below" : ""}`}>
      <span className="circle-decoration">{circle.icon && <SymbolIcon name={circle.icon} />}</span>
      <span className="circle">{circle.value}</span>
      <span className="circle-decoration">{circle.star && <SymbolIcon name="star" />}</span>
    </span>
  );
}
