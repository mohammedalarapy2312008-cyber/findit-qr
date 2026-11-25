import React from 'react';
import { TagShapeSilhouette } from '../../types/domain';
import { QrCodeVector } from './FindItLogo';

interface TagProductPreviewProps {
  seed: string;
  primaryHex: string;
  secondaryHex: string;
  badgeColorHex: string;
  silhouette?: TagShapeSilhouette;
  badgeText?: string;
  serialPreview?: string;
  size?: 'sm' | 'md' | 'lg';
}

function resolveSilhouette(silhouette?: TagShapeSilhouette): TagShapeSilhouette {
  return silhouette || 'dome_sticker';
}

/**
 * Renders physically distinct soft-3D product mockups for each FindIt QR tag form factor
 * (luggage loop with steel wire, dome epoxy sticker, chamfered anodized keyfob with split ring,
 * circular silicone-rimmed pet collar medal, riveted metal asset plate, wallet smart card,
 * and heavy-duty shield tag) embedding a genuine ISO-scannable QR vector.
 */
export const TagProductPreview: React.FC<TagProductPreviewProps> = ({
  seed,
  primaryHex,
  secondaryHex,
  badgeColorHex,
  silhouette,
  badgeText = 'SCAN TO RETURN',
  serialPreview,
  size = 'md',
}) => {
  const shape = resolveSilhouette(silhouette);
  const qrSize = size === 'lg' ? 140 : size === 'sm' ? 92 : 112;

  if (shape === 'luggage_loop') {
    return (
      <div className="relative flex flex-col items-center justify-center py-2">
        {/* Braided Steel Cable Loop */}
        <div
          className="w-16 h-8 rounded-t-full border-4 border-slate-400/80 dark:border-slate-500/80 -mb-2 z-0"
          aria-hidden="true"
        />
        <div
          style={{
            background: `linear-gradient(155deg, ${primaryHex} 0%, ${secondaryHex} 100%)`,
          }}
          className="relative z-10 rounded-2xl p-3.5 pt-5 shadow-lg border border-white/20 flex flex-col items-center gap-2.5 w-44"
        >
          {/* Top Punched Grommet Hole */}
          <div className="w-6 h-2 rounded-full bg-[#070D17]/70 border border-white/25" />
          <div className="bg-white rounded-xl p-1.5 shadow-inner">
            <QrCodeVector
              seed={seed}
              primaryColor={primaryHex}
              accentColor={badgeColorHex}
              size={qrSize}
              frameless
            />
          </div>
          <div
            style={{ backgroundColor: badgeColorHex }}
            className="w-full py-1 px-2 rounded-lg text-center text-[9px] font-extrabold tracking-wider text-[#17243A] uppercase truncate"
          >
            {badgeText}
          </div>
        </div>
      </div>
    );
  }

  if (shape === 'chamfer_keyfob') {
    return (
      <div className="relative flex items-center justify-center py-2">
        {/* Metallic Split Keyring on Top-Left */}
        <div className="flex flex-col items-center">
          <div className="w-9 h-9 rounded-full border-[3.5px] border-slate-400 dark:border-slate-500 -mb-3 z-0 shadow-sm" />
          <div
            style={{
              background: `linear-gradient(145deg, ${primaryHex} 0%, ${secondaryHex} 100%)`,
            }}
            className="relative z-10 rounded-[26px] px-4 pt-5 pb-3.5 shadow-lg border border-white/25 flex flex-col items-center gap-2"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-slate-900/75 border-2 border-slate-300/70" />
            <div className="bg-white rounded-2xl p-1.5 shadow-inner">
              <QrCodeVector
                seed={seed}
                primaryColor={primaryHex}
                accentColor={badgeColorHex}
                size={qrSize - 6}
                frameless
              />
            </div>
            <span className="text-[9px] font-mono font-bold text-white/90 tracking-widest uppercase">
              {serialPreview || 'KEYFOB · QR'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (shape === 'pet_medal') {
    return (
      <div className="relative flex flex-col items-center justify-center py-2">
        {/* Collar Clip Ring */}
        <div className="w-6 h-6 rounded-full border-[3px] border-slate-400 -mb-2 z-0" />
        {/* Circular Silicone Bumper Rim */}
        <div
          style={{
            borderColor: badgeColorHex,
            backgroundColor: primaryHex,
          }}
          className="relative z-10 w-40 h-40 rounded-full border-[6px] shadow-lg flex flex-col items-center justify-center p-3"
        >
          <div className="bg-white rounded-2xl p-1.5 shadow-sm">
            <QrCodeVector
              seed={seed}
              primaryColor={secondaryHex}
              accentColor={primaryHex}
              size={qrSize - 16}
              frameless
            />
          </div>
          <span className="mt-1.5 text-[8px] font-extrabold tracking-wider text-white bg-[#17243A]/85 px-2 py-0.5 rounded-full uppercase">
            PET GUARDIAN
          </span>
        </div>
      </div>
    );
  }

  if (shape === 'metal_plate') {
    return (
      <div className="relative flex items-center justify-center py-3">
        <div
          style={{
            background: `linear-gradient(135deg, ${primaryHex} 0%, ${secondaryHex} 100%)`,
          }}
          className="relative rounded-xl px-4 py-3.5 shadow-lg border border-slate-400/40 flex items-center gap-3.5 min-w-[220px]"
        >
          {/* 4 Corner Rivets */}
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300/80 absolute top-2 start-2" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300/80 absolute top-2 end-2" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300/80 absolute bottom-2 start-2" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300/80 absolute bottom-2 end-2" />

          <div className="bg-white rounded-lg p-1.5 shrink-0">
            <QrCodeVector
              seed={seed}
              primaryColor={primaryHex}
              accentColor={badgeColorHex}
              size={qrSize - 16}
              frameless
            />
          </div>
          <div className="text-start space-y-1.5 min-w-0">
            <p className="text-[9px] font-mono font-bold text-[#FFD166] tracking-wider uppercase">
              ASSET TAG
            </p>
            <p className="text-[11px] font-extrabold text-white leading-tight">
              FINDIT QR PRO
            </p>
            <p className="text-[9px] font-mono text-slate-300 truncate">
              {serialPreview || 'FQR-ASSET-01'}
            </p>
            <span
              style={{ backgroundColor: badgeColorHex }}
              className="inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold text-[#17243A]"
            >
              SCAN ID
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (shape === 'smart_card') {
    return (
      <div className="relative flex items-center justify-center py-3">
        <div
          style={{
            background: `linear-gradient(125deg, ${secondaryHex} 0%, ${primaryHex} 100%)`,
          }}
          className="relative rounded-2xl p-3.5 shadow-lg border border-white/20 flex items-center justify-between gap-3 w-56"
        >
          <div className="space-y-2 text-start">
            {/* Metallic Contact Chip Accent */}
            <div
              style={{ borderColor: badgeColorHex }}
              className="w-7 h-5 rounded border bg-white/15"
            />
            <p className="text-[10px] font-extrabold text-white tracking-tight">
              FindIt SmartCard
            </p>
            <p className="text-[8.5px] font-mono text-white/75 uppercase">
              {badgeText}
            </p>
          </div>
          <div className="bg-white rounded-xl p-1 shrink-0">
            <QrCodeVector
              seed={seed}
              primaryColor={primaryHex}
              accentColor={badgeColorHex}
              size={qrSize - 18}
              frameless
            />
          </div>
        </div>
      </div>
    );
  }

  if (shape === 'shield_tag') {
    return (
      <div className="relative flex flex-col items-center justify-center py-2">
        <div
          style={{
            background: `linear-gradient(160deg, ${primaryHex} 0%, ${secondaryHex} 100%)`,
            borderColor: badgeColorHex,
          }}
          className="relative rounded-t-2xl rounded-b-[42px] border-2 px-4 pt-3.5 pb-5 shadow-lg flex flex-col items-center gap-2"
        >
          <div className="w-4 h-1.5 rounded-full bg-white/30" />
          <div className="bg-white rounded-xl p-1.5 shadow-sm">
            <QrCodeVector
              seed={seed}
              primaryColor={primaryHex}
              accentColor={badgeColorHex}
              size={qrSize - 8}
              frameless
            />
          </div>
          <span
            style={{ color: badgeColorHex }}
            className="text-[8.5px] font-extrabold tracking-widest uppercase"
          >
            {badgeText}
          </span>
        </div>
      </div>
    );
  }

  // Default: dome_sticker (3D glossy epoxy dome sticker)
  return (
    <div className="relative flex items-center justify-center py-2">
      <div
        style={{
          background: `linear-gradient(145deg, ${primaryHex} 0%, ${secondaryHex} 100%)`,
        }}
        className="relative rounded-[22px] p-3 shadow-lg border border-white/30 flex flex-col items-center gap-2"
      >
        {/* Subtle Specular Dome Gloss Bar */}
        <div
          className="pointer-events-none absolute inset-x-3 top-1.5 h-3 rounded-full bg-white/20"
          aria-hidden="true"
        />
        <div className="bg-white rounded-xl p-1.5 shadow-inner relative z-10">
          <QrCodeVector
            seed={seed}
            primaryColor={primaryHex}
            accentColor={badgeColorHex}
            size={qrSize}
            frameless
          />
        </div>
        <span className="text-[8.5px] font-extrabold tracking-wider text-white uppercase">
          {badgeText}
        </span>
      </div>
    </div>
  );
};
