import React from "react";
import EnergyIcon from "./EnergyIcon.jsx";
import { ENERGY_TYPES } from "./energy.js";

export default function CircleSymbol({ circle }) {
  const tribe = ENERGY_TYPES.find((type) => type.name === circle.content);
  return (
    <span className="circle-symbol" role="img" aria-label={`${circle.content} circle`}>
      <span className="circle">
        {tribe ? <EnergyIcon symbol={tribe.symbol} /> : circle.content === "equal" ? "=" : circle.content === "asterisk" ? "*" : null}
      </span>
    </span>
  );
}
