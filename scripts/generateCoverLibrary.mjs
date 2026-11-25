import fs from 'node:fs';
import path from 'node:path';

const OUT_ROOT = path.resolve(process.cwd(), 'public', 'assets', 'covers-library');

function buildSvg({ bg1, bg2, accent, accent2, glowX = 560, glowY = 170, pattern = 'grid', art }) {
  const patternDef =
    pattern === 'dots'
      ? `<pattern id="pat" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="${accent}" opacity="0.13"/></pattern>`
      : pattern === 'diag'
        ? `<pattern id="pat" width="32" height="32" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="32" stroke="${accent}" stroke-width="1" opacity="0.09"/></pattern>`
        : pattern === 'rings'
          ? `<pattern id="pat" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="24" fill="none" stroke="${accent}" stroke-width="0.9" opacity="0.08"/></pattern>`
          : `<pattern id="pat" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="${accent}" stroke-width="0.8" opacity="0.09"/></pattern>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.34"/>
      <stop offset="65%" stop-color="${accent}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent2}" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="${accent2}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${accent2}"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.03"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E2E8F0"/>
      <stop offset="50%" stop-color="#94A3B8"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#040914" flood-opacity="0.55"/>
    </filter>
    ${patternDef}
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <rect width="800" height="600" fill="url(#pat)"/>
  <circle cx="${glowX}" cy="${glowY}" r="270" fill="url(#glow1)"/>
  <circle cx="${800 - glowX}" cy="${600 - glowY}" r="230" fill="url(#glow2)"/>
  <ellipse cx="400" cy="495" rx="235" ry="26" fill="#030712" opacity="0.46"/>
  <g filter="url(#softShadow)">
    ${art}
  </g>
  <rect x="26" y="26" width="748" height="548" rx="26" fill="none" stroke="${accent}" stroke-opacity="0.16" stroke-width="1.5"/>
</svg>`;
}

