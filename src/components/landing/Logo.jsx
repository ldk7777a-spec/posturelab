import React from "react";

const LOGO_URL = "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/bb74f7c9b_5cf409fd-d70f-4b83-a706-8dc518257056.png";

export default function Logo({ className = "h-9", dark = false }) {
  return (
    <img
      src={LOGO_URL}
      alt="PostureLab"
      className={className}
      style={dark ? { filter: "brightness(0) invert(1)" } : {}}
    />
  );
}