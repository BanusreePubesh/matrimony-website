import React from "react";

interface MercuryLogoIconProps {
  className?: string;
  size?: number | string;
  glow?: boolean;
}

export function MercuryLogoIcon({ className = "w-9 h-9", size, glow = true }: MercuryLogoIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: glow ? "drop-shadow(0px 2px 8px rgba(2, 132, 199, 0.25))" : "none" }}
    >
      <defs>
        {/* Top to bottom gradient for the globe facets */}
        <linearGradient id="globeGradNavy" x1="70" y1="5" x2="70" y2="135" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B1E40" />
          <stop offset="25%" stopColor="#1E3A8A" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="80%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#7DD3FC" />
        </linearGradient>
        <linearGradient id="mCenterGrad" x1="70" y1="35" x2="70" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F2C59" />
          <stop offset="50%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>

      {/* --- Spherical Diamond Grid Pattern (matching Mercury Softech sphere) --- */}

      {/* Row 1 (Top Pole) - Dark Navy */}
      <path d="M70,8 L76,16 L70,24 L64,16 Z" fill="#0B1E40" />
      <path d="M52,13 L58,21 L52,29 L46,21 Z" fill="#0E254A" />
      <path d="M88,13 L94,21 L88,29 L82,21 Z" fill="#0E254A" />
      <path d="M37,22 L43,30 L37,38 L31,30 Z" fill="#12315E" />
      <path d="M103,22 L109,30 L103,38 L97,30 Z" fill="#12315E" />

      {/* Row 2 (Upper Hemisphere) - Royal Blue */}
      <path d="M70,27 L77,36 L70,45 L63,36 Z" fill="#163C70" />
      <path d="M50,29 L57,38 L50,47 L43,38 Z" fill="#18437A" />
      <path d="M90,29 L97,38 L90,47 L83,38 Z" fill="#18437A" />
      <path d="M28,38 L34,47 L28,56 L22,47 Z" fill="#1B4D8C" />
      <path d="M112,38 L118,47 L112,56 L106,47 Z" fill="#1B4D8C" />
      <path d="M15,58 L20,66 L15,74 L10,66 Z" fill="#1E579E" />
      <path d="M125,58 L130,66 L125,74 L120,66 Z" fill="#1E579E" />

      {/* Row 3 (Equatorial Sides) - Ocean Blue */}
      <path d="M21,62 L28,71 L21,80 L14,71 Z" fill="#0284C7" />
      <path d="M119,62 L126,71 L119,80 L112,71 Z" fill="#0284C7" />

      {/* Row 4 (Lower Hemisphere) - Sky Blue */}
      <path d="M16,82 L22,90 L16,98 L10,90 Z" fill="#0369A1" />
      <path d="M124,82 L130,90 L124,98 L118,90 Z" fill="#0369A1" />
      <path d="M29,88 L36,97 L29,106 L22,97 Z" fill="#0284C7" />
      <path d="M111,88 L118,97 L111,106 L104,97 Z" fill="#0284C7" />

      {/* Row 5 (Bottom South Pole) - Cyan / Light Blue */}
      <path d="M43,102 L50,111 L43,120 L36,111 Z" fill="#38BDF8" />
      <path d="M97,102 L104,111 L97,120 L90,111 Z" fill="#38BDF8" />
      <path d="M58,110 L64,118 L58,126 L52,118 Z" fill="#56C6FF" />
      <path d="M82,110 L88,118 L82,126 L76,118 Z" fill="#56C6FF" />
      <path d="M70,116 L76,124 L70,132 L64,124 Z" fill="#7DD3FC" />

      {/* --- Central Embedded 'M' Emblem (Geometric Faceted structure) --- */}

      {/* Left Column / Stem */}
      <path d="M46,47 L53,47 L53,92 L46,92 Z" fill="url(#mCenterGrad)" />
      <path d="M46,47 L53,47 L49.5,40 Z" fill="#0B1E40" />
      
      {/* Right Column / Stem */}
      <path d="M87,47 L94,47 L94,92 L87,92 Z" fill="url(#mCenterGrad)" />
      <path d="M87,47 L94,47 L90.5,40 Z" fill="#0B1E40" />

      {/* Diagonal V Shapes meeting in center */}
      <path d="M53,47 L70,76 L63,76 L48,54 Z" fill="#163C70" />
      <path d="M87,47 L70,76 L77,76 L92,54 Z" fill="#163C70" />

      {/* Inner V Diamond Core */}
      <path d="M70,76 L62,64 L78,64 Z" fill="#0284C7" />
      <path d="M70,76 L64,84 L76,84 Z" fill="#38BDF8" />
      
      {/* Accent Facets on the M */}
      <path d="M53,62 L60,70 L53,78 Z" fill="#0284C7" />
      <path d="M87,62 L80,70 L87,78 Z" fill="#0284C7" />
      <path d="M70,42 L76,50 L70,58 L64,50 Z" fill="#0F2C59" />
    </svg>
  );
}

export default MercuryLogoIcon;
