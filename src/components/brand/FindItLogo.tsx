import React from 'react';
import { buildQrRecoveryUrl, generateQrMatrix } from '../../utils/qrLogic';

interface FindItLogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
  className?: string;
}

/**
 * Official FindIt QR Brand Mark:
 * Combines a standalone custom icon merging a QR Code matrix with a Location Pin,
 * alongside the FindIt QR wordmark. Supports both full lockup and standalone icon.
 */
export const FindItLogo: React.FC<FindItLogoProps> = ({
  variant = 'full',
  size = 'md',
  inverted = false,
  className = '',
}) => {
  const iconDimensions = {
    sm: 32,
    md: 38,
    lg: 48,
  }[size];

  const textSizeClass = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size];

  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={iconDimensions}
        height={iconDimensions}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0 drop-shadow-sm"
      >
        {/* Soft 3D Squircle Base in Navy & Primary Blue */}
        <rect x="2" y="2" width="44" height="44" rx="12" fill="#17243A" />
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="11"
          stroke="#2563EB"
          strokeWidth="1.5"
          strokeOpacity="0.7"
        />

        {/* Top-Left QR Finder Square (Teal & Yellow) */}
        <rect x="8" y="8" width="11" height="11" rx="2.5" stroke="#19B5A5" strokeWidth="2.2" />
        <rect x="11.2" y="11.2" width="4.6" height="4.6" rx="1" fill="#FFD166" />

        {/* Top-Right QR Finder Square */}
        <rect x="29" y="8" width="11" height="11" rx="2.5" stroke="#2563EB" strokeWidth="2.2" />
        <rect x="32.2" y="11.2" width="4.6" height="4.6" rx="1" fill="#19B5A5" />

        {/* Bottom-Left QR Finder Square */}
        <rect x="8" y="29" width="11" height="11" rx="2.5" stroke="#2563EB" strokeWidth="2.2" />
        <rect x="11.2" y="32.2" width="4.6" height="4.6" rx="1" fill="#FF8A65" />

        {/* QR Data Modules */}
        <rect x="22" y="8.5" width="3.5" height="3.5" rx="0.8" fill="#F4F7FB" />
        <rect x="22" y="14" width="3.5" height="3.5" rx="0.8" fill="#19B5A5" />
        <rect x="8.5" y="22" width="3.5" height="3.5" rx="0.8" fill="#F4F7FB" />
        <rect x="14" y="22" width="3.5" height="3.5" rx="0.8" fill="#FFD166" />

        {/* Integrated Location Pin Emblem */}
        <path
          d="M31.5 20C26.8056 20 23 23.8056 23 28.5C23 34.25 31.5 41.5 31.5 41.5C31.5 41.5 40 34.25 40 28.5C40 23.8056 36.1944 20 31.5 20Z"
          fill="#FF8A65"
        />
        <circle cx="31.5" cy="28.2" r="3.6" fill="#17243A" />
        <circle cx="31.5" cy="28.2" r="1.7" fill="#FFD166" />
      </svg>

      {variant === 'full' && (
        <span
          dir="ltr"
          className={`font-extrabold tracking-tight whitespace-nowrap ${
            inverted ? 'text-[#F4F7FB]' : 'text-[#0B1320] dark:text-[#F4F7FB]'
          } ${textSizeClass}`}
        >
          FindIt{' '}
          <span className={inverted ? 'text-[#2DD4BF]' : 'text-[#0F9D8E] dark:text-[#2DD4BF]'}>
            QR
          </span>
        </span>
      )}
    </span>
  );
};

interface QrCodeVectorProps {
  seed: string;
  payloadUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  badgeText?: string;
  size?: number;
  frameless?: boolean;
  className?: string;
  svgRef?: React.Ref<SVGSVGElement>;
}

/**
 * Renders a genuine, ISO/IEC 18004 standard scannable SVG QR code encoding the item's recovery URL
 * with quiet-zone padding, finder-pattern accents, and optional callout bar (preserving 100% module integrity).
 */
