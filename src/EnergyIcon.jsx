import React from "react";

export default function EnergyIcon({ symbol }) {
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
