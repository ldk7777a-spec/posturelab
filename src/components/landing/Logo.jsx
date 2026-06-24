import React from "react";

export default function Logo({ className = "h-9", dark = false }) {
  const textColor = dark ? "#FFFFFF" : "#1A1A2E";
  return (
    <svg
      className={className}
      viewBox="0 0 220 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Spine-P icon */}
      {/* Top circle dot */}
      <circle cx="22" cy="6" r="3.5" fill="#FF6B4A" />
      {/* Top horizontal bar */}
      <line x1="22" y1="9.5" x2="35" y2="9.5" stroke="#FF6B4A" strokeWidth="3.2" strokeLinecap="round" />
      {/* Top-right circle */}
      <circle cx="35" cy="9.5" r="3.5" fill="#FF6B4A" />
      {/* Vertical spine line */}
      <line x1="22" y1="6" x2="22" y2="42" stroke="#FF6B4A" strokeWidth="3.2" strokeLinecap="round" />
      {/* P belly – top horizontal */}
      <line x1="22" y1="21" x2="35" y2="21" stroke="#FF6B4A" strokeWidth="3.2" strokeLinecap="round" />
      {/* P belly right circle */}
      <circle cx="35" cy="21" r="3.5" fill="#FF6B4A" />
      {/* P belly bottom arc connector */}
      <path d="M35 9.5 Q44 15.3 35 21" stroke="#FF6B4A" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      {/* Bottom-left fork */}
      <line x1="22" y1="42" x2="14" y2="48" stroke="#FF6B4A" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="11" cy="48.5" r="3.5" fill="#FF6B4A" />
      {/* Bottom-right fork */}
      <line x1="22" y1="42" x2="30" y2="48" stroke="#FF6B4A" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="33" cy="48.5" r="3.5" fill="#FF6B4A" />

      {/* "Posture" text */}
      <text
        x="52"
        y="37"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="26"
        fontWeight="700"
        fill={textColor}
        letterSpacing="-0.5"
      >
        Posture
      </text>
      {/* "Lab" text */}
      <text
        x="163"
        y="37"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="26"
        fontWeight="400"
        fill={textColor}
        letterSpacing="-0.5"
      >
        Lab
      </text>
    </svg>
  );
}