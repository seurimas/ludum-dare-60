import React from "react";
import { blankCircle, CIRCLE_VALUES, MAX_CIRCLES, CIRCLE_PRESETS, createCirclePreset } from "./cards.js";
import CircleSymbol, { SymbolIcon } from "./CircleSymbol.jsx";

export default function CircleEditor({ circles, onChange }) {
  const update = (index, patch) => onChange(circles.map((circle, i) => i === index ? { ...circle, ...patch } : circle));

  return (
    <fieldset>
      <legend>Circles ({circles.length}/{MAX_CIRCLES})</legend>
      <div className="circle-presets" role="group" aria-label="Circle configurations">
        {Object.entries(CIRCLE_PRESETS).map(([name, preset]) => (
          <button
            key={name} type="button" title={preset.map((circle) => `${circle.value}${circle.icon ? " + eye" : ""}${circle.star ? " + star" : ""}`).join("; ")}
            aria-pressed={JSON.stringify(circles) === JSON.stringify(preset)}
            onClick={() => onChange(createCirclePreset(name))}
          >{name}</button>
        ))}
      </div>
      {circles.map((circle, index) => (
        <div className="circle-editor-row" key={index}>
          <CircleSymbol circle={circle} />
          <select aria-label={`Circle ${index + 1} value`} value={circle.value ?? ""} onChange={(event) => update(index, {
            value: Number(event.target.value),
          })}>
            {CIRCLE_VALUES.map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
          <button type="button" className="icon-toggle" aria-label={`Circle ${index + 1} star`} title="Star below" aria-pressed={circle.star} onClick={() => update(index, { star: !circle.star })}>
            <SymbolIcon name="star" />
          </button>
          <select aria-label={`Circle ${index + 1} icon above`} value={circle.icon ?? ""} onChange={(event) => update(index, { icon: event.target.value || null })}>
            <option value="">No icon</option>
            <option value="eye">Eye</option>
          </select>
          <button type="button" aria-label={`Remove circle ${index + 1}`} onClick={() => onChange(circles.filter((_, i) => i !== index))}>X</button>
        </div>
      ))}
      <button type="button" disabled={circles.length >= MAX_CIRCLES} onClick={() => onChange([...circles, blankCircle()])}>+ Add circle</button>
      <p className="hint">A half-size power symbol is automatically placed at the end of the row.</p>
    </fieldset>
  );
}