export const QrCodeVector: React.FC<QrCodeVectorProps> = ({
  seed,
  payloadUrl,
  primaryColor = '#17243A',
  accentColor = '#19B5A5',
  badgeText,
  size = 180,
  frameless = false,
  className = '',
  svgRef,
}) => {
  const encodedPayload = React.useMemo(
    () => payloadUrl || buildQrRecoveryUrl(seed),
    [payloadUrl, seed]
  );

  const matrix = React.useMemo(
    () => generateQrMatrix(encodedPayload, undefined, 'M'),
    [encodedPayload]
  );

  const gridSize = matrix.length;
  const targetBoardInner = 132;
  const cellSize = targetBoardInner / gridSize;
  const padding = frameless ? 8 : 14;
  const boardSize = targetBoardInner + padding * 2;
  const totalHeight = badgeText ? boardSize + 28 : boardSize;

  return (
    <svg
      ref={svgRef}
      width={size}
      height={Math.round((size * totalHeight) / boardSize)}
      viewBox={`0 0 ${boardSize} ${totalHeight}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Scannable FindIt QR Code for ${seed}`}
      data-qr-payload={encodedPayload}
      className={`select-none ${className}`}
    >
      {/* Crisp White Quiet-Zone Background for Guaranteed Camera Contrast */}
      <rect
        x={frameless ? 0 : 1.5}
        y={frameless ? 0 : 1.5}
        width={frameless ? boardSize : boardSize - 3}
        height={frameless ? totalHeight : totalHeight - 3}
        rx={frameless ? 10 : 16}
        fill="#FFFFFF"
        stroke={frameless ? 'none' : primaryColor}
        strokeWidth={frameless ? 0 : 2.5}
      />

      {/* Genuine ISO 18004 QR Modules — Zero Occlusion */}
      {matrix.map((row, rIdx) =>
        row.map((isDark, cIdx) => {
          if (!isDark) return null;
          const isFinderCorner =
            (rIdx < 7 && cIdx < 7) ||
            (rIdx < 7 && cIdx >= gridSize - 7) ||
            (rIdx >= gridSize - 7 && cIdx < 7);
          const isFinderCenter =
            (rIdx >= 2 && rIdx <= 4 && cIdx >= 2 && cIdx <= 4) ||
            (rIdx >= 2 && rIdx <= 4 && cIdx >= gridSize - 5 && cIdx <= gridSize - 3) ||
            (rIdx >= gridSize - 5 && rIdx <= gridSize - 3 && cIdx >= 2 && cIdx <= 4);

          return (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={padding + cIdx * cellSize}
              y={padding + rIdx * cellSize}
              width={cellSize + 0.08}
              height={cellSize + 0.08}
              rx={isFinderCorner ? 0.5 : 0.35}
              fill={isFinderCenter ? accentColor : isFinderCorner ? primaryColor : '#0F172A'}
            />
          );
        })
      )}

      {/* Optional Bottom Callout Bar + Micro FindIt Pin */}
      {badgeText && (
        <g>
          <rect
            x="10"
            y={boardSize - 3}
            width={boardSize - 20}
            height="21"
            rx="6.5"
            fill={primaryColor}
          />
          <circle cx="20" cy={boardSize + 7.5} r="4.2" fill={accentColor} />
          <circle cx="20" cy={boardSize + 7.5} r="1.7" fill="#FFFFFF" />
          <text
            x={boardSize / 2 + 4}
            y={boardSize + 10.5}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="8.2"
            fontWeight="700"
            letterSpacing="0.4"
            fontFamily="Plus Jakarta Sans, Cairo, sans-serif"
          >
            {badgeText}
          </text>
        </g>
      )}
    </svg>
  );
};

/**
 * Triggers clean client-side download of a rendered QR SVG tag for high-res printing.
 */
export function downloadQrSvgMarkup(svgEl: SVGSVGElement | null, filename: string): boolean {
  if (!svgEl || typeof window === 'undefined') return false;
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgEl);
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${source}`], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
