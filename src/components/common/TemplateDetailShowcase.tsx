import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Camera,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileCode2,
  Heart,
  Layers,
  Lock,
  Palette,
  Printer,
  Ruler,
  ShoppingBag,
  Sliders,
  Sparkles,
  ZoomIn,
} from 'lucide-react';
import { PrintMaterialFinish, TagDesignTemplate } from '../../types/domain';
import { getTemplateShowcaseMedia } from '../../data/pilotShowcaseMedia';
import {
  buildPilotCleanTrimSvg,
  buildPilotEditableSvg,
  buildPilotPrintReadySvg,
  getPilotTrimDimensionsMm,
  PilotLabelRenderOptions,
  triggerPrintReadyPngDownload,
  triggerSvgStringDownload,
} from '../../utils/pilotLabelArtwork';
import {
  getRealTemplatePrintSpecsSummary,
  TemplateOwnershipStatus,
} from '../../utils/templateLibraryAudit';
import { downloadQrSvgMarkup, QrCodeVector } from '../brand/FindItLogo';
import { TagProductPreview } from '../brand/TagProductPreview';
import { Label3DMockupStage } from './Label3DMockupStage';

export type GalleryVisualMode = 'lifestyle' | 'detail' | 'studio_3d' | 'print';
type AccordionSectionId = 'story' | 'materials' | 'dimensions' | 'print_specs' | 'included' | 'uses';

interface TemplateDetailShowcaseProps {
  design: TagDesignTemplate;
  lang: 'ar' | 'en';
  darkTheme: boolean;
  isFavorite: boolean;
  showFavorites?: boolean;
  ownershipStatus?: TemplateOwnershipStatus;
  userPlanLabel?: string;
  draftReturnActive?: boolean;
  onToggleFavorite: () => void;
  onPurchase: () => void;
  onUseDesign: () => void;
  onBackToStore: () => void;
  onOpenLibrary: () => void;
  onViewPurchases: () => void;
  onNotify: (type: 'success' | 'info', title: string, desc: string) => void;
}

const FINISH_LABELS: Record<PrintMaterialFinish, { ar: string; en: string }> = {
  soft_matte_foil: { ar: 'فينيل مطفي حريري (Soft-Touch Matte)', en: 'Soft-Touch Matte Laminated Vinyl' },
  waterproof_vinyl: { ar: 'فينيل مطفي مقاوم للماء والاحتكاك', en: 'Waterproof Matte Vinyl' },
  glossy_vinyl: { ar: 'فينيل لامع قابل للغسل UV', en: 'Washable UV Gloss Vinyl' },
  textured_outdoor_vinyl: { ar: 'فينيل خارجي فائق التحمل', en: 'Heavy-Duty Outdoor Vinyl' },
  brushed_polyester: { ar: 'بوليستر صناعي مطفي مقاوم للمذيبات', en: 'Brushed Industrial Polyester' },
  transparent_vinyl: { ar: 'فينيل شفاف لاصق + أساس أبيض للكود', en: 'Transparent Vinyl + White Underbase' },
};

const DOMAIN_BADGE: Record<string, { ar: string; en: string }> = {
  personal: { ar: 'الممتلكات الشخصية', en: 'Personal Items' },
  travel: { ar: 'السفر والأمتعة', en: 'Travel & Luggage' },
  family: { ar: 'العائلة والأطفال', en: 'Family & Kids' },
  pets: { ar: 'الحيوانات الأليفة', en: 'Pets' },
  business: { ar: 'الشركات والأصول', en: 'Businesses' },
  anime_cartoon: { ar: 'الأنمي والكرتون', en: 'Anime & Cartoon' },
};