const SPECS = [
  // ======================== 25 ITEMS ========================
  {
    rel: 'items/travel-suitcase.svg',
    bg1: '#0A1628', bg2: '#132A42', accent: '#19B5A5', accent2: '#38BDF8', pattern: 'grid',
    art: `
      <rect x="355" y="96" width="90" height="84" rx="14" fill="none" stroke="url(#metal)" stroke-width="14"/>
      <rect x="342" y="92" width="116" height="22" rx="11" fill="#1E293B" stroke="#19B5A5" stroke-width="3"/>
      <rect x="255" y="168" width="290" height="305" rx="36" fill="#16283E" stroke="#19B5A5" stroke-width="4"/>
      <rect x="275" y="188" width="250" height="265" rx="24" fill="url(#glass)"/>
      <line x1="322" y1="205" x2="322" y2="435" stroke="#19B5A5" stroke-opacity="0.45" stroke-width="8" stroke-linecap="round"/>
      <line x1="400" y1="205" x2="400" y2="435" stroke="#19B5A5" stroke-opacity="0.45" stroke-width="8" stroke-linecap="round"/>
      <line x1="478" y1="205" x2="478" y2="435" stroke="#19B5A5" stroke-opacity="0.45" stroke-width="8" stroke-linecap="round"/>
      <rect x="492" y="232" width="54" height="72" rx="10" fill="url(#accentGrad)" transform="rotate(-12 519 268)"/>
      <rect x="504" y="250" width="28" height="28" rx="4" fill="#0B1320" transform="rotate(-12 518 264)"/>
      <circle cx="305" cy="482" r="18" fill="#0F172A" stroke="#94A3B8" stroke-width="6"/>
      <circle cx="495" cy="482" r="18" fill="#0F172A" stroke="#94A3B8" stroke-width="6"/>
    `,
  },
  {
    rel: 'items/daily-backpack.svg',
    bg1: '#0C172A', bg2: '#1B2D47', accent: '#38BDF8', accent2: '#19B5A5', pattern: 'dots',
    art: `
      <path d="M350 148 C350 105, 450 105, 450 148" fill="none" stroke="#94A3B8" stroke-width="14" stroke-linecap="round"/>
      <rect x="242" y="148" width="316" height="330" rx="76" fill="#172942" stroke="#38BDF8" stroke-width="4"/>
      <path d="M242 238 Q400 282 558 238 L558 190 Q400 155 242 190 Z" fill="url(#accentGrad)" opacity="0.9"/>
      <rect x="292" y="302" width="216" height="136" rx="26" fill="#0F1E33" stroke="#38BDF8" stroke-opacity="0.65" stroke-width="3"/>
      <line x1="316" y1="334" x2="484" y2="334" stroke="#E2E8F0" stroke-width="5" stroke-linecap="round"/>
      <rect x="382" y="234" width="36" height="44" rx="10" fill="#0B1320" stroke="#E2E8F0" stroke-width="3"/>
      <circle cx="400" cy="256" r="6" fill="#19B5A5"/>
    `,
  },
  {
    rel: 'items/leather-wallet.svg',
    bg1: '#151926', bg2: '#2B221B', accent: '#F59E0B', accent2: '#19B5A5', pattern: 'diag',
    art: `
      <rect x="235" y="160" width="290" height="165" rx="22" fill="#19B5A5" transform="rotate(-8 380 240)"/>
      <rect x="255" y="175" width="70" height="44" rx="8" fill="#FDE68A" opacity="0.85" transform="rotate(-8 290 197)"/>
      <rect x="200" y="218" width="400" height="248" rx="34" fill="#3B2417" stroke="#F59E0B" stroke-width="4"/>
      <rect x="218" y="236" width="364" height="212" rx="24" fill="none" stroke="#F59E0B" stroke-dasharray="10 8" stroke-opacity="0.55" stroke-width="2.5"/>
      <rect x="466" y="302" width="144" height="80" rx="22" fill="#4C2E1E" stroke="#F59E0B" stroke-width="4"/>
      <circle cx="512" cy="342" r="14" fill="url(#accentGrad)"/>
    `,
  },
  {
    rel: 'items/handbag-tote.svg',
    bg1: '#181326', bg2: '#2A1D33', accent: '#FB7185', accent2: '#19B5A5', pattern: 'rings',
    art: `
      <path d="M312 225 C312 110, 488 110, 488 225" fill="none" stroke="url(#accentGrad)" stroke-width="18" stroke-linecap="round"/>
      <path d="M210 228 L590 228 L556 468 Q552 486 530 486 L270 486 Q248 486 244 468 Z" fill="#2A1B36" stroke="#FB7185" stroke-width="4"/>
      <path d="M222 228 L578 228 L568 295 Q400 335 232 295 Z" fill="url(#glass)"/>
      <rect x="372" y="286" width="56" height="44" rx="12" fill="url(#accentGrad)"/>
      <circle cx="400" cy="308" r="7" fill="#0B1320"/>
    `,
  },
  {
    rel: 'items/gym-duffel.svg',
    bg1: '#0A1C22', bg2: '#112E34', accent: '#10B981', accent2: '#19B5A5', pattern: 'diag',
    art: `
      <path d="M310 218 C310 142, 490 142, 490 218" fill="none" stroke="#94A3B8" stroke-width="14" stroke-linecap="round"/>
      <rect x="175" y="218" width="450" height="236" rx="88" fill="#12303A" stroke="#10B981" stroke-width="4"/>
      <rect x="275" y="218" width="40" height="236" fill="url(#accentGrad)" opacity="0.9"/>
      <rect x="485" y="218" width="40" height="236" fill="url(#accentGrad)" opacity="0.9"/>
      <rect x="342" y="286" width="116" height="100" rx="20" fill="#0A1B24" stroke="#10B981" stroke-width="3"/>
      <line x1="364" y1="318" x2="436" y2="318" stroke="#E2E8F0" stroke-width="6" stroke-linecap="round"/>
      <circle cx="220" cy="336" r="24" fill="#0A1B24" stroke="#19B5A5" stroke-width="4"/>
      <circle cx="580" cy="336" r="24" fill="#0A1B24" stroke="#19B5A5" stroke-width="4"/>
    `,
  },
  {
    rel: 'items/car-key-fob.svg',
    bg1: '#091326', bg2: '#16284C', accent: '#2563EB', accent2: '#19B5A5', pattern: 'grid',
    art: `
      <circle cx="400" cy="145" r="42" fill="none" stroke="url(#metal)" stroke-width="14"/>
      <rect x="315" y="176" width="170" height="298" rx="68" fill="#0F1B33" stroke="#38BDF8" stroke-width="4"/>
      <rect x="336" y="198" width="128" height="254" rx="50" fill="url(#glass)"/>
      <circle cx="400" cy="258" r="28" fill="url(#accentGrad)"/>
      <rect x="366" y="308" width="68" height="36" rx="14" fill="#1E293B" stroke="#38BDF8" stroke-width="2.5"/>
      <rect x="366" y="362" width="68" height="36" rx="14" fill="#1E293B" stroke="#19B5A5" stroke-width="2.5"/>
      <circle cx="400" cy="422" r="8" fill="#EF4444"/>
    `,
  },
  {
    rel: 'items/house-keys.svg',
    bg1: '#111827', bg2: '#1F2937', accent: '#FBBF24', accent2: '#19B5A5', pattern: 'rings',
    art: `
      <circle cx="318" cy="215" r="56" fill="none" stroke="url(#metal)" stroke-width="16"/>
      <g transform="rotate(28 360 265)">
        <circle cx="378" cy="260" r="46" fill="url(#accentGrad)"/>
        <circle cx="378" cy="260" r="14" fill="#111827"/>
        <rect x="415" y="246" width="165" height="28" rx="8" fill="#FBBF24"/>
        <rect x="512" y="274" width="22" height="28" rx="4" fill="#FBBF24"/>
        <rect x="546" y="274" width="22" height="20" rx="4" fill="#FBBF24"/>
      </g>
      <g transform="rotate(-18 330 275)">
        <rect x="330" y="268" width="175" height="24" rx="8" fill="#94A3B8"/>
        <rect x="448" y="292" width="18" height="22" rx="4" fill="#94A3B8"/>
        <rect x="478" y="292" width="18" height="16" rx="4" fill="#94A3B8"/>
      </g>
      <rect x="200" y="292" width="110" height="140" rx="22" fill="#0F172A" stroke="#19B5A5" stroke-width="4" transform="rotate(-14 255 362)"/>
      <rect x="226" y="328" width="58" height="58" rx="8" fill="#19B5A5" opacity="0.85" transform="rotate(-14 255 357)"/>
    `,
  },
  {
    rel: 'items/laptop-pro.svg',
    bg1: '#071321', bg2: '#102A3E', accent: '#19B5A5', accent2: '#2DD4BF', pattern: 'grid',
    art: `
      <rect x="195" y="138" width="410" height="270" rx="22" fill="#0F172A" stroke="#94A3B8" stroke-width="6"/>
      <rect x="215" y="158" width="370" height="230" rx="12" fill="#10253B"/>
      <circle cx="330" cy="255" r="78" fill="url(#accentGrad)" opacity="0.45"/>
      <rect x="248" y="192" width="185" height="18" rx="9" fill="#19B5A5"/>
      <rect x="248" y="226" width="270" height="12" rx="6" fill="#E2E8F0" opacity="0.5"/>
      <rect x="248" y="252" width="220" height="12" rx="6" fill="#E2E8F0" opacity="0.35"/>
      <rect x="248" y="296" width="112" height="54" rx="10" fill="#19B5A5" opacity="0.25" stroke="#19B5A5" stroke-width="2"/>
      <rect x="380" y="296" width="160" height="54" rx="10" fill="#38BDF8" opacity="0.18" stroke="#38BDF8" stroke-width="2"/>
      <path d="M135 418 L665 418 L642 454 Q636 462 622 462 L178 462 Q164 462 158 454 Z" fill="url(#metal)"/>
      <rect x="348" y="424" width="104" height="10" rx="5" fill="#1E293B"/>
    `,
  },
  {
    rel: 'items/smartphone-flagship.svg',
    bg1: '#071625', bg2: '#0E2E40', accent: '#06B6D4', accent2: '#19B5A5', pattern: 'dots',
    art: `
      <rect x="292" y="102" width="216" height="392" rx="40" fill="#0B1320" stroke="url(#metal)" stroke-width="8"/>
      <rect x="310" y="120" width="180" height="356" rx="28" fill="#11263C"/>
      <rect x="366" y="136" width="68" height="16" rx="8" fill="#040914"/>
      <circle cx="400" cy="252" r="62" fill="url(#accentGrad)" opacity="0.88"/>
      <path d="M376 254 L394 272 L428 234" fill="none" stroke="#0B1320" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="338" y="346" width="124" height="16" rx="8" fill="#E2E8F0" opacity="0.7"/>
      <rect x="358" y="376" width="84" height="12" rx="6" fill="#06B6D4" opacity="0.65"/>
      <rect x="362" y="452" width="76" height="6" rx="3" fill="#94A3B8"/>
    `,
  },
  {
    rel: 'items/tablet-stylus.svg',
    bg1: '#12122B', bg2: '#1E1D42', accent: '#8B5CF6', accent2: '#19B5A5', pattern: 'grid',
    art: `
      <rect x="180" y="132" width="390" height="300" rx="28" fill="#0E1528" stroke="#94A3B8" stroke-width="7"/>
      <rect x="200" y="152" width="350" height="260" rx="16" fill="#18203D"/>
      <path d="M235 342 C285 245, 360 360, 420 250 C455 188, 495 240, 515 220" fill="none" stroke="url(#accentGrad)" stroke-width="10" stroke-linecap="round"/>
      <circle cx="282" cy="215" r="24" fill="#8B5CF6" opacity="0.45"/>
      <g transform="rotate(34 575 305)">
        <rect x="558" y="145" width="24" height="260" rx="12" fill="url(#metal)"/>
        <polygon points="558,405 582,405 570,438" fill="#19B5A5"/>
      </g>
    `,
  },
  {
    rel: 'items/wireless-headphones.svg',
    bg1: '#191026', bg2: '#2D1537', accent: '#EC4899', accent2: '#19B5A5', pattern: 'rings',
    art: `
      <path d="M232 320 C232 145, 568 145, 568 320" fill="none" stroke="url(#accentGrad)" stroke-width="28" stroke-linecap="round"/>
      <path d="M250 320 C250 172, 550 172, 550 320" fill="none" stroke="#0F172A" stroke-width="10" stroke-linecap="round"/>
      <rect x="196" y="294" width="76" height="156" rx="34" fill="#171E33" stroke="#EC4899" stroke-width="5"/>
      <rect x="252" y="312" width="32" height="120" rx="14" fill="#334155"/>
      <rect x="528" y="294" width="76" height="156" rx="34" fill="#171E33" stroke="#19B5A5" stroke-width="5"/>
      <rect x="516" y="312" width="32" height="120" rx="14" fill="#334155"/>
      <path d="M342 372 Q364 332 386 372 T430 372 T458 372" fill="none" stroke="#EC4899" stroke-width="6" stroke-linecap="round" opacity="0.7"/>
    `,
  },
  {
    rel: 'items/pro-camera.svg',
    bg1: '#16141F', bg2: '#291D1A', accent: '#F97316', accent2: '#19B5A5', pattern: 'dots',
    art: `
      <path d="M312 162 L352 126 L448 126 L488 162 Z" fill="#1E293B" stroke="#94A3B8" stroke-width="4"/>
      <rect x="188" y="162" width="424" height="290" rx="36" fill="#111827" stroke="#F97316" stroke-width="4"/>
      <rect x="232" y="138" width="52" height="24" rx="8" fill="#F97316"/>
      <circle cx="400" cy="312" r="108" fill="#0B1320" stroke="url(#metal)" stroke-width="14"/>
      <circle cx="400" cy="312" r="76" fill="#162844" stroke="#19B5A5" stroke-width="5"/>
      <circle cx="400" cy="312" r="42" fill="url(#accentGrad)" opacity="0.85"/>
      <circle cx="378" cy="288" r="14" fill="#FFFFFF" opacity="0.65"/>
      <circle cx="556" cy="212" r="14" fill="#F97316"/>
    `,
  },
  {
    rel: 'items/smartwatch-wearable.svg',
    bg1: '#071B1E', bg2: '#103138', accent: '#14B8A6', accent2: '#38BDF8', pattern: 'grid',
    art: `
      <rect x="342" y="84" width="116" height="110" rx="22" fill="#1E293B" stroke="#14B8A6" stroke-width="3"/>
      <rect x="342" y="406" width="116" height="110" rx="22" fill="#1E293B" stroke="#14B8A6" stroke-width="3"/>
      <rect x="292" y="176" width="216" height="248" rx="54" fill="#0B1320" stroke="url(#metal)" stroke-width="10"/>
      <rect x="508" y="242" width="18" height="44" rx="7" fill="#14B8A6"/>
      <circle cx="400" cy="300" r="72" fill="none" stroke="#14B8A6" stroke-width="12" stroke-dasharray="320 130" stroke-linecap="round"/>
      <circle cx="400" cy="300" r="52" fill="none" stroke="#38BDF8" stroke-width="10" stroke-dasharray="220 110" stroke-linecap="round"/>
      <line x1="400" y1="300" x2="400" y2="262" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round"/>
      <line x1="400" y1="300" x2="432" y2="314" stroke="#14B8A6" stroke-width="7" stroke-linecap="round"/>
      <circle cx="400" cy="300" r="7" fill="#FFFFFF"/>
    `,
  },
  {
    rel: 'items/gaming-handheld.svg',
    bg1: '#10122A', bg2: '#1E1B4B', accent: '#6366F1', accent2: '#19B5A5', pattern: 'diag',
    art: `
      <rect x="132" y="182" width="536" height="236" rx="92" fill="#141B36" stroke="#6366F1" stroke-width="4"/>
      <rect x="132" y="182" width="114" height="236" rx="57" fill="#6366F1" opacity="0.9"/>
      <rect x="554" y="182" width="114" height="236" rx="57" fill="#19B5A5" opacity="0.9"/>
      <rect x="252" y="202" width="296" height="196" rx="18" fill="#070E1B" stroke="#94A3B8" stroke-width="3"/>
      <polygon points="376,262 376,338 442,300" fill="url(#accentGrad)"/>
      <rect x="174" y="256" width="30" height="88" rx="8" fill="#0B1320"/>
      <rect x="145" y="285" width="88" height="30" rx="8" fill="#0B1320"/>
      <circle cx="611" cy="264" r="14" fill="#0B1320"/>
      <circle cx="611" cy="336" r="14" fill="#0B1320"/>
      <circle cx="578" cy="300" r="14" fill="#0B1320"/>
      <circle cx="644" cy="300" r="14" fill="#0B1320"/>
    `,
  },
  {
    rel: 'items/kids-school-bag.svg',
    bg1: '#141B2D', bg2: '#23314A', accent: '#F59E0B', accent2: '#19B5A5', pattern: 'dots',
    art: `
      <path d="M352 152 C352 106, 448 106, 448 152" fill="none" stroke="#F59E0B" stroke-width="16" stroke-linecap="round"/>
      <rect x="248" y="154" width="304" height="320" rx="68" fill="#19B5A5" stroke="#FDE68A" stroke-width="4"/>
      <rect x="282" y="200" width="236" height="106" rx="28" fill="#0F2940"/>
      <polygon points="400,218 412,246 442,248 418,266 426,294 400,278 374,294 382,266 358,248 388,246" fill="#FBBF24"/>
      <rect x="286" y="330" width="228" height="114" rx="26" fill="#F59E0B"/>
      <rect x="322" y="356" width="156" height="16" rx="8" fill="#0B1320" opacity="0.25"/>
      <rect x="218" y="282" width="32" height="112" rx="16" fill="#0F2940"/>
      <rect x="550" y="282" width="32" height="112" rx="16" fill="#0F2940"/>
    `,
  },
  {
    rel: 'items/kids-teddy-toy.svg',
    bg1: '#1B1726', bg2: '#2F2130', accent: '#FB923C', accent2: '#19B5A5', pattern: 'rings',
    art: `
      <circle cx="322" cy="176" r="44" fill="#D97742" stroke="#FDBA74" stroke-width="4"/>
      <circle cx="478" cy="176" r="44" fill="#D97742" stroke="#FDBA74" stroke-width="4"/>
      <circle cx="322" cy="176" r="22" fill="#FDBA74" opacity="0.55"/>
      <circle cx="478" cy="176" r="22" fill="#FDBA74" opacity="0.55"/>
      <circle cx="400" cy="236" r="88" fill="#E0864F" stroke="#FDBA74" stroke-width="4"/>
      <ellipse cx="400" cy="396" rx="108" ry="92" fill="#D97742" stroke="#FDBA74" stroke-width="4"/>
      <ellipse cx="400" cy="402" rx="58" ry="52" fill="#FED7AA" opacity="0.75"/>
      <ellipse cx="400" cy="260" rx="34" ry="26" fill="#FED7AA"/>
      <ellipse cx="400" cy="252" rx="14" ry="10" fill="#1E293B"/>
      <circle cx="364" cy="222" r="10" fill="#0F172A"/>
      <circle cx="436" cy="222" r="10" fill="#0F172A"/>
      <rect x="336" y="308" width="128" height="24" rx="12" fill="#19B5A5"/>
      <circle cx="400" cy="336" r="16" fill="#FBBF24"/>
    `,
  },
  {
    rel: 'items/baby-stroller.svg',
    bg1: '#0C1B2E', bg2: '#15314B', accent: '#38BDF8', accent2: '#19B5A5', pattern: 'dots',
    art: `
      <path d="M225 186 L282 186 L320 352 L530 352" fill="none" stroke="#E2E8F0" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M292 260 L548 260 C548 355, 488 386, 405 386 C322 386, 292 345, 292 260 Z" fill="#19B5A5" stroke="#38BDF8" stroke-width="4"/>
      <path d="M292 260 C292 146, 424 146, 434 260 Z" fill="#38BDF8"/>
      <line x1="358" y1="382" x2="322" y2="444" stroke="#94A3B8" stroke-width="12" stroke-linecap="round"/>
      <line x1="480" y1="382" x2="516" y2="444" stroke="#94A3B8" stroke-width="12" stroke-linecap="round"/>
      <circle cx="316" cy="456" r="32" fill="#0B1320" stroke="#38BDF8" stroke-width="8"/>
      <circle cx="522" cy="456" r="32" fill="#0B1320" stroke="#19B5A5" stroke-width="8"/>
    `,
  },
  {
    rel: 'items/passport-travel-docs.svg',
    bg1: '#071724', bg2: '#112E3E', accent: '#2DD4BF', accent2: '#38BDF8', pattern: 'grid',
    art: `
      <rect x="275" y="138" width="265" height="346" rx="22" fill="#1E3A5F" stroke="#38BDF8" stroke-width="3" transform="rotate(8 408 311)"/>
      <rect x="242" y="128" width="276" height="356" rx="24" fill="#0E2538" stroke="#2DD4BF" stroke-width="4.5"/>
      <circle cx="380" cy="274" r="68" fill="none" stroke="#2DD4BF" stroke-width="4"/>
      <ellipse cx="380" cy="274" rx="34" ry="68" fill="none" stroke="#2DD4BF" stroke-width="3"/>
      <line x1="312" y1="274" x2="448" y2="274" stroke="#2DD4BF" stroke-width="3"/>
      <line x1="322" y1="240" x2="438" y2="240" stroke="#2DD4BF" stroke-opacity="0.65" stroke-width="2.5"/>
      <line x1="322" y1="308" x2="438" y2="308" stroke="#2DD4BF" stroke-opacity="0.65" stroke-width="2.5"/>
      <rect x="318" y="388" width="124" height="16" rx="8" fill="#2DD4BF" opacity="0.85"/>
      <rect x="342" y="418" width="76" height="10" rx="5" fill="#94A3B8" opacity="0.65"/>
    `,
  },
  {
    rel: 'items/office-notebook.svg',
    bg1: '#141328', bg2: '#232044', accent: '#A78BFA', accent2: '#19B5A5', pattern: 'diag',
    art: `
      <rect x="228" y="126" width="290" height="356" rx="24" fill="#1C2541" stroke="#A78BFA" stroke-width="4"/>
      <rect x="228" y="126" width="46" height="356" rx="14" fill="url(#accentGrad)"/>
      <rect x="304" y="182" width="176" height="58" rx="14" fill="#0B1320" stroke="#A78BFA" stroke-opacity="0.6" stroke-width="2.5"/>
      <line x1="328" y1="205" x2="456" y2="205" stroke="#E2E8F0" stroke-width="6" stroke-linecap="round"/>
      <line x1="328" y1="224" x2="416" y2="224" stroke="#19B5A5" stroke-width="5" stroke-linecap="round"/>
      <rect x="462" y="126" width="20" height="356" fill="#0B1320" opacity="0.5"/>
      <g transform="rotate(14 576 300)">
        <rect x="558" y="154" width="28" height="270" rx="12" fill="url(#metal)"/>
        <rect x="558" y="198" width="28" height="18" fill="#19B5A5"/>
        <polygon points="558,424 586,424 572,458" fill="#A78BFA"/>
      </g>
    `,
  },
  {
    rel: 'items/dog-pet-collar.svg',
    bg1: '#0A1E1D', bg2: '#12352F', accent: '#22C55E', accent2: '#19B5A5', pattern: 'rings',
    art: `
      <ellipse cx="400" cy="248" rx="164" ry="84" fill="none" stroke="url(#accentGrad)" stroke-width="34"/>
      <ellipse cx="400" cy="248" rx="164" ry="84" fill="none" stroke="#0B1320" stroke-width="6" stroke-dasharray="14 14" opacity="0.45"/>
      <rect x="378" y="308" width="44" height="38" rx="12" fill="url(#metal)"/>
      <circle cx="400" cy="404" r="68" fill="#0F1F2E" stroke="#22C55E" stroke-width="6"/>
      <circle cx="400" cy="414" r="22" fill="#19B5A5"/>
      <circle cx="372" cy="382" r="11" fill="#22C55E"/>
      <circle cx="390" cy="368" r="11" fill="#22C55E"/>
      <circle cx="410" cy="368" r="11" fill="#22C55E"/>
      <circle cx="428" cy="382" r="11" fill="#22C55E"/>
    `,
  },
  {
    rel: 'items/cat-pet-carrier.svg',
    bg1: '#1C1328', bg2: '#2D1D3B', accent: '#F472B6', accent2: '#19B5A5', pattern: 'dots',
    art: `
      <path d="M342 178 C342 134, 458 134, 458 178" fill="none" stroke="#F472B6" stroke-width="14" stroke-linecap="round"/>
      <rect x="196" y="178" width="408" height="288" rx="54" fill="#1E243B" stroke="#F472B6" stroke-width="4"/>
      <rect x="252" y="226" width="296" height="192" rx="34" fill="#0B1320" stroke="#19B5A5" stroke-width="3"/>
      <polygon points="348,292 368,248 394,284" fill="#F472B6"/>
      <polygon points="452,292 432,248 406,284" fill="#F472B6"/>
      <circle cx="400" cy="322" r="52" fill="#F472B6"/>
      <circle cx="382" cy="316" r="7" fill="#0B1320"/>
      <circle cx="418" cy="316" r="7" fill="#0B1320"/>
      <polygon points="394,332 406,332 400,340" fill="#0B1320"/>
      <circle cx="400" cy="386" r="14" fill="#19B5A5"/>
    `,
  },
  {
    rel: 'items/bicycle-commute.svg',
    bg1: '#08182A', bg2: '#0F2E4D', accent: '#0EA5E9', accent2: '#19B5A5', pattern: 'diag',
    art: `
      <circle cx="252" cy="384" r="84" fill="none" stroke="#0EA5E9" stroke-width="14"/>
      <circle cx="252" cy="384" r="16" fill="#19B5A5"/>
      <circle cx="548" cy="384" r="84" fill="none" stroke="#19B5A5" stroke-width="14"/>
      <circle cx="548" cy="384" r="16" fill="#0EA5E9"/>
      <path d="M252 384 L364 242 L512 242 L548 384 M364 242 L404 384 L252 384 M404 384 L512 242" fill="none" stroke="#E2E8F0" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="336" y1="212" x2="394" y2="212" stroke="#19B5A5" stroke-width="14" stroke-linecap="round"/>
      <path d="M498 202 L538 202 L512 242" fill="none" stroke="#0EA5E9" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  },
  {
    rel: 'items/eyewear-sunglasses.svg',
    bg1: '#151924', bg2: '#272936', accent: '#EAB308', accent2: '#19B5A5', pattern: 'grid',
    art: `
      <rect x="206" y="346" width="388" height="122" rx="60" fill="#17243A" stroke="#19B5A5" stroke-width="4"/>
      <line x1="252" y1="406" x2="548" y2="406" stroke="#19B5A5" stroke-opacity="0.35" stroke-width="3"/>
      <rect x="170" y="182" width="194" height="126" rx="44" fill="#0B1320" stroke="#EAB308" stroke-width="10"/>
      <rect x="436" y="182" width="194" height="126" rx="44" fill="#0B1320" stroke="#EAB308" stroke-width="10"/>
      <path d="M364 228 Q400 202 436 228" fill="none" stroke="#EAB308" stroke-width="12" stroke-linecap="round"/>
      <line x1="205" y1="272" x2="278" y2="204" stroke="#FFFFFF" stroke-opacity="0.28" stroke-width="14" stroke-linecap="round"/>
      <line x1="471" y1="272" x2="544" y2="204" stroke="#FFFFFF" stroke-opacity="0.28" stroke-width="14" stroke-linecap="round"/>
    `,
  },
  {
    rel: 'items/collectible-watch-box.svg',
    bg1: '#12141E', bg2: '#241F1B', accent: '#D97706', accent2: '#19B5A5', pattern: 'rings',
    art: `
      <rect x="220" y="160" width="360" height="302" rx="34" fill="#1B2131" stroke="#D97706" stroke-width="4.5"/>
      <rect x="248" y="188" width="304" height="246" rx="22" fill="#0C1220" stroke="#D97706" stroke-opacity="0.4" stroke-width="2"/>
      <circle cx="400" cy="311" r="88" fill="#141C2F" stroke="#D97706" stroke-width="10"/>
      <circle cx="400" cy="311" r="68" fill="none" stroke="#19B5A5" stroke-dasharray="4 14" stroke-width="6"/>
      <line x1="400" y1="311" x2="400" y2="262" stroke="#FDE68A" stroke-width="6" stroke-linecap="round"/>
      <line x1="400" y1="311" x2="440" y2="328" stroke="#19B5A5" stroke-width="6" stroke-linecap="round"/>
      <circle cx="400" cy="311" r="8" fill="#FDE68A"/>
    `,
  },
  {
    rel: 'items/work-briefcase-tools.svg',
    bg1: '#0A1522', bg2: '#17293D', accent: '#19B5A5', accent2: '#64748B', pattern: 'grid',
    art: `
      <path d="M332 184 L332 146 Q332 132 348 132 L452 132 Q468 132 468 146 L468 184" fill="none" stroke="url(#metal)" stroke-width="16"/>
      <rect x="176" y="184" width="448" height="282" rx="30" fill="#142338" stroke="#19B5A5" stroke-width="4"/>
      <path d="M176 266 L624 266 L624 294 Q400 326 176 294 Z" fill="#0C1726"/>
      <rect x="366" y="276" width="68" height="54" rx="12" fill="url(#accentGrad)"/>
      <circle cx="400" cy="303" r="9" fill="#0B1320"/>
      <rect x="228" y="360" width="94" height="54" rx="12" fill="#0B1320" stroke="#19B5A5" stroke-opacity="0.55" stroke-width="2.5"/>
      <rect x="478" y="360" width="94" height="54" rx="12" fill="#0B1320" stroke="#38BDF8" stroke-opacity="0.55" stroke-width="2.5"/>
    `,
  },

  // ======================== 10 GROUPS ========================
  {
    rel: 'groups/group-travel-luggage.svg',
    bg1: '#071525', bg2: '#102C42', accent: '#19B5A5', accent2: '#38BDF8', pattern: 'grid',
    art: `
      <rect x="195" y="176" width="188" height="278" rx="28" fill="#132940" stroke="#19B5A5" stroke-width="4"/>
      <rect x="248" y="122" width="82" height="54" rx="12" fill="none" stroke="#94A3B8" stroke-width="10"/>
      <rect x="415" y="242" width="190" height="212" rx="30" fill="#1A3550" stroke="#38BDF8" stroke-width="4"/>
      <rect x="336" y="302" width="128" height="168" rx="18" fill="#0B1320" stroke="#2DD4BF" stroke-width="4"/>
      <circle cx="400" cy="368" r="32" fill="none" stroke="#19B5A5" stroke-width="4"/>
      <path d="M510 156 L588 128 L556 184 L544 168 Z" fill="#38BDF8"/>
    `,
  },
  {
    rel: 'groups/group-family-kids.svg',
    bg1: '#17172B', bg2: '#28213D', accent: '#FB923C', accent2: '#19B5A5', pattern: 'dots',
    art: `
      <rect x="180" y="204" width="180" height="240" rx="48" fill="#19B5A5" stroke="#E2E8F0" stroke-width="3.5"/>
      <rect x="440" y="220" width="180" height="224" rx="44" fill="#FB923C" stroke="#FED7AA" stroke-width="3.5"/>
      <circle cx="400" cy="248" r="76" fill="#0F1D33" stroke="#FBBF24" stroke-width="5"/>
      <polygon points="400,202 414,234 448,236 422,258 430,290 400,272 370,290 378,258 352,236 386,234" fill="#FBBF24"/>
      <rect x="312" y="352" width="176" height="106" rx="28" fill="#1E293B" stroke="#19B5A5" stroke-width="4"/>
      <circle cx="364" cy="405" r="18" fill="#FB923C"/>
      <circle cx="436" cy="405" r="18" fill="#38BDF8"/>
    `,
  },
  {
    rel: 'groups/group-home-keys.svg',
    bg1: '#0F1827', bg2: '#1F2C40', accent: '#FBBF24', accent2: '#19B5A5', pattern: 'rings',
    art: `
      <polygon points="400,118 594,256 206,256" fill="url(#accentGrad)"/>
      <rect x="242" y="256" width="316" height="214" rx="24" fill="#122136" stroke="#FBBF24" stroke-width="4"/>
      <rect x="358" y="346" width="84" height="124" rx="18" fill="#0B1320" stroke="#19B5A5" stroke-width="3.5"/>
      <circle cx="420" cy="410" r="7" fill="#FBBF24"/>
      <circle cx="304" cy="316" r="24" fill="#FBBF24" opacity="0.88"/>
      <circle cx="496" cy="316" r="24" fill="#19B5A5" opacity="0.88"/>
    `,
  },
  {
    rel: 'groups/group-tech-workstation.svg',
    bg1: '#081426', bg2: '#122947', accent: '#38BDF8', accent2: '#19B5A5', pattern: 'grid',
    art: `
      <rect x="172" y="152" width="318" height="224" rx="22" fill="#0F1B30" stroke="#38BDF8" stroke-width="4.5"/>
      <rect x="192" y="172" width="278" height="184" rx="12" fill="#152A44"/>
      <rect x="148" y="382" width="366" height="28" rx="12" fill="url(#metal)"/>
      <rect x="518" y="198" width="118" height="216" rx="24" fill="#0B1320" stroke="#19B5A5" stroke-width="4.5"/>
      <circle cx="577" cy="296" r="30" fill="url(#accentGrad)"/>
      <rect x="242" y="220" width="160" height="16" rx="8" fill="#38BDF8"/>
      <rect x="242" y="254" width="112" height="12" rx="6" fill="#19B5A5"/>
    `,
  },
  {
    rel: 'groups/group-photo-creator.svg',
    bg1: '#171421', bg2: '#2A1D24', accent: '#F97316', accent2: '#19B5A5', pattern: 'dots',
    art: `
      <rect x="176" y="206" width="284" height="214" rx="30" fill="#141C2F" stroke="#F97316" stroke-width="4.5"/>
      <circle cx="318" cy="314" r="68" fill="#0B1320" stroke="#94A3B8" stroke-width="10"/>
      <circle cx="318" cy="314" r="34" fill="url(#accentGrad)"/>
      <rect x="494" y="174" width="128" height="246" rx="26" fill="#1B253A" stroke="#19B5A5" stroke-width="4"/>
      <circle cx="558" cy="246" r="36" fill="#0B1320" stroke="#19B5A5" stroke-width="6"/>
      <circle cx="558" cy="348" r="24" fill="#F97316" opacity="0.8"/>
    `,
  },
  {
    rel: 'groups/group-pets-care.svg',
    bg1: '#091E1C', bg2: '#14342F', accent: '#22C55E', accent2: '#F472B6', pattern: 'rings',
    art: `
      <circle cx="300" cy="296" r="106" fill="#122C2A" stroke="#22C55E" stroke-width="5"/>
      <circle cx="500" cy="296" r="106" fill="#1C2338" stroke="#F472B6" stroke-width="5"/>
      <circle cx="300" cy="316" r="28" fill="#22C55E"/>
      <circle cx="272" cy="276" r="13" fill="#22C55E"/>
      <circle cx="300" cy="264" r="13" fill="#22C55E"/>
      <circle cx="328" cy="276" r="13" fill="#22C55E"/>
      <polygon points="462,286 482,240 502,276" fill="#F472B6"/>
      <polygon points="538,286 518,240 498,276" fill="#F472B6"/>
      <circle cx="500" cy="312" r="40" fill="#F472B6"/>
      <circle cx="400" cy="422" r="34" fill="#0B1320" stroke="#19B5A5" stroke-width="5"/>
      <circle cx="400" cy="422" r="12" fill="#19B5A5"/>
    `,
  },
  {
    rel: 'groups/group-sports-outdoor.svg',
    bg1: '#0A1E21', bg2: '#133538', accent: '#10B981', accent2: '#F59E0B', pattern: 'diag',
    art: `
      <polygon points="150,456 322,196 476,456" fill="#123039" stroke="#10B981" stroke-width="4"/>
      <polygon points="342,456 492,238 650,456" fill="#193C44" stroke="#19B5A5" stroke-width="4"/>
      <circle cx="548" cy="176" r="46" fill="#F59E0B" opacity="0.9"/>
      <rect x="268" y="348" width="264" height="114" rx="46" fill="#0B1320" stroke="#10B981" stroke-width="4.5"/>
      <rect x="336" y="348" width="28" height="114" fill="#10B981"/>
      <rect x="436" y="348" width="28" height="114" fill="#19B5A5"/>
    `,
  },
  {
    rel: 'groups/group-school-campus.svg',
    bg1: '#12132B', bg2: '#23204A', accent: '#8B5CF6', accent2: '#19B5A5', pattern: 'grid',
    art: `
      <rect x="188" y="218" width="144" height="236" rx="18" fill="#8B5CF6" stroke="#DDD6FE" stroke-width="3"/>
      <rect x="342" y="176" width="144" height="278" rx="18" fill="#19B5A5" stroke="#99F6E4" stroke-width="3"/>
      <rect x="496" y="246" width="116" height="208" rx="18" fill="#38BDF8" stroke="#BAE6FD" stroke-width="3"/>
      <polygon points="400,112 528,158 400,204 272,158" fill="#0F172A" stroke="#FBBF24" stroke-width="4"/>
      <rect x="220" y="266" width="80" height="14" rx="7" fill="#0B1320" opacity="0.35"/>
      <rect x="374" y="238" width="80" height="14" rx="7" fill="#0B1320" opacity="0.35"/>
    `,
  },
  {
    rel: 'groups/group-car-commute.svg',
    bg1: '#081426', bg2: '#152B4F', accent: '#2563EB', accent2: '#19B5A5', pattern: 'diag',
    art: `
      <path d="M180 340 L236 236 Q252 212 288 212 L512 212 Q548 212 564 236 L620 340 Z" fill="#142748" stroke="#38BDF8" stroke-width="4"/>
      <rect x="160" y="328" width="480" height="96" rx="34" fill="#0F1E38" stroke="#19B5A5" stroke-width="4.5"/>
      <circle cx="256" cy="428" r="42" fill="#0B1320" stroke="#94A3B8" stroke-width="10"/>
      <circle cx="544" cy="428" r="42" fill="#0B1320" stroke="#94A3B8" stroke-width="10"/>
      <rect x="192" y="358" width="54" height="22" rx="11" fill="#FBBF24"/>
      <rect x="554" y="358" width="54" height="22" rx="11" fill="#19B5A5"/>
    `,
  },
  {
    rel: 'groups/group-office-enterprise.svg',
    bg1: '#071624', bg2: '#10293D', accent: '#14B8A6', accent2: '#38BDF8', pattern: 'grid',
    art: `
      <rect x="176" y="168" width="206" height="140" rx="22" fill="#11263B" stroke="#14B8A6" stroke-width="4"/>
      <rect x="418" y="168" width="206" height="140" rx="22" fill="#11263B" stroke="#38BDF8" stroke-width="4"/>
      <rect x="176" y="336" width="206" height="140" rx="22" fill="#11263B" stroke="#38BDF8" stroke-width="4"/>
      <rect x="418" y="336" width="206" height="140" rx="22" fill="#11263B" stroke="#14B8A6" stroke-width="4"/>
      <circle cx="400" cy="322" r="52" fill="url(#accentGrad)" stroke="#0B1320" stroke-width="10"/>
      <rect x="212" y="216" width="110" height="16" rx="8" fill="#14B8A6"/>
      <rect x="454" y="216" width="110" height="16" rx="8" fill="#38BDF8"/>
      <rect x="212" y="388" width="110" height="16" rx="8" fill="#38BDF8"/>
      <rect x="454" y="388" width="110" height="16" rx="8" fill="#14B8A6"/>
    `,
  },

  // ======================== 5 MIDNIGHT TEAL FALLBACKS ========================
  {
    rel: 'fallbacks/fallback-midnight-crest.svg',
    bg1: '#06111F', bg2: '#0F273B', accent: '#19B5A5', accent2: '#0F9D8E', pattern: 'grid',
    art: `
      <path d="M400 112 L552 174 L552 316 C552 406 486 468 400 498 C314 468 248 406 248 316 L248 174 Z" fill="#0D1F34" stroke="#19B5A5" stroke-width="5"/>
      <path d="M400 156 L512 202 L512 310 C512 378 464 426 400 450 C336 426 288 378 288 310 L288 202 Z" fill="url(#glass)"/>
      <rect x="346" y="242" width="108" height="108" rx="20" fill="url(#accentGrad)"/>
      <rect x="370" y="266" width="24" height="24" rx="4" fill="#0B1320"/>
      <rect x="406" y="266" width="24" height="24" rx="4" fill="#0B1320"/>
      <rect x="370" y="302" width="24" height="24" rx="4" fill="#0B1320"/>
      <rect x="410" y="306" width="18" height="18" rx="4" fill="#0B1320"/>
    `,
  },
  {
    rel: 'fallbacks/fallback-teal-horizon.svg',
    bg1: '#071422', bg2: '#0E2D3D', accent: '#2DD4BF', accent2: '#38BDF8', pattern: 'rings',
    art: `
      <circle cx="400" cy="300" r="158" fill="none" stroke="#2DD4BF" stroke-opacity="0.32" stroke-width="3"/>
      <circle cx="400" cy="300" r="114" fill="#0D2235" stroke="#2DD4BF" stroke-width="5"/>
      <circle cx="400" cy="300" r="64" fill="url(#accentGrad)"/>
      <path d="M126 392 Q265 322 400 374 T674 358" fill="none" stroke="#2DD4BF" stroke-width="6" stroke-linecap="round" opacity="0.7"/>
      <path d="M126 432 Q285 372 420 416 T674 398" fill="none" stroke="#38BDF8" stroke-width="4" stroke-linecap="round" opacity="0.45"/>
    `,
  },
  {
    rel: 'fallbacks/fallback-slate-prism.svg',
    bg1: '#091322', bg2: '#16263D', accent: '#38BDF8', accent2: '#19B5A5', pattern: 'diag',
    art: `
      <polygon points="400,116 588,224 588,396 400,496 212,396 212,224" fill="#0F1F34" stroke="#38BDF8" stroke-width="4.5"/>
      <polygon points="400,116 588,224 400,312 212,224" fill="url(#accentGrad)" opacity="0.82"/>
      <polygon points="400,312 588,224 588,396 400,496" fill="#19B5A5" opacity="0.28"/>
      <circle cx="400" cy="312" r="34" fill="#0B1320" stroke="#E2E8F0" stroke-width="5"/>
    `,
  },
  {
    rel: 'fallbacks/fallback-ocean-vault.svg',
    bg1: '#061420', bg2: '#0D2938', accent: '#0F9D8E', accent2: '#19B5A5', pattern: 'dots',
    art: `
      <rect x="218" y="144" width="364" height="312" rx="46" fill="#0F2134" stroke="#19B5A5" stroke-width="5"/>
      <circle cx="400" cy="300" r="96" fill="#081523" stroke="url(#accentGrad)" stroke-width="14"/>
      <circle cx="400" cy="300" r="34" fill="url(#accentGrad)"/>
      <line x1="400" y1="204" x2="400" y2="252" stroke="#E2E8F0" stroke-width="8" stroke-linecap="round"/>
      <line x1="400" y1="348" x2="400" y2="396" stroke="#E2E8F0" stroke-width="8" stroke-linecap="round"/>
      <line x1="304" y1="300" x2="352" y2="300" stroke="#E2E8F0" stroke-width="8" stroke-linecap="round"/>
      <line x1="448" y1="300" x2="496" y2="300" stroke="#E2E8F0" stroke-width="8" stroke-linecap="round"/>
    `,
  },
  {
    rel: 'fallbacks/fallback-aurora-tag.svg',
    bg1: '#071722', bg2: '#10313A', accent: '#10B981', accent2: '#19B5A5', pattern: 'grid',
    art: `
      <path d="M276 154 L484 154 L568 238 L568 456 Q568 476 548 476 L276 476 Q256 476 256 456 L256 174 Q256 154 276 154 Z" fill="#0F2436" stroke="#10B981" stroke-width="5"/>
      <circle cx="496" cy="226" r="18" fill="#071722" stroke="#19B5A5" stroke-width="6"/>
      <rect x="312" y="248" width="160" height="160" rx="22" fill="url(#glass)" stroke="#19B5A5" stroke-width="3.5"/>
      <rect x="342" y="278" width="38" height="38" rx="8" fill="#19B5A5"/>
      <rect x="404" y="278" width="38" height="38" rx="8" fill="#10B981"/>
      <rect x="342" y="340" width="38" height="38" rx="8" fill="#10B981"/>
      <rect x="404" y="340" width="38" height="38" rx="8" fill="#38BDF8"/>
    `,
  },
];

for (const spec of SPECS) {
  const fullPath = path.resolve(OUT_ROOT, spec.rel);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, buildSvg(spec), 'utf8');
}

console.log(`Generated ${SPECS.length} curated Midnight Teal cover assets in ${OUT_ROOT}`);
