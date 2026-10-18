import React from "react";
import { blankCircle, CIRCLE_CONTENTS, MAX_CIRCLES, CIRCLE_SHORTCUTS, applyCircleShortcut } from "./cards.js";
import CircleSymbol from "./CircleSymbol.jsx";

const labels = { empty: "Empty", equal: "Equal (=)", asterisk: "Asterisk (*)" };

export default function CircleEditor({ circles, tribe, locked = false, onChange }) {
  return (
    <fieldset>
      <legend>Circles ({circles.length}/{MAX_CIRCLES})</legend>
      <div className="circle-presets" role="group" aria-label="Circle shortcuts">
        {CIRCLE_SHORTCUTS.map((name) => (
          <button key={name} type="button" disabled={(name === "special" && circles.length === 0) || (locked && name !== "special") || (tribe === "Starter" && name.endsWith("tribe"))}
            onClick={() => onChange(applyCircleShortcut(name, circles, tribe))}>{name}</button>
        ))}
      </div>
      {circles.map((circle, index) => (
        <div className="circle-editor-row" key={index}>
          <CircleSymbol circle={circle} />
          <select aria-label={`Circle ${index + 1} contents`} value={circle.content} onChange={(event) =>
            onChange(circles.map((item, i) => i === index ? { ...item, content: event.target.value } : item))
          }>
            {CIRCLE_CONTENTS.map((content) => <option key={content} value={content}>{labels[content] || content}</option>)}
          </select>
          <button type="button" aria-label={`Remove circle ${index + 1}`} onClick={() => onChange(circles.filter((_, i) => i !== index))}>X</button>
        </div>
      ))}
      <button type="button" disabled={locked || circles.length >= MAX_CIRCLES} onClick={() => onChange([...circles, blankCircle()])}>+ Add circle</button>
      {locked && <p className="hint">This card has side markers, so circles can't be added. Clear the left and right attachables to use circles.</p>}
      <p className="hint">Circles print at 2 cm diameter and wrap as needed. {tribe === "Starter" ? "Starter has no tribe shortcuts." : `Tribe shortcuts use ${tribe}.`} Special changes all current circles to asterisks.</p>
    </fieldset>
  );
}