export const TemplateDetailShowcase: React.FC<TemplateDetailShowcaseProps> = ({
  design,
  lang,
  darkTheme,
  isFavorite,
  showFavorites = true,
  ownershipStatus,
  userPlanLabel,
  draftReturnActive = false,
  onToggleFavorite,
  onPurchase,
  onUseDesign,
  onBackToStore,
  onOpenLibrary,
  onViewPurchases,
  onNotify,
}) => {
  const media = getTemplateShowcaseMedia(design.id);
  const isPilotProduct = Boolean(design.isPilotShowcase || design.pilotArtStyle);
  const isBatch02Sticker = Boolean(
    design.printFileUrl?.startsWith('/assets/batch02/print-ready/') &&
      design.originalDesignUrl?.startsWith('/assets/batch02/editable/')
  );
  const isMasterCollectionSticker = Boolean(
    design.printFileUrl?.startsWith('/assets/master-collection/print-ready/') &&
      design.originalDesignUrl?.startsWith('/assets/master-collection/editable/')
  );
  const isStaticProductionSticker = isBatch02Sticker || isMasterCollectionSticker;
  const staticPrintPngUrl = isBatch02Sticker
    ? `/assets/batch02/print-png-300dpi/${design.slug}.print-300dpi.png`
    : isMasterCollectionSticker
    ? `/assets/master-collection/print-png-300dpi/${design.slug}.print-300dpi.png`
    : '';
  const isFreeTpl = design.isFree || design.priceSar === 0;
  const isFixedCustomization = design.customizationMode === 'fixed';
  const canUseOrDownloadTemplate =
    isFreeTpl ||
    ownershipStatus === 'free' ||
    ownershipStatus === 'purchased' ||
    ownershipStatus === 'included_in_plan';

  // Default gallery mode: Lifestyle if lifestyle photography exists, otherwise 3D Studio (for pilots) or Detail
  const [galleryMode, setGalleryMode] = useState<GalleryVisualMode>(
    media?.hasLifestylePhotography ? 'lifestyle' : isPilotProduct ? 'studio_3d' : 'detail'
  );
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [macroInspectZoom, setMacroInspectZoom] = useState(false);
  const [printSubMode, setPrintSubMode] = useState<'print_ready' | 'editable_source'>('print_ready');
  const [showPrintGuides, setShowPrintGuides] = useState(true);
  const [exportingPng, setExportingPng] = useState(false);

  const isBilingualBatchStyle =
    design.pilotArtStyle === 'pebble_pop' ||
    design.pilotArtStyle === 'metro_ticket' ||
    design.pilotArtStyle === 'jelly_cube' ||
    design.pilotArtStyle === 'hexa_pulse' ||
    design.pilotArtStyle === 'flora_loop' ||
    design.pilotArtStyle === 'mono_mark' ||
    design.pilotArtStyle === 'pocket_orbit' ||
    design.pilotArtStyle === 'astro_buddy' ||
    design.pilotArtStyle === 'campus_bloom' ||
    design.pilotArtStyle === 'game_mode' ||
    design.pilotArtStyle === 'purrfect_tag' ||
    design.pilotArtStyle === 'retro_explorer';

  // Live customization state synced across Detail / 3D / Print / Editable SVG
  const [calloutText, setCalloutText] = useState(
    design.defaultCalloutText || (isPilotProduct ? 'PERSONAL PROPERTY' : 'SCAN TO RETURN')
  );
  const [customSubLabel, setCustomSubLabel] = useState(
    isBilingualBatchStyle
      ? 'امسح الرمز للتواصل مع المالك'
      : 'FINDIT QR · RECOVERY TAG'
  );
  const [serialCode, setSerialCode] = useState(
    `FQR-${design.slug.slice(0, 5).toUpperCase()}-2026`
  );
  const [primaryHex, setPrimaryHex] = useState(design.primaryHex);
  const [secondaryHex, setSecondaryHex] = useState(design.secondaryHex);
  const [accentHex, setAccentHex] = useState(design.badgeColorHex);
  const [materialFinish, setMaterialFinish] = useState<PrintMaterialFinish>(
    design.printSpecs?.defaultMaterial || 'soft_matte_foil'
  );

  // Clean collapsible disclosure states
  const [openSections, setOpenSections] = useState<Record<AccordionSectionId, boolean>>({
    story: true,
    materials: false,
    dimensions: false,
    print_specs: false,
    included: false,
    uses: false,
  });

  const legacySvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    setGalleryMode(media?.hasLifestylePhotography ? 'lifestyle' : isPilotProduct ? 'studio_3d' : 'detail');
    setActiveSlideIdx(0);
    setMacroInspectZoom(false);
    setCalloutText(design.defaultCalloutText || (isPilotProduct ? 'PERSONAL PROPERTY' : 'SCAN TO RETURN'));
    setCustomSubLabel(
      isBilingualBatchStyle
        ? 'امسح الرمز للتواصل مع المالك'
        : 'FINDIT QR · RECOVERY TAG'
    );
    setPrimaryHex(design.primaryHex);
    setSecondaryHex(design.secondaryHex);
    setAccentHex(design.badgeColorHex);
    setSerialCode(`FQR-${design.slug.slice(0, 5).toUpperCase()}-2026`);
    setMaterialFinish(design.printSpecs?.defaultMaterial || 'soft_matte_foil');
  }, [
    design.id,
    design.defaultCalloutText,
    design.primaryHex,
    design.secondaryHex,
    design.badgeColorHex,
    design.pilotArtStyle,
    design.slug,
    design.printSpecs?.defaultMaterial,
    media?.hasLifestylePhotography,
    isPilotProduct,
    isBilingualBatchStyle,
  ]);

  const toggleSection = (sec: AccordionSectionId) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const renderOptions: PilotLabelRenderOptions = useMemo(
    () => ({
      calloutText,
      customSubLabel,
      serialCode,
      primaryHex,
      secondaryHex,
      accentHex,
      materialFinish,
      showPrintGuides,
    }),
    [calloutText, customSubLabel, serialCode, primaryHex, secondaryHex, accentHex, materialFinish, showPrintGuides]
  );

  const dims = useMemo(() => getPilotTrimDimensionsMm(design), [design]);

  const editableSvg = useMemo(
    () => (isPilotProduct ? buildPilotEditableSvg(design, renderOptions) : ''),
    [isPilotProduct, design, renderOptions]
  );
  const printReadySvg = useMemo(
    () => (isPilotProduct ? buildPilotPrintReadySvg(design, renderOptions) : ''),
    [isPilotProduct, design, renderOptions]
  );
  const surfaceArtworkSvg = useMemo(
    () =>
      isPilotProduct
        ? buildPilotCleanTrimSvg(design, { ...renderOptions, scalePxPerMm: 12 })
        : '',
    [isPilotProduct, design, renderOptions]
  );

  const printReadyDataUri = useMemo(
    () => (printReadySvg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(printReadySvg)}` : ''),
    [printReadySvg]
  );
  const editableDataUri = useMemo(
    () => (editableSvg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(editableSvg)}` : ''),
    [editableSvg]
  );
  const surfaceDataUri = useMemo(
    () => (surfaceArtworkSvg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(surfaceArtworkSvg)}` : ''),
    [surfaceArtworkSvg]
  );

  const triggerDirectAssetDownload = async (assetUrl: string, filename: string) => {
    try {
      const res = await fetch(assetUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      const a = document.createElement('a');
      a.href = assetUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDownloadEditable = () => {
    if (isStaticProductionSticker && design.originalDesignUrl) {
      void triggerDirectAssetDownload(design.originalDesignUrl, `${design.slug}.editable.svg`);
      onNotify(
        'success',
        lang === 'ar' ? 'تم تنزيل ملف التصميم الأصلي' : 'Editable Source SVG Downloaded',
        lang === 'ar'
          ? 'ملف SVG مسطح منظم بطبقات قابلة للتعديل ومساحة QR بيضاء فارغة (منفصل تمامًا عن معاينة المنتج).'
          : 'Flat layered Editable Source SVG with blank dynamic QR zone downloaded.'
      );
      return;
    }
    if (!editableSvg) return;
    triggerSvgStringDownload(editableSvg, `${design.slug}-editable-source.svg`);
    onNotify(
      'success',
      lang === 'ar' ? 'تم تنزيل ملف التصميم الأصلي' : 'Editable Source SVG Downloaded',
      lang === 'ar'
        ? 'الملف يحتوي على طبقات متجهية منظمة (Background, Artwork, Typography, QR Code, Cutline).'
        : 'Vector SVG contains structured editable layers (<g id="layer-...">).'
    );
  };

  const handleDownloadPrintSvg = () => {
    if (isStaticProductionSticker && design.printFileUrl) {
      void triggerDirectAssetDownload(design.printFileUrl, `${design.slug}.print-ready.svg`);
      onNotify(
        'success',
        lang === 'ar' ? 'تم تنزيل ملف الطباعة النهائي' : 'Print-Ready SVG Downloaded',
        lang === 'ar'
          ? `ملف طباعة مسطح مضبوط بالمليمتر (${dims.widthMm}×${dims.heightMm}mm) مع 3mm Bleed وخط قص CutContour.`
          : `Flat pre-press SVG calibrated at ${dims.widthMm}×${dims.heightMm}mm with +3mm bleed & magenta CutContour.`
      );
      return;
    }

    if (!isPilotProduct) {
      const ok = downloadQrSvgMarkup(legacySvgRef.current, `finditqr-${design.slug}`);
      if (ok) {
        onNotify(
          'success',
          lang === 'ar' ? 'تم تصدير ملف الكود SVG' : 'QR SVG Downloaded',
          lang === 'ar'
            ? `تم تنزيل التصميم (${design.slug}.svg) بدقة متجهية للطباعة.`
            : `Downloaded scalable vector (${design.slug}.svg) ready for print.`
        );
      }
      return;
    }

    const cleanPrintSvg = buildPilotPrintReadySvg(design, {
      ...renderOptions,
      showPrintGuides: true,
    });
    triggerSvgStringDownload(cleanPrintSvg, `${design.slug}-print-ready-300dpi.svg`);
    onNotify(
      'success',
      lang === 'ar' ? 'تم تنزيل ملف الطباعة النهائي' : 'Print-Ready SVG Downloaded',
      lang === 'ar'
        ? `مضبوط بالمليمتر (${dims.widthMm}×${dims.heightMm}mm) مع 3mm Bleed وخط قص CutContour.`
        : `Calibrated at ${dims.widthMm}×${dims.heightMm}mm with 3mm bleed & magenta CutContour.`
    );
  };

  const handleDownloadPrintPng = async () => {
    if (isStaticProductionSticker && staticPrintPngUrl) {
      setExportingPng(true);
      try {
        await triggerDirectAssetDownload(staticPrintPngUrl, `${design.slug}.print-300dpi.png`);
        onNotify(
          'success',
          lang === 'ar' ? 'تم تنزيل ملف الطباعة 300 DPI PNG' : '300 DPI Print PNG Downloaded',
          lang === 'ar'
            ? `نسخة طباعة مسطحة بدقة 300 DPI بمقاس (${dims.widthMm}×${dims.heightMm}mm) ومساحة QR بيضاء جاهزة للطباعة بدون أي ظلال استوديو.`
            : `Flat 300 DPI production PNG (${dims.widthMm}×${dims.heightMm}mm) with blank white QR zone and zero studio backdrop.`
        );
      } finally {
        setExportingPng(false);
      }
      return;
    }

    if (!printReadySvg) return;
    setExportingPng(true);
    try {
      const sheetW = dims.widthMm + (showPrintGuides ? 17 : dims.bleedMm * 2);
      const sheetH = dims.heightMm + (showPrintGuides ? 22.5 : dims.bleedMm * 2);
      await triggerPrintReadyPngDownload(
        printReadySvg,
        `${design.slug}-300dpi.png`,
        sheetW,
        sheetH,
        300
      );
      onNotify(
        'success',
        lang === 'ar' ? 'تم تصدير صورة 300 DPI للطباعة' : '300 DPI Print PNG Downloaded',
        lang === 'ar'
          ? 'صورة طباعة عالية الدقة مطابقة لملف الطباعة ورمز QR الحقيقي.'
          : 'High-resolution raster exported at exact millimeter 300 DPI scale.'
      );
    } finally {
      setExportingPng(false);
    }
  };

  const paletteSwatches = [
    design.primaryHex,
    '#151A24',
    '#1D4ED8',
    '#0F5243',
    '#1B2432',
    '#7C2D12',
  ].filter((v, idx, arr) => arr.indexOf(v) === idx);

  const threeColorConfig = useMemo(() => {
    switch (design.pilotArtStyle) {
      case 'metro_ticket':
        return {
          primaryAr: 'الكحلي الكلاسيكي (Navy):',
          primaryEn: 'Travel Navy Color:',
          primarySwatches: [design.primaryHex, '#1E293B', '#14532D', '#312E81', '#0F172A'],
          secondaryAr: 'أرضية التذكرة (Cream):',
          secondaryEn: 'Vintage Cream:',
          secondarySwatches: [design.secondaryHex, '#FFFFFF', '#FEF3C7', '#EFF6FF'],
          accentAr: 'الأحمر البريدي (Airmail Red):',
          accentEn: 'Airmail Red:',
          accentSwatches: [design.badgeColorHex, '#EA580C', '#0F766E', '#B91C1C'],
        };
      case 'jelly_cube':
        return {
          primaryAr: 'البنفسجي الأساسي (Violet):',
          primaryEn: 'Violet Jelly:',
          primarySwatches: [design.primaryHex, '#6366F1', '#0EA5E9', '#9333EA', '#4F46E5'],
          secondaryAr: 'الوردي اللامع (Pop Pink):',
          secondaryEn: 'Pop Pink:',
          secondarySwatches: [design.secondaryHex, '#F43F5E', '#FB7185', '#EC4899'],
          accentAr: 'السيان المضيء (Sky Cyan):',
          accentEn: 'Sky Cyan:',
          accentSwatches: [design.badgeColorHex, '#2DD4BF', '#38BDF8', '#A3E635'],
        };
      case 'hexa_pulse':
        return {
          primaryAr: 'القاعدة الكحلية (Deep Navy):',
          primaryEn: 'Deep Navy Base:',
          primarySwatches: [design.primaryHex, '#0F172A', '#1E1B4B', '#111827', '#134E4A'],
          secondaryAr: 'توهج السيان (Neon Cyan):',
          secondaryEn: 'Neon Cyan:',
          secondarySwatches: [design.secondaryHex, '#38BDF8', '#2DD4BF', '#A855F7'],
          accentAr: 'الأصفر التقني (Signal Yellow):',
          accentEn: 'Signal Yellow:',
          accentSwatches: [design.badgeColorHex, '#F97316', '#84CC16', '#F43F5E'],
        };
      case 'flora_loop':
        return {
          primaryAr: 'الأخضر الغابي (Forest Green):',
          primaryEn: 'Forest Green:',
          primarySwatches: [design.primaryHex, '#166534', '#0F766E', '#1E3A8A', '#065F46'],
          secondaryAr: 'الخلفية الكريمية (Cream Base):',
          secondaryEn: 'Warm Cream:',
          secondarySwatches: [design.secondaryHex, '#FFFFFF', '#F0FDF4', '#FEF9C3'],
          accentAr: 'زهور الكركديه (Hibiscus Pink):',
          accentEn: 'Hibiscus Pink:',
          accentSwatches: [design.badgeColorHex, '#FB7185', '#F472B6', '#F59E0B'],
        };
      case 'mono_mark':
        return {
          primaryAr: 'الكحلي الأحادي (Ink Navy):',
          primaryEn: 'Ink Navy Frame:',
          primarySwatches: [design.primaryHex, '#111827', '#1E293B', '#0F172A', '#1E1B4B'],
          secondaryAr: 'الأرضية البيضاء (Architectural White):',
          secondaryEn: 'Architectural White:',
          secondarySwatches: [design.secondaryHex, '#FFFFFF', '#F1F5F9', '#FEFCE8'],
          accentAr: 'العنبري المضيء (Signal Amber):',
          accentEn: 'Signal Amber:',
          accentSwatches: [design.badgeColorHex, '#F59E0B', '#EA580C', '#14B8A6'],
        };
      case 'pocket_orbit':
        return {
          primaryAr: 'فضاء الكحلي العميق (Cosmic Navy):',
          primaryEn: 'Cosmic Navy:',
          primarySwatches: [design.primaryHex, '#0B1B3B', '#1E1B4B', '#0F172A', '#312E81'],
          secondaryAr: 'حدود السيان المدارية (Orbit Cyan):',
          secondaryEn: 'Orbit Cyan:',
          secondarySwatches: [design.secondaryHex, '#38BDF8', '#2DD4BF', '#A855F7'],
          accentAr: 'البرتقالي الصاروخي (Rocket Orange):',
          accentEn: 'Rocket Orange:',
          accentSwatches: [design.badgeColorHex, '#EF4444', '#F59E0B', '#EC4899'],
        };
      case 'astro_buddy':
        return {
          primaryAr: 'السديم النيلي (Space Indigo):',
          primaryEn: 'Deep Indigo:',
          primarySwatches: [design.primaryHex, '#1E1B4B', '#06133D', '#2E1065', '#0F172A'],
          secondaryAr: 'أزرق السديم (Nebula Blue):',
          secondaryEn: 'Nebula Blue:',
          secondarySwatches: [design.secondaryHex, '#60A5FA', '#00E5FF', '#8B5CF6'],
          accentAr: 'الذهبي الكوني (Solar Gold):',
          accentEn: 'Solar Gold:',
          accentSwatches: [design.badgeColorHex, '#F59E0B', '#FF7A00', '#FB7185'],
        };
      case 'campus_bloom':
        return {
          primaryAr: 'التركواز الجامعي (Campus Teal):',
          primaryEn: 'Campus Teal:',
          primarySwatches: [design.primaryHex, '#0F766E', '#1D4ED8', '#047857', '#334155'],
          secondaryAr: 'الخلفية الكريمية (Parchment Cream):',
          secondaryEn: 'Warm Cream:',
          secondarySwatches: [design.secondaryHex, '#FFFFFF', '#ECFDF5', '#FEF3C7'],
          accentAr: 'وردي الباستيل (Blossom Pink):',
          accentEn: 'Blossom Pink:',
          accentSwatches: [design.badgeColorHex, '#FB7185', '#A855F7', '#F59E0B'],
        };
      case 'game_mode':
        return {
          primaryAr: 'الليل النيوني (Arcade Midnight):',
          primaryEn: 'Arcade Midnight:',
          primarySwatches: [design.primaryHex, '#090D16', '#1E1B4B', '#18181B', '#0B1B3B'],
          secondaryAr: 'السيان الكهربائي (Electric Cyan):',
          secondaryEn: 'Electric Cyan:',
          secondarySwatches: [design.secondaryHex, '#38BDF8', '#2DD4BF', '#A3E635'],
          accentAr: 'الماجنتا النيوني (Neon Magenta):',
          accentEn: 'Neon Magenta:',
          accentSwatches: [design.badgeColorHex, '#EC4899', '#F97316', '#A855F7'],
        };
      case 'purrfect_tag':
        return {
          primaryAr: 'البرقوقي المرح (Berry Plum):',
          primaryEn: 'Berry Plum:',
          primarySwatches: [design.primaryHex, '#7E22CE', '#9333EA', '#4C1D95', '#BE185D'],
          secondaryAr: 'الكريمي الدافئ (Warm Cream):',
          secondaryEn: 'Warm Cream:',
          secondarySwatches: [design.secondaryHex, '#FFFFFF', '#FDF2F8', '#FEF3C7'],
          accentAr: 'الوردي المرجاني (Coral Pink):',
          accentEn: 'Coral Pink:',
          accentSwatches: [design.badgeColorHex, '#F472B6', '#EC4899', '#F59E0B'],
        };
      case 'retro_explorer':
        return {
          primaryAr: 'البني الجلدي العتيق (Saddle Brown):',
          primaryEn: 'Saddle Leather:',
          primarySwatches: [design.primaryHex, '#78350F', '#14532D', '#0D2B52', '#3F2E21'],
          secondaryAr: 'ورق الرق القديم (Antique Parchment):',
          secondaryEn: 'Parchment Cream:',
          secondarySwatches: [design.secondaryHex, '#FFFFFF', '#FEF3C7', '#FAF5FF'],
          accentAr: 'التيراكوتا الكلاسيكية (Terracotta):',
          accentEn: 'Passport Terracotta:',
          accentSwatches: [design.badgeColorHex, '#DC2626', '#D97706', '#0F766E'],
        };
      case 'pebble_pop':
      default:
        return {
          primaryAr: 'الأمواج الفيروزية (Teal Waves):',
          primaryEn: 'Teal Waves Color:',
          primarySwatches: [design.primaryHex, '#14B8A6', '#2563EB', '#0F766E', '#6366F1'],
          secondaryAr: 'الخلفية الكريمية (Cream Base):',
          secondaryEn: 'Cream Base Color:',
          secondarySwatches: [design.secondaryHex, '#FFFFFF', '#FEF3C7', '#F0FDFA'],
          accentAr: 'اللمسات البرتقالية (Orange Accents):',
          accentEn: 'Orange Accents Color:',
          accentSwatches: [design.badgeColorHex, '#E11D48', '#F59E0B', '#EA580C'],
        };
    }
  }, [design.pilotArtStyle, design.primaryHex, design.secondaryHex, design.badgeColorHex]);

  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;
  const domainLabel = DOMAIN_BADGE[design.domainCategory || 'personal']?.[lang] || '';
  const activeLifestyleSlide = media?.lifestyleSlides[activeSlideIdx] || media?.lifestyleSlides[0];

  return (
    <div className="py-10 lg:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Top Breadcrumb Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          type="button"
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#17243A] dark:text-white hover:text-[#2563EB] dark:hover:text-[#19B5A5] transition-colors"
        >
          <BackIcon className="w-4 h-4" />
          <span>{lang === 'ar' ? 'العودة إلى مكتبة التصاميم' : 'Back to Design Library'}</span>
        </button>

        <div className="flex items-center gap-4 text-xs">
          <button
            type="button"
            onClick={onOpenLibrary}
            className="font-semibold text-slate-600 dark:text-slate-300 hover:text-[#17243A] dark:hover:text-white transition-colors"
          >
            {lang === 'ar' ? 'مكتبة لوحة المستخدم' : 'Workspace Library'}
          </button>
          <span className="h-3.5 w-px bg-slate-200 dark:bg-slate-700" />
          <button
            type="button"
            onClick={onViewPurchases}
            className="font-semibold text-slate-600 dark:text-slate-300 hover:text-[#17243A] dark:hover:text-white transition-colors"
          >
            {lang === 'ar' ? 'سجل المشتريات والتراخيص' : 'Purchases & Licenses'}
          </button>
        </div>
      </div>

      {/* HERO SHOWCASE + GALLERY & EDITORIAL SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* LEFT COLUMN (7 cols): Multi-Mode Product Gallery */}
        <section
          aria-label={lang === 'ar' ? 'معرض معاينة المنتج' : 'Product Gallery & Inspection Stage'}
          className="lg:col-span-7 space-y-4 lg:sticky lg:top-24"
        >
          {/* Mode Switcher Tabs */}
          <div
            role="tablist"
            aria-label={lang === 'ar' ? 'أوضاع عرض التصميم' : 'Visual Showcase Modes'}
            className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-[#F4F7FB] dark:bg-[#0B1322] border border-slate-200/80 dark:border-slate-800"
          >
            {(
              [
                {
                  id: 'lifestyle' as const,
                  icon: Camera,
                  ar: 'معرض الصور (4)',
                  en: 'Gallery (4 Shots)',
                },
                {
                  id: 'detail' as const,
                  icon: ZoomIn,
                  ar: 'التفاصيل والخامة',
                  en: 'Detail & Macro',
                },
                {
                  id: 'studio_3d' as const,
                  icon: Box,
                  ar: 'استوديو 3D تفاعلي',
                  en: '3D Studio',
                },
                {
                  id: 'print' as const,
                  icon: Printer,
                  ar: 'معاينة الطباعة',
                  en: 'Print Preview',
                },
              ] as const
            ).map((mode) => {
              const Icon = mode.icon;
              const isActive = galleryMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  data-testid={`gallery-mode-${mode.id}`}
                  onClick={() => setGalleryMode(mode.id)}
                  className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white dark:bg-[#17243A] text-[#17243A] dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#17243A] dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === 'ar' ? mode.ar : mode.en}</span>
                </button>
              );
            })}
          </div>

          {/* MODE 1: LIFESTYLE */}
          {galleryMode === 'lifestyle' && (
            <div data-testid="gallery-panel-lifestyle" className="space-y-3">
              {media?.hasLifestylePhotography && activeLifestyleSlide ? (
                <>
                  <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#EFECE6] dark:bg-[#0B1322] border border-slate-200/80 dark:border-slate-800">
                    <img
                      key={activeLifestyleSlide.id}
                      src={activeLifestyleSlide.imageUrl}
                      alt={lang === 'ar' ? activeLifestyleSlide.altAr : activeLifestyleSlide.altEn}
                      className="w-full h-full object-contain transition-opacity duration-300"
                    />
                  </div>

                  {/* 4-Shot Presentation Thumbnail Strip */}
                  {media.lifestyleSlides.length > 1 && (
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {media.lifestyleSlides.map((slide, idx) => (
                        <button
                          key={slide.id}
                          type="button"
                          data-testid={`lifestyle-slide-${idx}`}
                          onClick={() => setActiveSlideIdx(idx)}
                          aria-label={lang === 'ar' ? slide.objectTypeAr : slide.objectTypeEn}
                          className={`group text-start rounded-xl overflow-hidden border-2 transition-all bg-white dark:bg-[#0F1A2B] ${
                            activeSlideIdx === idx
                              ? 'border-[#17243A] dark:border-[#19B5A5] ring-2 ring-[#19B5A5]/25'
                              : 'border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div className="aspect-[4/3] w-full overflow-hidden bg-[#EFECE6] dark:bg-[#0B1322]">
                            <img
                              src={slide.imageUrl}
                              alt=""
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <p className="px-2 py-1.5 text-[10px] font-bold text-[#17243A] dark:text-slate-200 truncate text-center">
                            {lang === 'ar' ? slide.objectTypeAr : slide.objectTypeEn}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Active Slide Caption + Demo QR Production Separation Notice */}
                  <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1322] p-3.5 space-y-1">
                    <p className="text-xs font-extrabold text-[#17243A] dark:text-white">
                      {lang === 'ar'
                        ? activeLifestyleSlide.objectTypeAr
                        : activeLifestyleSlide.objectTypeEn}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {lang === 'ar'
                        ? activeLifestyleSlide.captionAr
                        : activeLifestyleSlide.captionEn}
                    </p>
                    <p
                      data-testid="demo-qr-separation-note"
                      className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/70 dark:border-slate-800"
                    >
                      {lang === 'ar'
                        ? 'ملاحظة: تعرض صور المعاينة رمز QR تجريبيًا غير حقيقي لإظهار الشكل النهائي؛ بينما تبقى ملفات التصميم والطباعة 300 DPI بمساحة QR بيضاء صافية لاستبدالها بكود المستخدم الفعلي.'
                        : 'Note: Showcase imagery displays a realistic non-real Demo QR code for presentation only; Editable SVG and 300 DPI Print-Ready files retain a clean blank white QR zone for dynamic user QR insertion.'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="aspect-[4/3] w-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-[#F7F6F2] dark:bg-[#0B1322] p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-4">
                  {isPilotProduct && surfaceDataUri ? (
                    <div className="w-full max-w-[300px] flex flex-col items-center gap-2">
                      <img
                        src={surfaceDataUri}
                        alt={`${design.titleEn} live temporary artwork preview`}
                        className="max-h-[190px] w-auto object-contain drop-shadow-[0_14px_26px_rgba(15,23,42,0.18)]"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                      <Camera className="w-5 h-5" />
                    </div>
                  )}
                  <div className="max-w-md space-y-1.5">
                    <h3 className="text-sm font-extrabold text-[#17243A] dark:text-white">
                      {lang === 'ar'
                        ? isPilotProduct
                          ? 'معاينة Artwork حقيقية مؤقتة · بانتظار التصوير الواقعي'
                          : 'فتحة الصور الفوتوغرافية الواقعية'
                        : isPilotProduct
                        ? 'Temporary Live Artwork Preview · Pending Studio Photography'
                        : 'Lifestyle Object Photography Slot'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {media
                        ? lang === 'ar'
                          ? media.missingAssetNoteAr
                          : media.missingAssetNoteEn
                        : lang === 'ar'
                        ? 'هذا القالب يعرض حاليًا المعاينة المتجهية الفعلية وملف التصدير. فتحة الصور الفوتوغرافية مهيأة للإضافة دون إعادة تصميم الصفحة.'
                        : 'Lifestyle photography slot prepared cleanly for future studio photography. Use Detail or Print Preview below to inspect live artwork.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {isPilotProduct && (
                      <button
                        type="button"
                        onClick={() => setGalleryMode('studio_3d')}
                        className="px-4 py-2 rounded-xl bg-[#17243A] dark:bg-[#19B5A5] text-white dark:text-[#070D17] text-xs font-extrabold"
                      >
                        {lang === 'ar' ? 'فتح استوديو 3D التفاعلي' : 'Open 3D Studio'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setGalleryMode('print')}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] text-xs font-bold text-[#17243A] dark:text-white"
                    >
                      {lang === 'ar' ? 'معاينة ملف الطباعة' : 'Inspect Print Sheet'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: DETAIL & MACRO TEXTURE */}
          {galleryMode === 'detail' && (
            <div data-testid="gallery-panel-detail" className="space-y-4">
              {media?.macroDetailUrl ? (
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#151A24] border border-slate-200/80 dark:border-slate-800">
                  <img
                    src={media.macroDetailUrl}
                    alt={lang === 'ar' ? media.macroDetailAltAr : media.macroDetailAltEn}
                    className={`w-full h-full object-contain transition-transform duration-500 ${
                      macroInspectZoom ? 'scale-125' : 'scale-100'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setMacroInspectZoom((z) => !z)}
                    className="absolute bottom-3 end-3 px-3 py-1.5 rounded-xl bg-[#17243A]/90 text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#17243A]"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>
                      {macroInspectZoom
                        ? lang === 'ar'
                          ? 'إعادة الحجم الطبيعي'
                          : '1.0× View'
                        : lang === 'ar'
                        ? 'تكبير فحص الخامة'
                        : 'Inspect Grain 1.25×'}
                    </span>
                  </button>
                </div>
              ) : null}

              {/* Live Customized Vector Artwork Detail Comparison */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#EFECE6] dark:bg-[#0B1322] p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-extrabold text-[#17243A] dark:text-white">
                    {lang === 'ar'
                      ? 'فحص تفاصيل العمل الفني المخصص وبصمة FindIt QR'
                      : 'Live Artwork & Brand Signature Inspection'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {FINISH_LABELS[materialFinish][lang]}
                  </span>
                </div>

                <div className="flex items-center justify-center py-3">
                  {isPilotProduct && (isStaticProductionSticker && design.originalDesignUrl ? design.originalDesignUrl : surfaceDataUri) ? (
                    <img
                      src={isStaticProductionSticker && design.originalDesignUrl ? design.originalDesignUrl : surfaceDataUri}
                      alt={`${design.titleEn} live customized macro artwork`}
                      className="max-h-[268px] w-auto drop-shadow-[0_14px_30px_rgba(15,23,42,0.18)]"
                    />
                  ) : (
                    <TagProductPreview
                      seed={design.slug}
                      primaryHex={primaryHex}
                      secondaryHex={design.secondaryHex}
                      badgeColorHex={design.badgeColorHex}
                      silhouette={design.shapeSilhouette}
                      badgeText={calloutText}
                      size="lg"
                    />
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/80 dark:border-slate-800 pt-3">
                  {lang === 'ar'
                    ? 'تحافظ المنطقة العاجية حول كود QR على تباين قراءة ISO-18004 دون تداخل، مع تضمين بصمة FindIt QR الدقيقة خارج إطار المسح.'
                    : 'The warm alabaster quiet zone protects ISO-18004 scan contrast while anchoring the understated FindIt QR emblem outside the active code region.'}
                </p>
              </div>
            </div>
          )}

          {/* MODE 3: INTERACTIVE 3D STUDIO */}
          {galleryMode === 'studio_3d' && (
            <div data-testid="gallery-panel-3d" className="space-y-3">
              {isPilotProduct ? (
                <>
                  <Label3DMockupStage
                    design={design}
                    renderOptions={renderOptions}
                    darkTheme={darkTheme}
                    lang={lang}
                    heightClass="h-[380px] sm:h-[440px]"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
                    <span>
                      {lang === 'ar'
                        ? 'اسحب للتدوير · استخدم أزرار + / - أو عجلة الماوس للتكبير والتصغير'
                        : 'Drag to orbit · Use + / - or scroll wheel to zoom · Switch studio camera angles'}
                    </span>
                    <span dir="ltr" className="font-mono font-semibold text-[#17243A] dark:text-slate-200">
                      {dims.widthMm} × {dims.heightMm} mm
                    </span>
                  </div>
                </>
              ) : (
                <div className="aspect-[4/3] w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#EFECE6] dark:bg-[#0B1322] p-6 flex flex-col items-center justify-center text-center gap-4">
                  <TagProductPreview
                    seed={design.slug}
                    primaryHex={primaryHex}
                    secondaryHex={design.secondaryHex}
                    badgeColorHex={design.badgeColorHex}
                    silhouette={design.shapeSilhouette}
                    badgeText={calloutText}
                    size="lg"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                    {lang === 'ar'
                      ? 'عارض 3D التفاعلي متاح لسلسلة التصاميم التجريبية المتقدمة؛ يعرض هذا القالب الأرشيفي معاينة الشكل المسطحة وملف التصدير المتجهي.'
                      : 'Interactive WebGL 3D Studio is enabled for the flagship pilot collection; this archive template renders its flat silhouette and exportable vector QR.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MODE 4: SEPARATED PRINT PREVIEW & EXPORTS */}
          {galleryMode === 'print' && (
            <div data-testid="gallery-panel-print" className="space-y-4">
              {isPilotProduct ? (
                <>
                  {/* Sub-mode Toggle: Final Print-Ready vs Layered Editable SVG */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex rounded-xl bg-[#F4F7FB] dark:bg-[#0B1322] border border-slate-200 dark:border-slate-800 p-1 text-xs font-bold">
                      <button
                        type="button"
                        data-testid="print-sub-ready"
                        onClick={() => setPrintSubMode('print_ready')}
                        className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors ${
                          printSubMode === 'print_ready'
                            ? 'bg-[#17243A] dark:bg-[#19B5A5] text-white dark:text-[#070D17]'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'ملف الطباعة 300 DPI' : 'Print-Ready Sheet'}</span>
                      </button>
                      <button
                        type="button"
                        data-testid="print-sub-editable"
                        onClick={() => setPrintSubMode('editable_source')}
                        className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors ${
                          printSubMode === 'editable_source'
                            ? 'bg-[#17243A] dark:bg-[#19B5A5] text-white dark:text-[#070D17]'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <FileCode2 className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'ملف المتجهات SVG' : 'Editable Layers SVG'}</span>
                      </button>
                    </div>

                    {printSubMode === 'print_ready' && !isStaticProductionSticker && (
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showPrintGuides}
                          onChange={(e) => setShowPrintGuides(e.target.checked)}
                          className="rounded border-slate-300 text-[#19B5A5] focus:ring-[#19B5A5]"
                        />
                        <Eye className="w-3.5 h-3.5 text-[#19B5A5]" />
                        <span>
                          {lang === 'ar' ? 'دلائل Bleed و CutContour' : 'Print Guides'}
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Flat Technical Canvas */}
                  {printSubMode === 'print_ready' ? (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white p-5 sm:p-6 flex flex-col items-center justify-center min-h-[340px]">
                      <img
                        src={isStaticProductionSticker && design.printFileUrl ? design.printFileUrl : printReadyDataUri}
                        alt={`${design.titleEn} print-ready sheet`}
                        className="max-h-[320px] w-auto object-contain"
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] dark:bg-[repeating-conic-gradient(#0f172a_0%_25%,#1e293b_0%_50%)] [background-size:20px_20px] p-6 flex items-center justify-center min-h-[340px]">
                      <img
                        src={isStaticProductionSticker && design.originalDesignUrl ? design.originalDesignUrl : editableDataUri}
                        alt={`${design.titleEn} editable vector layers`}
                        className="max-h-[280px] w-auto object-contain drop-shadow-md"
                      />
                    </div>
                  )}

                  {/* Technical Print Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] bg-[#F4F7FB] dark:bg-[#0B1322] p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 tabular-nums">
                    <div>
                      <span className="text-slate-400 font-semibold block">{lang === 'ar' ? 'القص النهائي' : 'TRIM'}</span>
                      <span dir="ltr" className="font-mono font-bold text-[#17243A] dark:text-white">
                        {dims.widthMm} × {dims.heightMm} mm
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block">{lang === 'ar' ? 'الامتداد' : 'BLEED'}</span>
                      <span dir="ltr" className="font-mono font-bold text-cyan-600 dark:text-cyan-400">+{dims.bleedMm} mm</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block">{lang === 'ar' ? 'الأمان' : 'SAFE ZONE'}</span>
                      <span dir="ltr" className="font-mono font-bold text-emerald-600 dark:text-emerald-400">-{dims.safeMarginMm} mm</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block">{lang === 'ar' ? 'المعيار' : 'STANDARD'}</span>
                      <span dir="ltr" className="font-mono font-bold text-[#17243A] dark:text-white">ISO-18004 · 300 DPI</span>
                    </div>
                  </div>

                  {/* Export Action Row (Gated by Ownership for Paid Templates) */}
                  {canUseOrDownloadTemplate ? (
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        data-testid="download-print-svg-btn"
                        onClick={handleDownloadPrintSvg}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#17243A] dark:bg-slate-800 hover:bg-[#2563EB] text-white text-xs font-bold transition-colors whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'تنزيل الطباعة SVG' : 'Download Print SVG'}</span>
                      </button>

                      <button
                        type="button"
                        data-testid="download-print-png-btn"
                        disabled={exportingPng}
                        onClick={() => void handleDownloadPrintPng()}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#19B5A5] hover:bg-teal-400 text-[#070D17] text-xs font-extrabold transition-colors whitespace-nowrap disabled:opacity-60"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>
                          {exportingPng
                            ? lang === 'ar'
                              ? 'جارٍ التصدير...'
                              : 'Exporting...'
                            : lang === 'ar'
                            ? 'تصدير 300 DPI PNG'
                            : 'Export 300 DPI PNG'}
                        </span>
                      </button>

                      <button
                        type="button"
                        data-testid="download-editable-svg-btn"
                        onClick={handleDownloadEditable}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] hover:border-[#2563EB] text-[#17243A] dark:text-white text-xs font-bold transition-colors whitespace-nowrap"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#19B5A5]" />
                        <span>{lang === 'ar' ? 'تنزيل ملف الطبقات SVG' : 'Editable Source SVG'}</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      data-testid="print-downloads-locked-notice"
                      className="rounded-xl border border-amber-300/70 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/30 p-3.5 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                        <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <span>
                          {lang === 'ar'
                            ? 'ملفات الإنتاج والطباعة 300 DPI لهذا القالب المدفوع متاحة فور شرائه أو تفعيل الباقة المناسبة.'
                            : 'Production SVG and 300 DPI Print PNG files for this paid template unlock immediately after purchase or plan upgrade.'}
                        </span>
                      </div>
                      <button
                        type="button"
                        data-testid="unlock-print-files-btn"
                        onClick={onPurchase}
                        className="px-4 py-2 rounded-xl bg-[#19B5A5] hover:bg-teal-400 text-[#070D17] text-xs font-extrabold whitespace-nowrap"
                      >
                        {lang === 'ar'
                          ? `شراء القالب (${design.priceSar} ر.س)`
                          : `Unlock ($${design.priceUsd})`}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 flex flex-col items-center justify-center gap-4 min-h-[340px]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {lang === 'ar' ? 'معاينة وتنزيل الكود المعياري (ISO 18004 SVG)' : 'ISO 18004 Vector Export'}
                  </span>
                  <QrCodeVector
                    svgRef={legacySvgRef}
                    seed={design.slug}
                    primaryColor={primaryHex}
                    accentColor={design.badgeColorHex}
                    badgeText={calloutText}
                    size={168}
                  />
                  <button
                    type="button"
                    data-testid="download-print-svg-btn"
                    onClick={handleDownloadPrintSvg}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#17243A] dark:bg-[#19B5A5] text-white dark:text-[#070D17] text-xs font-extrabold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'تنزيل نموذج SVG للطباعة' : 'Download Print SVG'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* RIGHT COLUMN (5 cols): Editorial Header, Primary CTA, Live Customization & Accordion */}
        <section className="lg:col-span-5 space-y-7">
          {/* Unboxed Editorial Header */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0F9D8E] dark:text-[#19B5A5]">
              {design.isPilotShowcase
                ? lang === 'ar'
                  ? `${domainLabel} · تجربة التصميم المتقدم`
                  : `${domainLabel} · Pilot Showcase Standard`
                : design.specialtyBadgeEn || design.specialtyBadgeAr
                ? `${domainLabel} · ${lang === 'ar' ? design.specialtyBadgeAr : design.specialtyBadgeEn}`
                : domainLabel}
            </p>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17243A] dark:text-white leading-tight text-balance">
              {lang === 'ar' ? design.titleAr : design.titleEn}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'ar' ? design.subtitleAr : design.subtitleEn}
            </p>
          </div>

          {/* Unboxed Price, Ownership & Specs Line */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-baseline justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                {ownershipStatus === 'free'
                  ? lang === 'ar'
                    ? 'حالة الملكية: مجاني ومتاح فورًا'
                    : 'Ownership: Free & Ready'
                  : ownershipStatus === 'purchased'
                  ? lang === 'ar'
                    ? 'حالة الملكية: مملوك برخصة نشطة'
                    : 'Ownership: Active Purchased License'
                  : ownershipStatus === 'included_in_plan'
                  ? lang === 'ar'
                    ? `حالة الملكية: مشمول في باقتك (${userPlanLabel || 'Plan'})`
                    : `Ownership: Included in ${userPlanLabel || 'Plan'}`
                  : ownershipStatus === 'locked'
                  ? lang === 'ar'
                    ? 'حالة الملكية: غير مملوك بعد (يتطلب شراء)'
                    : 'Ownership: Not Purchased Yet'
                  : lang === 'ar'
                  ? 'ترخيص التصميم الرقمي للطباعة'
                  : 'Digital Printable Design License'}
              </span>
              <span className="font-extrabold text-2xl sm:text-3xl text-[#17243A] dark:text-white tabular-nums">
                {isFreeTpl
                  ? lang === 'ar'
                    ? 'مجاني'
                    : 'Free'
                  : lang === 'ar'
                  ? `${design.priceSar} ر.س`
                  : `$${design.priceUsd}`}
              </span>
            </div>
            <span dir="ltr" className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
              {design.dimensionsMm} · 300 DPI
            </span>
          </div>

          {/* Clear Primary + Secondary Purchase & Ownership-Aware Actions */}
          <div className="space-y-2.5">
            <div className="flex items-stretch gap-2.5">
              {canUseOrDownloadTemplate ? (
                <button
                  type="button"
                  data-testid="use-design-item-btn"
                  onClick={onUseDesign}
                  className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-extrabold text-sm transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {draftReturnActive
                      ? lang === 'ar'
                        ? 'اعتماد هذا التصميم والعودة لنموذج الغرض'
                        : 'Select & Return to Item Form'
                      : lang === 'ar'
                      ? 'ربط هذا التصميم بغرض جديد'
                      : 'Apply This Design to an Item'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="primary-purchase-btn"
                  onClick={onPurchase}
                  className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#19B5A5] hover:bg-teal-400 text-[#070D17] font-extrabold text-sm transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>
                    {lang === 'ar'
                      ? `شراء وترخيص التصميم (${design.priceSar} ر.س)`
                      : `Purchase & Unlock ($${design.priceUsd})`}
                  </span>
                </button>
              )}

              {showFavorites && (
                <button
                  type="button"
                  data-testid="detail-favorite-btn"
                  aria-label={
                    isFavorite
                      ? lang === 'ar'
                        ? 'إزالة من المفضلة'
                        : 'Remove from favorites'
                      : lang === 'ar'
                      ? 'حفظ في المفضلة'
                      : 'Save to favorites'
                  }
                  onClick={onToggleFavorite}
                  className={`w-12 min-h-[48px] rounded-xl border inline-flex items-center justify-center transition-colors shrink-0 ${
                    isFavorite
                      ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] text-slate-500 hover:text-rose-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>

            {canUseOrDownloadTemplate ? (
              ownershipStatus === 'purchased' || ownershipStatus === 'included_in_plan' ? (
                <div
                  data-testid="detail-owned-status-banner"
                  className="w-full px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {ownershipStatus === 'purchased'
                      ? lang === 'ar'
                        ? 'تمتلك رخصة دائمة لهذا القالب ويمكنك استخدامه مع جميع أغراضك'
                        : 'You hold a permanent license for this template across your items'
                      : lang === 'ar'
                      ? `هذا القالب مشمول ومفعّل في باقتك الحالية (${userPlanLabel || 'Plan'})`
                      : `Included & unlocked with your current plan (${userPlanLabel || 'Plan'})`}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  data-testid="primary-purchase-btn"
                  onClick={onPurchase}
                  className="w-full min-h-[42px] px-5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] hover:border-[#19B5A5] text-[#17243A] dark:text-white font-bold text-xs transition-colors inline-flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#19B5A5]" />
                  <span>
                    {lang === 'ar'
                      ? 'إصدار شهادة ترخيص مجاني في سجل المشتريات'
                      : 'Claim Free License Certificate in Purchases'}
                  </span>
                </button>
              )
            ) : (
              <div
                data-testid="detail-locked-usage-notice"
                className="w-full px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {lang === 'ar'
                    ? 'يجب شراء القالب أو ترقية الباقة أولًا قبل ربطه بغرض أو تنزيل ملفات الطباعة.'
                    : 'Purchase this template or upgrade your plan before applying it to an item or downloading print files.'}
                </span>
              </div>
            )}
          </div>

          {/* Live Customization Bar (Syncs Detail Macro, 3D Studio, Editable SVG, and Print File) */}
          <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#17243A] dark:text-white inline-flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#19B5A5]" />
                <span>{lang === 'ar' ? 'تخصيص النص والخامة' : 'Customize Label & Finish'}</span>
              </h2>
              <span className="text-[11px] font-bold text-[#0F9D8E] dark:text-[#19B5A5] inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تحديث مباشر' : 'Live Sync'}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="detail-callout-input"
                  className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
                >
                  {isFixedCustomization
                    ? lang === 'ar'
                      ? 'العبارة (ثابتة):'
                      : 'Callout (Locked):'
                    : isBilingualBatchStyle
                    ? lang === 'ar'
                      ? 'الرسالة الإنجليزية (English Message):'
                      : 'English Message:'
                    : lang === 'ar'
                    ? 'العبارة على الملصق:'
                    : 'Callout Text:'}
                </label>
                <input
                  id="detail-callout-input"
                  type="text"
                  maxLength={42}
                  disabled={isFixedCustomization}
                  value={calloutText}
                  onChange={(e) => setCalloutText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1322] text-xs font-semibold text-[#17243A] dark:text-white disabled:opacity-55"
                />
              </div>

              {isPilotProduct && (
                <div>
                  <label
                    htmlFor="detail-serial-input"
                    className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
                  >
                    {lang === 'ar' ? 'الرقم التسلسلي ورابط QR:' : 'Serial & QR Target:'}
                  </label>
                  <input
                    id="detail-serial-input"
                    type="text"
                    maxLength={22}
                    value={serialCode}
                    onChange={(e) => setSerialCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1322] text-xs font-mono text-[#17243A] dark:text-white"
                  />
                </div>
              )}
            </div>

            {isPilotProduct && (
              <div className="space-y-3">
                {isBilingualBatchStyle ? (
                  <div className="space-y-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#F7FAFC] dark:bg-[#0B1322] p-3">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 inline-flex items-center gap-1">
                        <Palette className="w-3 h-3" />
                        <span>{lang === 'ar' ? threeColorConfig.primaryAr : threeColorConfig.primaryEn}</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {threeColorConfig.primarySwatches.map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            aria-label={`Primary Color ${hex}`}
                            onClick={() => setPrimaryHex(hex)}
                            style={{ backgroundColor: hex }}
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${
                              primaryHex.toLowerCase() === hex.toLowerCase()
                                ? 'border-[#17243A] dark:border-white scale-110 ring-2 ring-[#19B5A5]/40'
                                : 'border-white dark:border-slate-700'
                            }`}
                          />
                        ))}
                        <input
                          type="color"
                          data-testid="pebble-primary-picker"
                          aria-label={lang === 'ar' ? 'اختيار لون أساسي مخصص' : 'Custom primary color'}
                          value={primaryHex}
                          onChange={(e) => setPrimaryHex(e.target.value)}
                          className="w-7 h-6 p-0 border border-slate-300 dark:border-slate-700 rounded cursor-pointer bg-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                          {lang === 'ar' ? threeColorConfig.secondaryAr : threeColorConfig.secondaryEn}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {threeColorConfig.secondarySwatches.map((hex) => (
                            <button
                              key={hex}
                              type="button"
                              aria-label={`Secondary Color ${hex}`}
                              onClick={() => setSecondaryHex(hex)}
                              style={{ backgroundColor: hex }}
                              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                secondaryHex.toLowerCase() === hex.toLowerCase()
                                  ? 'border-[#19B5A5] scale-110 ring-2 ring-[#19B5A5]/35'
                                  : 'border-slate-300 dark:border-slate-700'
                              }`}
                            />
                          ))}
                          <input
                            type="color"
                            data-testid="pebble-secondary-picker"
                            aria-label={lang === 'ar' ? 'اختيار لون ثانوي مخصص' : 'Custom secondary color'}
                            value={secondaryHex}
                            onChange={(e) => setSecondaryHex(e.target.value)}
                            className="w-7 h-6 p-0 border border-slate-300 dark:border-slate-700 rounded cursor-pointer bg-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                          {lang === 'ar' ? threeColorConfig.accentAr : threeColorConfig.accentEn}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {threeColorConfig.accentSwatches.map((hex) => (
                            <button
                              key={hex}
                              type="button"
                              aria-label={`Accent Color ${hex}`}
                              onClick={() => setAccentHex(hex)}
                              style={{ backgroundColor: hex }}
                              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                accentHex.toLowerCase() === hex.toLowerCase()
                                  ? 'border-[#17243A] dark:border-white scale-110 ring-2 ring-[#FF7A00]/35'
                                  : 'border-white dark:border-slate-700'
                              }`}
                            />
                          ))}
                          <input
                            type="color"
                            data-testid="pebble-accent-picker"
                            aria-label={lang === 'ar' ? 'اختيار لون لمسات مخصص' : 'Custom accent color'}
                            value={accentHex}
                            onChange={(e) => setAccentHex(e.target.value)}
                            className="w-7 h-6 p-0 border border-slate-300 dark:border-slate-700 rounded cursor-pointer bg-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 inline-flex items-center gap-1">
                      <Palette className="w-3 h-3" />
                      <span>{lang === 'ar' ? 'لون الحبر الرئيسي:' : 'Colorway:'}</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {paletteSwatches.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          aria-label={`Color ${hex}`}
                          onClick={() => setPrimaryHex(hex)}
                          style={{ backgroundColor: hex }}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${
                            primaryHex === hex
                              ? 'border-[#19B5A5] scale-110 ring-2 ring-[#19B5A5]/35'
                              : 'border-white dark:border-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="detail-substrate-select"
                    className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
                  >
                    {lang === 'ar' ? 'خامة الطباعة (تظهر في 3D):' : 'Printable Stock (3D Finish):'}
                  </label>
                  <select
                    id="detail-substrate-select"
                    value={materialFinish}
                    onChange={(e) => setMaterialFinish(e.target.value as PrintMaterialFinish)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1322] text-xs font-semibold text-[#17243A] dark:text-white"
                  >
                    {(Object.keys(FINISH_LABELS) as PrintMaterialFinish[]).map((fin) => (
                      <option key={fin} value={fin}>
                        {FINISH_LABELS[fin][lang]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {(design.pilotArtStyle === 'progrid_iso' ||
              design.pilotArtStyle === 'voyager_stamp' ||
              isBilingualBatchStyle) && (
              <div>
                <label
                  htmlFor="detail-sublabel-input"
                  className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
                >
                  {isBilingualBatchStyle
                    ? lang === 'ar'
                      ? 'الرسالة العربية (Arabic Message):'
                      : 'Arabic Message:'
                    : lang === 'ar'
                    ? 'التسمية الفرعية:'
                    : 'Classification Sub-Label:'}
                </label>
                <input
                  id="detail-sublabel-input"
                  type="text"
                  maxLength={44}
                  dir={isBilingualBatchStyle ? 'rtl' : undefined}
                  value={customSubLabel}
                  onChange={(e) => setCustomSubLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1322] text-xs font-semibold text-[#17243A] dark:text-white"
                />
              </div>
            )}
          </div>

          {/* CLEAN COLLAPSIBLE INFORMATION ARCHITECTURE (1px hairline dividers, zero card-in-card clutter) */}
          <div className="border-t border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
            {/* 1. Design Story */}
            <div>
              <button
                type="button"
                aria-expanded={openSections.story}
                onClick={() => toggleSection('story')}
                className="w-full py-3.5 flex items-center justify-between gap-2 text-start text-sm font-extrabold text-[#17243A] dark:text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#19B5A5]" />
                  <span>{lang === 'ar' ? 'قصة التصميم والهوية البصرية' : 'Design Story'}</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    openSections.story ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openSections.story && (
                <div className="pb-4 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>
                    {media
                      ? lang === 'ar'
                        ? media.designStoryAr
                        : media.designStoryEn
                      : lang === 'ar'
                      ? design.pilotConceptAr || design.subtitleAr
                      : design.pilotConceptEn || design.subtitleEn}
                  </p>
                  {(design.visualIdentityAr || design.visualIdentityEn) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {lang === 'ar' ? design.visualIdentityAr : design.visualIdentityEn}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 2. Materials & Finish */}
            <div>
              <button
                type="button"
                aria-expanded={openSections.materials}
                onClick={() => toggleSection('materials')}
                className="w-full py-3.5 flex items-center justify-between gap-2 text-start text-sm font-extrabold text-[#17243A] dark:text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#19B5A5]" />
                  <span>{lang === 'ar' ? 'الخامات والتشطيبات المقترحة' : 'Materials & Finish'}</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    openSections.materials ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openSections.materials && (
                <div className="pb-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p className="font-semibold text-[#17243A] dark:text-white">
                    {lang === 'ar' ? design.materialAr : design.materialEn}
                  </p>
                  {media && (
                    <p>{lang === 'ar' ? media.finishNotesAr : media.finishNotesEn}</p>
                  )}
                  {design.printSpecs?.recommendedMaterials.map((mat) => (
                    <div key={mat.id} className="pt-1">
                      <span className="font-bold text-[#17243A] dark:text-white">
                        {lang === 'ar' ? mat.nameAr : mat.nameEn}:{' '}
                      </span>
                      <span>{lang === 'ar' ? mat.notesAr : mat.notesEn}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Dimensions */}
            <div>
              <button
                type="button"
                aria-expanded={openSections.dimensions}
                onClick={() => toggleSection('dimensions')}
                className="w-full py-3.5 flex items-center justify-between gap-2 text-start text-sm font-extrabold text-[#17243A] dark:text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-[#19B5A5]" />
                  <span>{lang === 'ar' ? 'المقاسات والأبعاد المتاحة' : 'Dimensions'}</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    openSections.dimensions ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openSections.dimensions && (
                <div className="pb-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <p dir="ltr" className="font-mono font-bold text-[#17243A] dark:text-white text-start">
                    {design.dimensionsMm} ({design.weatherproofRating})
                  </p>
                  {design.printSpecs && (
                    <ul className="space-y-1">
                      {design.printSpecs.availableSizesMm.map((sz, i) => (
                        <li key={i} dir="ltr" className="font-mono text-start">
                          · {sz}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* 4. Print Specifications */}
            <div>
              <button
                type="button"
                aria-expanded={openSections.print_specs}
                onClick={() => toggleSection('print_specs')}
                className="w-full py-3.5 flex items-center justify-between gap-2 text-start text-sm font-extrabold text-[#17243A] dark:text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <Printer className="w-4 h-4 text-[#19B5A5]" />
                  <span>{lang === 'ar' ? 'مواصفات الطباعة والقص' : 'Print Specifications'}</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    openSections.print_specs ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openSections.print_specs && (
                <div
                  data-testid="verified-print-specs-list"
                  className="pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-slate-300"
                >
                  {getRealTemplatePrintSpecsSummary(design, lang).map((spec, idx) => (
                    <div key={`${spec.label}-${idx}`}>
                      <span className="text-slate-400 block">{spec.label}</span>
                      <span className="font-semibold text-[#17243A] dark:text-white">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. What's Included */}
            <div>
              <button
                type="button"
                aria-expanded={openSections.included}
                onClick={() => toggleSection('included')}
                className="w-full py-3.5 flex items-center justify-between gap-2 text-start text-sm font-extrabold text-[#17243A] dark:text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-[#19B5A5]" />
                  <span>{lang === 'ar' ? 'ما يتضمنه المنتج الرقمي' : "What's Included"}</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    openSections.included ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openSections.included && (
                <ul className="pb-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {(media
                    ? lang === 'ar'
                      ? media.whatsIncludedAr
                      : media.whatsIncludedEn
                    : lang === 'ar'
                    ? design.featuresAr
                    : design.featuresEn
                  ).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#19B5A5] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 6. Recommended Uses */}
            <div>
              <button
                type="button"
                aria-expanded={openSections.uses}
                onClick={() => toggleSection('uses')}
                className="w-full py-3.5 flex items-center justify-between gap-2 text-start text-sm font-extrabold text-[#17243A] dark:text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#19B5A5]" />
                  <span>{lang === 'ar' ? 'الاستخدامات المناسبة' : 'Recommended Uses'}</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    openSections.uses ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openSections.uses && (
                <p className="pb-4 text-xs sm:text-sm font-semibold text-[#17243A] dark:text-slate-200 leading-relaxed">
                  {(lang === 'ar' ? design.recommendedForAr : design.recommendedForEn).join(' · ')}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
