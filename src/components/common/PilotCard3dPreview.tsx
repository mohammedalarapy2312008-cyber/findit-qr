import React, { useEffect, useMemo, useState } from 'react';
import { PrintMaterialFinish, TagDesignTemplate } from '../../types/domain';
import { bakePilot3dViews } from '../../utils/pilot3dMockupBaker';
import { buildPilot3dTextureSurfaceSvg } from '../../utils/pilotLabelArtwork';

interface PilotCard3dPreviewProps {
  design: TagDesignTemplate;
  darkTheme?: boolean;
  materialFinish?: PrintMaterialFinish;
  viewAngle?: 'hero' | 'macro' | 'top';
  className?: string;
}

/**
 * Renders the Primary Storefront Product Image for Pilot Printable Labels:
 * Uses the baked Three.js 3D Mockup (100% derived from the Single-Source-of-Truth Print Artwork SVG)
 * with instant crisp SVG preview while baking. Zero open WebGL contexts per card.
 */
export const PilotCard3dPreview: React.FC<PilotCard3dPreviewProps> = ({
  design,
  darkTheme = false,
  materialFinish,
  viewAngle = 'hero',
  className = '',
}) => {
  const finish = materialFinish || design.printSpecs?.defaultMaterial || 'waterproof_vinyl';
  const [bakedUrls, setBakedUrls] = useState<{
    heroUrl: string;
    macroUrl: string;
    topUrl: string;
  } | null>(null);

  const fallbackSvgDataUrl = useMemo(() => {
    const svg = buildPilot3dTextureSurfaceSvg(design, {
      materialFinish: finish,
      scalePxPerMm: 8,
    });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [design, finish]);

  useEffect(() => {
    let cancelled = false;
    void bakePilot3dViews(design, { materialFinish: finish }, darkTheme)
      .then((res) => {
        if (!cancelled) setBakedUrls(res);
      })
      .catch(() => {
        // Keep instant SVG fallback if offscreen render is unavailable
      });
    return () => {
      cancelled = true;
    };
  }, [design, finish, darkTheme]);

  const activeSrc = bakedUrls
    ? viewAngle === 'macro'
      ? bakedUrls.macroUrl
      : viewAngle === 'top'
      ? bakedUrls.topUrl
      : bakedUrls.heroUrl
    : fallbackSvgDataUrl;

  return (
    <div
      data-testid={`pilot-3d-thumb-${design.id}`}
      data-baked={bakedUrls ? 'true' : 'false'}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}
    >
      <img
        src={activeSrc}
        alt={`${design.titleEn} 3D printable sticker preview`}
        className={`w-full h-full transition-transform duration-500 ${
          bakedUrls ? 'object-contain' : 'object-contain p-5 drop-shadow-md'
        }`}
      />
    </div>
  );
};
