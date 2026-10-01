import React from 'react';
import { Car } from '../types';

interface VehicleArtworkProps {
  car: Car;
  className?: string;
}

/** Lightweight car-shaped artwork for collection cards and WebGL fallback surfaces. */
export const VehicleArtwork: React.FC<VehicleArtworkProps> = ({ car, className = 'h-full w-full' }) => {
  const id = car.id.replace(/[^a-z0-9_-]/gi, '-');
  const monster = car.modelType === 'monster';
  const wheelY = monster ? 126 : 130;
  const wheelR = monster ? 25 : 19;

  return (
    <svg className={className} viewBox="0 0 360 180" role="img" aria-label={`سيارة ${car.name}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`${id}-paint`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={car.secondaryColor} stopOpacity="0.92" />
          <stop offset="0.34" stopColor={car.color} />
          <stop offset="0.72" stopColor={car.color} />
          <stop offset="1" stopColor={car.secondaryColor} />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e0f2fe" stopOpacity="0.88" />
          <stop offset="0.42" stopColor="#38bdf8" stopOpacity="0.6" />
          <stop offset="1" stopColor="#0b1220" stopOpacity="0.94" />
        </linearGradient>
        <linearGradient id={`${id}-ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={car.color} stopOpacity="0.28" />
          <stop offset="1" stopColor={car.color} stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-20%" y="-40%" width="140%" height="190%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <ellipse cx="185" cy="151" rx="143" ry="13" fill="#020617" opacity="0.65" filter={`url(#${id}-shadow)`} />
      {car.modelType === 'cyber' && <ellipse cx="190" cy="147" rx="112" ry="13" fill={`url(#${id}-ground)`} />}
      <g>
        {monster && <path d="M45 92 L56 81 L318 81 L333 95 L331 108 L44 108 Z" fill={car.secondaryColor} stroke="#ffffff" strokeOpacity=".18" strokeWidth="2" />}
        {(car.modelType === 'sport' || car.modelType === 'drift' || car.modelType === 'cyber') && (
          <g fill={car.secondaryColor} stroke="#cbd5e1" strokeOpacity=".18" strokeWidth="2">
            <path d="M60 78 L48 65 L44 62 L43 80 L63 87 Z" />
            <path d="M43 62 L73 62 L72 67 L44 67 Z" />
          </g>
        )}
        <path d="M24 121 L31 104 Q34 96 47 92 L77 84 L103 62 Q112 54 128 51 L154 34 Q162 29 176 29 L222 34 Q239 37 254 55 L276 79 L317 88 Q337 93 343 108 L347 124 L333 138 L25 138 Z" fill={`url(#${id}-paint)`} stroke="#e2e8f0" strokeOpacity=".56" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M106 61 L130 47 L158 31 Q165 27 177 28 L218 33 Q233 36 246 53 L264 76 L219 75 L203 49 Q199 44 189 43 L159 41 L135 62 Z" fill={`url(#${id}-glass)`} stroke="#dbeafe" strokeOpacity=".52" strokeWidth="2" />
        <path d="M164 39 L166 74 L222 75 L204 49 Q200 44 189 43 Z" fill="#0f172a" fillOpacity=".64" />
        <path d="M75 87 L294 85" fill="none" stroke="#ffffff" strokeOpacity=".38" strokeWidth="3" />
        <path d="M124 79 L132 119 M223 79 L231 120" fill="none" stroke={car.secondaryColor} strokeOpacity=".82" strokeWidth="3" />
        <path d="M282 87 L317 93 Q330 98 336 108 L305 108 L291 101 Z" fill={car.secondaryColor} fillOpacity=".7" />
        <path d="M31 108 L51 105 L48 116 L27 118 Z" fill="#fb7185" stroke="#fecdd3" strokeOpacity=".7" strokeWidth="2" />
        <path d="M326 103 L340 106 L344 116 L322 114 Z" fill="#fef3c7" stroke="#fff7ed" strokeOpacity=".9" strokeWidth="2" />
        <path d="M54 134 L323 134 L315 143 L65 143 Z" fill={car.secondaryColor} fillOpacity=".88" />
        {[82, 277].map((x) => (
          <g key={x}>
            <circle cx={x} cy={wheelY} r={wheelR + 5} fill="#080b12" stroke="#64748b" strokeWidth="3" />
            <circle cx={x} cy={wheelY} r={wheelR - 4} fill="#1f2937" stroke="#cbd5e1" strokeOpacity=".8" strokeWidth="3" />
            <circle cx={x} cy={wheelY} r={wheelR * 0.25} fill={car.color} stroke="#e2e8f0" strokeOpacity=".72" strokeWidth="2" />
            <path d={`M${x - 1} ${wheelY - wheelR + 2} L${x + 1} ${wheelY + wheelR - 2} M${x - wheelR + 2} ${wheelY - 1} L${x + wheelR - 2} ${wheelY + 1}`} stroke="#94a3b8" strokeOpacity=".8" strokeWidth="2" />
          </g>
        ))}
        <path d="M50 117 L69 117 M304 119 L332 120" stroke="#f8fafc" strokeOpacity=".8" strokeWidth="2" />
        <path d="M101 137 L256 137" stroke="#ffffff" strokeOpacity=".34" strokeWidth="2" />
      </g>
    </svg>
  );
};
